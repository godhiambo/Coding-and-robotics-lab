// Milestone Minds Robotics Lab: classroom + competition API (Cloudflare Worker + D1).
// All rules, timing and scoring are decided HERE (server time), never trusted from the browser.
// Needs a D1 binding named DB. Tables are created automatically on first use.

import { Bridge, Gear, Hydro, Labs2, Mcu, Rescue } from "./labs.js";

const J = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { "content-type": "application/json", "cache-control": "no-store" } });
const bad = (m, s = 400) => J({ error: m }, s);

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS classes(id TEXT PRIMARY KEY, code TEXT UNIQUE, name TEXT, grade TEXT, subject TEXT, key_hash TEXT, created INTEGER)`,
  `CREATE TABLE IF NOT EXISTS learners(id TEXT PRIMARY KEY, class_id TEXT, name TEXT, tok_hash TEXT, extra_s INTEGER DEFAULT 0, joined INTEGER, removed INTEGER DEFAULT 0)`,
  `CREATE INDEX IF NOT EXISTS ix_learner_tok ON learners(tok_hash)`,
  `CREATE TABLE IF NOT EXISTS comps(id TEXT PRIMARY KEY, class_id TEXT, title TEXT, level TEXT, rules TEXT, status TEXT, start_at INTEGER, deadline INTEGER, paused_at INTEGER, published INTEGER DEFAULT 0, created INTEGER)`,
  `CREATE TABLE IF NOT EXISTS attempts(id TEXT PRIMARY KEY, comp_id TEXT, learner_id TEXT, n INTEGER, rules TEXT, started INTEGER, submitted INTEGER, score INTEGER DEFAULT 0, breakdown TEXT, win INTEGER DEFAULT 0, collisions INTEGER DEFAULT 0, time_s REAL DEFAULT 0, blocks INTEGER DEFAULT 0, progress INTEGER DEFAULT 0, prog TEXT, status TEXT, disq INTEGER DEFAULT 0)`,
  `CREATE INDEX IF NOT EXISTS ix_att_comp ON attempts(comp_id)`,
  `CREATE TABLE IF NOT EXISTS events(id INTEGER PRIMARY KEY AUTOINCREMENT, comp_id TEXT, learner_id TEXT, type TEXT, data TEXT, at INTEGER)`,
  `CREATE INDEX IF NOT EXISTS ix_ev_comp ON events(comp_id)`,
  `CREATE TABLE IF NOT EXISTS certs(id TEXT PRIMARY KEY, comp_id TEXT, learner_id TEXT, class_id TEXT, kind TEXT, rank INTEGER, name TEXT, title TEXT, school TEXT, score INTEGER, issued INTEGER, revoked INTEGER DEFAULT 0, ver INTEGER DEFAULT 1, supersedes TEXT, replaced_by TEXT, f_name TEXT, f_title TEXT, f_sig TEXT, t_name TEXT, t_title TEXT, t_school TEXT, t_sig TEXT)`,
  `CREATE TABLE IF NOT EXISTS phys(attempt_id TEXT PRIMARY KEY, comp_id TEXT, learner_id TEXT, ok INTEGER, t REAL, status TEXT, ts INTEGER)`,
  `CREATE TABLE IF NOT EXISTS payments(id TEXT PRIMARY KEY, class_id TEXT, plan TEXT, amount INTEGER, phone TEXT, checkout_id TEXT UNIQUE, status TEXT, receipt TEXT UNIQUE, note TEXT, created INTEGER, paid_at INTEGER)`,
  `CREATE TABLE IF NOT EXISTS pairs(code TEXT PRIMARY KEY, offer TEXT, answer TEXT, ts INTEGER)`,
  `CREATE TABLE IF NOT EXISTS sigs(id TEXT PRIMARY KEY, data TEXT)`,
  `CREATE TABLE IF NOT EXISTS settings(k TEXT PRIMARY KEY, v TEXT)`,
  `CREATE TABLE IF NOT EXISTS counters(k TEXT PRIMARY KEY, n INTEGER)`,
  `CREATE INDEX IF NOT EXISTS ix_cert_comp ON certs(comp_id)`,
];
let ready = false;
// ---------- plans ----------
// Existing classes (plan is NULL) are grandfathered as "founding" partners until an admin changes them. New classes start on "free".
const testAmt = (env) => (env && +env.MPESA_TEST_AMOUNT >= 1 && +env.MPESA_TEST_AMOUNT <= 100 ? Math.round(+env.MPESA_TEST_AMOUNT) : 0); // optional secret: charge only this many KSh while testing
const PRICES = { starter: 5000, growth: 12000, advanced: 25000 }, TERM_DAYS = 90;
const PLANS = { free: { label: "Free", learners: 10, comps: 2 }, founding: { label: "Founding partner", learners: 150, comps: 999 }, starter: { label: "Starter", learners: 50, comps: 999 }, growth: { label: "Growth", learners: 150, comps: 999 }, advanced: { label: "Advanced", learners: 400, comps: 999 } };
function planOf(c) {
  const raw = PLANS[c.plan] ? c.plan : "founding", until = +c.plan_until || 0, expired = raw !== "free" && until > 0 && until < Date.now(), eff = expired ? "free" : raw;
  return { plan: raw, label: PLANS[raw].label, effective: eff, expired, until, learners: PLANS[eff].learners, comps: PLANS[eff].comps };
}

async function init(db) { if (ready) return; await db.batch(SCHEMA.map((s) => db.prepare(s))); for (const q of ["ALTER TABLE attempts ADD COLUMN level TEXT", "ALTER TABLE classes ADD COLUMN t_name TEXT", "ALTER TABLE classes ADD COLUMN t_title TEXT", "ALTER TABLE classes ADD COLUMN t_school TEXT", "ALTER TABLE classes ADD COLUMN t_sig TEXT", "ALTER TABLE classes ADD COLUMN t_status TEXT", "ALTER TABLE classes ADD COLUMN t_auth INTEGER DEFAULT 0", "ALTER TABLE classes ADD COLUMN plan TEXT", "ALTER TABLE classes ADD COLUMN plan_until INTEGER DEFAULT 0"]) { try { await db.prepare(q).run(); } catch (e) {} } ready = true; }

const hex = (b) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
const sha = async (s) => hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(String(s))));
const rnd = (n) => hex(crypto.getRandomValues(new Uint8Array(n)));
const uid = () => rnd(8);
const AL = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function short(n) { let s = ""; for (const x of crypto.getRandomValues(new Uint8Array(n))) s += AL[x % AL.length]; return s; }
const classCode = () => short(5);
const normCode = (v) => String(v == null ? "" : v).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const str = (v, n) => String(v == null ? "" : v).trim().slice(0, n);

// ---------- rules ----------
export function cleanRules(r) {
  r = r || {};
  const dur = [5, 10, 15, 30, 60].includes(+r.duration) ? +r.duration : 15;
  const att = [1, 3, 0].includes(+r.attempts) ? +r.attempts : 1; // 0 = unlimited
  return {
    mila: !!r.mila, hints: !!r.hints, suggest: !!r.suggest,
    duration: dur, attempts: att, mode: "individual",
    speed: r.speed !== false,                       // speed is a scoring factor (else tie-breaker only)
    board: r.board === "after" ? "after" : "live",  // when learners may see the leaderboard
    targetTime: clamp(+r.targetTime || 60, 5, 3600),
    parBlocks: clamp(+r.parBlocks || 12, 1, 200),
    certs: r.certs !== false, top3: r.top3 !== false, partic: r.partic !== false, special: r.special !== false, dl: r.dl !== false,
  };
}

// ---------- scoring (observable outcomes, configurable) ----------
export function score(rules, r) {
  r = r || {};
  const win = !!r.win, prog = clamp(Math.round(+r.progress || 0), 0, 100), col = clamp(Math.round(+r.collisions || 0), 0, 999);
  const blocks = clamp(Math.round(+r.blocks || 0), 0, 9999), time = Math.max(0, +r.time || 0);
  const odo = Math.max(0, +r.odo || 0), ideal = Math.max(0, +r.ideal || 0), ran = win || prog > 0 || time > 0;
  const b = {};
  b.reach = win ? 300 : Math.round(300 * (prog / 100) * 0.6);
  b.complete = win ? 200 : 0;
  b.collisions = ran ? Math.max(0, 150 - 30 * col) : 0;
  b.logic = win && blocks > 0 ? Math.round(150 * Math.min(1, rules.parBlocks / blocks)) : 0;
  b.time = win && rules.speed ? Math.round(100 * Math.min(1, rules.targetTime / Math.max(time, 1))) : 0;
  b.movement = win ? (ideal > 0 && odo > 0 ? Math.round(100 * Math.min(1, ideal / Math.max(odo, ideal))) : 100) : 0;
  const total = b.reach + b.complete + b.collisions + b.logic + b.time + b.movement;
  return { total, breakdown: b, max: rules.speed ? 1000 : 900 };
}
const better = (a, b) => (b.score - a.score) || (b.win - a.win) || (a.collisions - b.collisions) || (a.time_s - b.time_s);

// ---------- helpers ----------
async function teacher(db, body) {
  const code = normCode(body.code), key = normCode(body.key);
  if (!code || !key) return null;
  const c = await db.prepare("SELECT * FROM classes WHERE code=?").bind(code).first();
  if (!c || c.key_hash !== (await sha(key))) return null;
  return c;
}
async function learner(db, body) {
  const lt = str(body.lt, 80); if (!lt) return null;
  return await db.prepare("SELECT * FROM learners WHERE tok_hash=? AND removed=0").bind(await sha(lt)).first();
}
const ev = (db, comp, lid, type, data) => db.prepare("INSERT INTO events(comp_id,learner_id,type,data,at) VALUES(?,?,?,?,?)").bind(comp || null, lid || null, type, data ? JSON.stringify(data).slice(0, 400) : null, Date.now()).run();
function compView(c) { return { id: c.id, title: c.title, level: c.level, levels: String(c.level || "").split(",").filter(Boolean), status: c.status, startAt: c.start_at, deadline: c.deadline, pausedAt: c.paused_at, published: !!c.published, rules: JSON.parse(c.rules || "{}") }; }
function effDeadline(c, l) { return (c.deadline || 0) + ((l && l.extra_s) || 0) * 1000; }

async function leaderboard(db, compId, withNames) {
  const rows = (await db.prepare("SELECT a.*, l.name AS lname FROM attempts a JOIN learners l ON l.id=a.learner_id WHERE a.comp_id=? ORDER BY a.started").bind(compId).all()).results || [];
  const byL = {};
  rows.forEach((a) => { (byL[a.learner_id] = byL[a.learner_id] || { name: a.lname, id: a.learner_id, list: [] }).list.push(a); });
  const out = Object.values(byL).map((L) => {
    const done = L.list.filter((a) => a.status === "submitted" && !a.disq).sort(better);
    const open = L.list.filter((a) => a.status === "open").pop();
    const per = {}; done.forEach((a) => { const k = a.level || ""; if (!per[k]) per[k] = a; });
    const bests = Object.values(per), best = bests[0], sum = (f) => bests.reduce((t, a) => t + (+a[f] || 0), 0);
    return { id: L.id, name: L.name, score: sum("score"), win: sum("win"), collisions: sum("collisions"), time: sum("time_s"), missions: bests.length,
      progress: best ? best.progress : (open ? open.progress : 0), status: open ? "Running" : (best ? "Submitted" : (L.list.some((a) => a.disq) ? "Disqualified" : "Waiting")), attempts: L.list.length,
      detail: withNames ? L.list.map((a) => ({ id: a.id, n: a.n, level: a.level, status: a.status, score: a.score, win: a.win, collisions: a.collisions, time: a.time_s, blocks: a.blocks, progress: a.progress, disq: a.disq })) : undefined };
  });
  out.sort((a, b) => (b.score - a.score) || (b.win - a.win) || (a.collisions - b.collisions) || (a.time - b.time));
  let rank = 0;
  out.forEach((r, i) => { const p = out[i - 1]; if (!p || p.score !== r.score || p.win !== r.win || p.collisions !== r.collisions || p.time !== r.time) rank = i + 1; r.rank = rank; });
  return out;
}

// ---------- routes ----------
const R = {};

// ---- phone <-> laptop pairing for Connected Robotics (WebRTC handshake only; control data never touches the server) ----
const PCODE = /^\d{6}$/, SDP_MAX = 12000;
R["pair/offer"] = async (db, b) => {
  const code = String(b.code || ""), sdp = String(b.sdp || ""); if (!PCODE.test(code) || !sdp || sdp.length > SDP_MAX) return bad("Bad pairing request.");
  const now = Date.now(); await db.prepare("DELETE FROM pairs WHERE ts<?").bind(now - 600000).run();
  const ex = await db.prepare("SELECT ts FROM pairs WHERE code=?").bind(code).first(); if (ex) return bad("Try again.", 409);
  await db.prepare("INSERT INTO pairs(code,offer,answer,ts) VALUES(?,?,NULL,?)").bind(code, sdp, now).run(); return J({ ok: true });
};
R["pair/join"] = async (db, b) => {
  const code = String(b.code || ""); if (!PCODE.test(code)) return bad("Enter the 6-digit code.");
  const r = await db.prepare("SELECT offer,ts FROM pairs WHERE code=?").bind(code).first();
  if (!r || Date.now() - r.ts > 600000) return bad("Code not found or expired.", 404); return J({ sdp: r.offer });
};
R["pair/answer"] = async (db, b) => {
  const code = String(b.code || ""), sdp = String(b.sdp || ""); if (!PCODE.test(code) || !sdp || sdp.length > SDP_MAX) return bad("Bad pairing request.");
  const r = await db.prepare("UPDATE pairs SET answer=? WHERE code=? AND answer IS NULL").bind(sdp, code).run();
  return r.meta && r.meta.changes ? J({ ok: true }) : bad("Code not found or already used.", 404);
};
R["pair/poll"] = async (db, b) => {
  const code = String(b.code || ""); if (!PCODE.test(code)) return bad("Bad code.");
  const r = await db.prepare("SELECT answer FROM pairs WHERE code=?").bind(code).first(); if (!r) return bad("Expired.", 404);
  if (r.answer) await db.prepare("DELETE FROM pairs WHERE code=?").bind(code).run(); return J({ sdp: r.answer || null });
};

R["class/create"] = async (db, b) => {
  const name = str(b.name, 60); if (!name) return bad("Give the class a name.");
  const key = short(6), id = uid();
  let code = classCode();
  for (let i = 0; i < 5; i++) { const x = await db.prepare("SELECT 1 FROM classes WHERE code=?").bind(code).first(); if (!x) break; code = classCode(); }
  await db.prepare("INSERT INTO classes(id,code,name,grade,subject,key_hash,created,plan,plan_until) VALUES(?,?,?,?,?,?,?,'free',0)").bind(id, code, name, str(b.grade, 30), str(b.subject, 60), await sha(key), Date.now()).run();
  return J({ code, key, name });
};

R["class/get"] = async (db, b, env) => {
  const c = await teacher(db, b); if (!c) return bad("Wrong class code or teacher key.", 401);
  const ls = (await db.prepare("SELECT id,name,extra_s,joined FROM learners WHERE class_id=? AND removed=0 ORDER BY name").bind(c.id).all()).results || [];
  const cs = (await db.prepare("SELECT * FROM comps WHERE class_id=? ORDER BY created DESC").bind(c.id).all()).results || [];
  const pl = planOf(c); pl.used = ls.length; pl.offers = Object.keys(PRICES).map((k) => ({ id: k, label: PLANS[k].label, learners: PLANS[k].learners, price: testAmt(env) || PRICES[k], days: TERM_DAYS })); pl.test = testAmt(env); pl.pay = !!(env && env.MPESA_CONSUMER_KEY);
  return J({ cls: { code: c.code, name: c.name, grade: c.grade, subject: c.subject }, plan: pl, learners: ls, comps: cs.map(compView), now: Date.now() });
};

// ---------- M-PESA (Daraja STK Push) ----------
// Secrets: MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, MPESA_SHORTCODE, MPESA_PASSKEY, MPESA_CALLBACK_SECRET.
// Optional: MPESA_ENV ("production" for live, default sandbox), MPESA_TYPE ("till" for Buy Goods), MPESA_BASE (testing).
const mpesaReady = (env) => !!(env.MPESA_CONSUMER_KEY && env.MPESA_CONSUMER_SECRET && env.MPESA_SHORTCODE && env.MPESA_PASSKEY && env.MPESA_CALLBACK_SECRET);
const mpesaBase = (env) => env.MPESA_BASE || (env.MPESA_ENV === "production" ? "https://api.safaricom.co.ke" : "https://sandbox.safaricom.co.ke");
function nairobiStamp() { const d = new Date(Date.now() + 3 * 3600000), p = (n) => String(n).padStart(2, "0"); return d.getUTCFullYear() + p(d.getUTCMonth() + 1) + p(d.getUTCDate()) + p(d.getUTCHours()) + p(d.getUTCMinutes()) + p(d.getUTCSeconds()); }
function msisdn(v) { let p = String(v || "").replace(/[^\d]/g, ""); if (/^0[17]\d{8}$/.test(p)) p = "254" + p.slice(1); else if (/^[17]\d{8}$/.test(p)) p = "254" + p; return /^254[17]\d{8}$/.test(p) ? p : ""; }
async function mpesaToken(env) {
  const r = await fetch(mpesaBase(env) + "/oauth/v1/generate?grant_type=client_credentials", { headers: { authorization: "Basic " + btoa(env.MPESA_CONSUMER_KEY + ":" + env.MPESA_CONSUMER_SECRET) } });
  const j = await r.json().catch(() => ({})); if (!r.ok || !j.access_token) throw new Error("M-PESA sign-in failed");
  return j.access_token;
}
async function activatePlan(db, pay, receipt) {
  const r = await db.prepare("UPDATE payments SET status='paid',receipt=?,paid_at=? WHERE id=? AND status='pending'").bind(receipt || null, Date.now(), pay.id).run();
  if (!(r.meta && r.meta.changes)) return false; // already handled: never activate twice
  const c = await db.prepare("SELECT plan,plan_until FROM classes WHERE id=?").bind(pay.class_id).first(); if (!c) return false;
  const now = Date.now(), start = c.plan === pay.plan && +c.plan_until > now ? +c.plan_until : now;
  await db.prepare("UPDATE classes SET plan=?,plan_until=? WHERE id=?").bind(pay.plan, start + TERM_DAYS * 86400000, pay.class_id).run();
  return true;
}
R["pay/start"] = async (db, b, env, request) => {
  const c = await teacher(db, b); if (!c) return bad("Not allowed.", 401);
  if (!mpesaReady(env)) return bad("Online payment is not set up yet. Please contact Milestone Minds.", 503);
  const plan = String(b.plan || ""); if (!PRICES[plan]) return bad("Pick a plan."); const amount = testAmt(env) || PRICES[plan];
  const phone = msisdn(b.phone); if (!phone) return bad("Enter the M-PESA phone number, for example 0712345678.");
  const recent = await db.prepare("SELECT 1 FROM payments WHERE class_id=? AND status='pending' AND created>?").bind(c.id, Date.now() - 60000).first();
  if (recent) return bad("A payment request was just sent. Check your phone, or wait a minute and try again.", 429);
  const ts = nairobiStamp(), till = env.MPESA_TYPE === "till", token = await mpesaToken(env);
  const origin = new URL(request.url).origin;
  const res = await fetch(mpesaBase(env) + "/mpesa/stkpush/v1/processrequest", { method: "POST", headers: { authorization: "Bearer " + token, "content-type": "application/json" }, body: JSON.stringify({
    BusinessShortCode: env.MPESA_SHORTCODE, Password: btoa(env.MPESA_SHORTCODE + env.MPESA_PASSKEY + ts), Timestamp: ts,
    TransactionType: till ? "CustomerBuyGoodsOnline" : "CustomerPayBillOnline", Amount: amount, PartyA: phone, PartyB: env.MPESA_PARTYB || env.MPESA_SHORTCODE, PhoneNumber: phone,
    CallBackURL: origin + "/api/mpesa/callback/" + env.MPESA_CALLBACK_SECRET, AccountReference: c.code, TransactionDesc: "Robotics Lab " + PLANS[plan].label }) });
  const j = await res.json().catch(() => ({}));
  if (!res.ok || String(j.ResponseCode) !== "0" || !j.CheckoutRequestID) return bad("M-PESA could not send the request: " + String(j.errorMessage || j.ResponseDescription || "try again").slice(0, 100), 502);
  const id = uid();
  await db.prepare("INSERT INTO payments(id,class_id,plan,amount,phone,checkout_id,status,created) VALUES(?,?,?,?,?,?,'pending',?)").bind(id, c.id, plan, amount, phone.slice(0, 5) + "***" + phone.slice(-3), j.CheckoutRequestID, Date.now()).run();
  return J({ id, amount, message: "Check your phone and enter your M-PESA PIN." });
};
R["pay/status"] = async (db, b, env) => {
  const c = await teacher(db, b); if (!c) return bad("Not allowed.", 401);
  let p = await db.prepare("SELECT * FROM payments WHERE id=? AND class_id=?").bind(str(b.id, 40), c.id).first(); if (!p) return bad("Payment not found.", 404);
  if (p.status === "pending" && Date.now() - p.created > 20000 && mpesaReady(env)) { // the callback can be late: ask M-PESA directly
    try {
      const ts = nairobiStamp(), token = await mpesaToken(env);
      const r = await fetch(mpesaBase(env) + "/mpesa/stkpushquery/v1/query", { method: "POST", headers: { authorization: "Bearer " + token, "content-type": "application/json" }, body: JSON.stringify({ BusinessShortCode: env.MPESA_SHORTCODE, Password: btoa(env.MPESA_SHORTCODE + env.MPESA_PASSKEY + ts), Timestamp: ts, CheckoutRequestID: p.checkout_id }) });
      const j = await r.json().catch(() => ({}));
      if (r.ok && j.ResultCode !== undefined && j.ResultCode !== null) {
        if (String(j.ResultCode) === "0") await activatePlan(db, p, null); // M-PESA itself confirms this request was paid (the callback may have been lost)
        else await db.prepare("UPDATE payments SET status='failed',note=? WHERE id=? AND status='pending'").bind(String(j.ResultDesc || "").slice(0, 100), p.id).run();
      }
    } catch (e) {}
    p = await db.prepare("SELECT * FROM payments WHERE id=?").bind(p.id).first();
  }
  return J({ status: p.status, note: p.note || "", receipt: p.receipt || "" });
};
async function mpesaCallback(db, env, secret, body) {
  const ok = J({ ResultCode: 0, ResultDesc: "Accepted" });
  if (!env.MPESA_CALLBACK_SECRET || secret !== env.MPESA_CALLBACK_SECRET) return bad("Not allowed.", 401);
  const cb = body && body.Body && body.Body.stkCallback; if (!cb || !cb.CheckoutRequestID) return ok;
  const p = await db.prepare("SELECT * FROM payments WHERE checkout_id=?").bind(String(cb.CheckoutRequestID).slice(0, 80)).first(); if (!p || p.status !== "pending") return ok;
  if (+cb.ResultCode !== 0) { await db.prepare("UPDATE payments SET status='failed',note=? WHERE id=? AND status='pending'").bind(String(cb.ResultDesc || "").slice(0, 100), p.id).run(); return ok; }
  const items = (cb.CallbackMetadata && cb.CallbackMetadata.Item) || [], get = (n) => { const x = items.find((i) => i.Name === n); return x ? x.Value : undefined; };
  const paid = +get("Amount"), receipt = String(get("MpesaReceiptNumber") || "").slice(0, 30);
  if (!receipt || paid !== p.amount) { await db.prepare("UPDATE payments SET status='mismatch',note=? WHERE id=? AND status='pending'").bind("amount " + paid + " receipt " + receipt, p.id).run(); return ok; }
  try { await activatePlan(db, p, receipt); } catch (e) { /* duplicate receipt etc.: stays unactivated for admin review */ }
  return ok;
}
R["admin/payments"] = async (db, b, env) => {
  if (!(await admin(env, b))) return bad("Not allowed.", 401);
  const rows = (await db.prepare("SELECT p.id,p.plan,p.amount,p.phone,p.status,p.receipt,p.note,p.created,p.paid_at,c.code,c.name FROM payments p LEFT JOIN classes c ON c.id=p.class_id ORDER BY p.created DESC LIMIT 100").all()).results || [];
  return J({ payments: rows });
};

R["class/learner"] = async (db, b) => {
  const c = await teacher(db, b); if (!c) return bad("Not allowed.", 401);
  const l = await db.prepare("SELECT * FROM learners WHERE id=? AND class_id=?").bind(str(b.learnerId, 40), c.id).first(); if (!l) return bad("Learner not found.", 404);
  if (b.action === "remove") { await db.prepare("UPDATE learners SET removed=1 WHERE id=?").bind(l.id).run(); await ev(db, null, l.id, "learner_removed", { name: l.name }); }
  else if (b.action === "extra") { const m = clamp(Math.round(+b.minutes || 0), 0, 120); await db.prepare("UPDATE learners SET extra_s=? WHERE id=?").bind(m * 60, l.id).run(); await ev(db, null, l.id, "accommodation", { minutes: m }); }
  else return bad("Unknown action.");
  return J({ ok: true });
};

R["comp/create"] = async (db, b) => {
  const c = await teacher(db, b); if (!c) return bad("Not allowed.", 401);
  const title = str(b.title, 80), level = (Array.isArray(b.levels) ? b.levels : String(b.level || "").split(",")).map((x) => str(x, 40).replace(/[^\w-]/g, "")).filter(Boolean).slice(0, 30).join(","); if (!title || !level) return bad("Pick at least one mission and give the competition a title.");
  const pl = planOf(c), nc = (await db.prepare("SELECT COUNT(*) AS n FROM comps WHERE class_id=?").bind(c.id).first()).n;
  if (nc >= pl.comps) return bad("The " + pl.label + " plan allows " + pl.comps + " competitions. Ask your school to upgrade to run more.", 403);
  const id = uid();
  await db.prepare("INSERT INTO comps(id,class_id,title,level,rules,status,published,created) VALUES(?,?,?,?,?,?,0,?)").bind(id, c.id, title, level, JSON.stringify(cleanRules(b.rules)), "draft", Date.now()).run();
  await ev(db, id, null, "comp_created", { title, level });
  return J({ id });
};

R["comp/act"] = async (db, b) => {
  const c = await teacher(db, b); if (!c) return bad("Not allowed.", 401);
  const comp = await db.prepare("SELECT * FROM comps WHERE id=? AND class_id=?").bind(str(b.compId, 40), c.id).first(); if (!comp) return bad("Competition not found.", 404);
  const now = Date.now(), rules = JSON.parse(comp.rules || "{}"), a = b.action;
  if (a === "start") {
    if (comp.status !== "draft") return bad("This competition has already started.");
    const live = await db.prepare("SELECT 1 FROM comps WHERE class_id=? AND status IN ('live','paused')").bind(c.id).first();
    if (live) return bad("Another competition is already running for this class. End it first.");
    const start = now + 3000; // 3-second countdown, same for everyone
    await db.prepare("UPDATE comps SET status='live',start_at=?,deadline=? WHERE id=?").bind(start, start + rules.duration * 60000, comp.id).run();
  } else if (a === "pause") {
    if (comp.status !== "live") return bad("Only a running competition can be paused.");
    await db.prepare("UPDATE comps SET status='paused',paused_at=? WHERE id=?").bind(now, comp.id).run();
  } else if (a === "resume") {
    if (comp.status !== "paused") return bad("It is not paused.");
    await db.prepare("UPDATE comps SET status='live',deadline=deadline+?,paused_at=NULL WHERE id=?").bind(now - comp.paused_at, comp.id).run();
  } else if (a === "end") {
    if (comp.status === "ended") return bad("Already ended.");
    await db.prepare("UPDATE comps SET status='ended',deadline=?,paused_at=NULL WHERE id=?").bind(Math.min(now, comp.deadline || now), comp.id).run();
    await db.prepare("UPDATE attempts SET status='locked' WHERE comp_id=? AND status='open'").bind(comp.id).run();
  } else if (a === "extend") {
    if (!["live", "paused"].includes(comp.status)) return bad("Only a running competition can be extended.");
    const m = clamp(Math.round(+b.minutes || 0), 1, 60);
    await db.prepare("UPDATE comps SET deadline=deadline+? WHERE id=?").bind(m * 60000, comp.id).run();
  } else if (a === "publish" || a === "unpublish") {
    await db.prepare("UPDATE comps SET published=? WHERE id=?").bind(a === "publish" ? 1 : 0, comp.id).run();
    if (a === "publish") await issueCerts(db, comp, c, rules);
    else await db.prepare("UPDATE certs SET revoked=1 WHERE comp_id=? AND revoked=0").bind(comp.id).run();
  } else if (a === "innovation") {
    const l = await db.prepare("SELECT * FROM learners WHERE id=? AND class_id=?").bind(str(b.learnerId, 40), c.id).first(); if (!l) return bad("Learner not found.", 404);
    await db.prepare("DELETE FROM certs WHERE comp_id=? AND kind='innovation'").bind(comp.id).run();
    await addCert(db, comp, c, l.id, l.name, "innovation", 0, 0);
    await ev(db, comp.id, l.id, "innovation_award", null);
    return J({ ok: true });
  } else if (a === "disq" || a === "undisq") {
    const att = await db.prepare("SELECT * FROM attempts WHERE id=? AND comp_id=?").bind(str(b.attemptId, 40), comp.id).first(); if (!att) return bad("Attempt not found.", 404);
    await db.prepare("UPDATE attempts SET disq=? WHERE id=?").bind(a === "disq" ? 1 : 0, att.id).run();
    await ev(db, comp.id, att.learner_id, a === "disq" ? "disqualified" : "reinstated", { reason: str(b.reason, 120) });
    return J({ ok: true });
  } else return bad("Unknown action.");
  await ev(db, comp.id, null, "teacher_" + a, a === "extend" ? { minutes: b.minutes } : null);
  return J({ ok: true });
};

const PHYS_BONUS = 150;
R["phys/decide"] = async (db, b) => {
  const c = await teacher(db, b); if (!c) return bad("Not allowed.", 401);
  const comp = await db.prepare("SELECT id FROM comps WHERE id=? AND class_id=?").bind(str(b.compId, 40), c.id).first(); if (!comp) return bad("Competition not found.", 404);
  const aid = str(b.attemptId, 40), p = await db.prepare("SELECT * FROM phys WHERE attempt_id=? AND comp_id=?").bind(aid, comp.id).first();
  if (!p) return bad("Physical run not found.", 404); if (p.status !== "pending") return bad("Already decided.", 409);
  const yes = !!b.approve; await db.prepare("UPDATE phys SET status=? WHERE attempt_id=? AND status='pending'").bind(yes ? "confirmed" : "rejected", aid).run();
  if (yes && p.ok) {
    const at = await db.prepare("SELECT score,breakdown FROM attempts WHERE id=?").bind(aid).first();
    if (at) { let bd = {}; try { bd = JSON.parse(at.breakdown || "{}"); } catch {} bd.physical = PHYS_BONUS; await db.prepare("UPDATE attempts SET score=score+?,breakdown=? WHERE id=?").bind(PHYS_BONUS, JSON.stringify(bd), aid).run(); }
  }
  await ev(db, comp.id, null, yes ? "phys-confirm" : "phys-reject", { attempt: aid });
  return J({ ok: true });
};
R["comp/board"] = async (db, b) => {
  const c = await teacher(db, b); if (!c) return bad("Not allowed.", 401);
  const comp = await db.prepare("SELECT * FROM comps WHERE id=? AND class_id=?").bind(str(b.compId, 40), c.id).first(); if (!comp) return bad("Competition not found.", 404);
  const rows = await leaderboard(db, comp.id, true);
  const evs = (await db.prepare("SELECT e.type,e.data,e.at,l.name FROM events e LEFT JOIN learners l ON l.id=e.learner_id WHERE e.comp_id=? ORDER BY e.id DESC LIMIT 60").bind(comp.id).all()).results || [];
  const enrolled = (await db.prepare("SELECT COUNT(*) AS n FROM learners WHERE class_id=? AND removed=0").bind(c.id).first()).n;
  const phys = ((await db.prepare("SELECT p.attempt_id AS id,p.ok,p.t,p.status,l.name FROM phys p JOIN learners l ON l.id=p.learner_id WHERE p.comp_id=? ORDER BY p.ts DESC LIMIT 100").bind(comp.id).all()).results) || [];
  return J({ comp: compView(comp), rows, events: evs, enrolled, phys, now: Date.now() });
};

R["join"] = async (db, b) => {
  const code = normCode(b.code), name = str(b.name, 40);
  if (!code || !name) return bad("Enter the class code and your name.");
  const c = await db.prepare("SELECT * FROM classes WHERE code=?").bind(code).first(); if (!c) return bad("That class code was not found.", 404);
  const pl = planOf(c), used = (await db.prepare("SELECT COUNT(*) AS n FROM learners WHERE class_id=? AND removed=0").bind(c.id).first()).n;
  if (used >= pl.learners) return bad("This class is full (" + pl.learners + " learners on the " + pl.label + (pl.expired ? " plan, which has expired" : " plan") + "). Ask your teacher to upgrade the class.", 403);
  const lt = rnd(16), id = uid();
  await db.prepare("INSERT INTO learners(id,class_id,name,tok_hash,joined) VALUES(?,?,?,?,?)").bind(id, c.id, name, await sha(lt), Date.now()).run();
  return J({ lt, name, cls: { name: c.name, grade: c.grade, code: c.code } });
};

R["me"] = async (db, b) => {
  const l = await learner(db, b); if (!l) return bad("Please join your class again.", 401);
  const c = await db.prepare("SELECT * FROM classes WHERE id=?").bind(l.class_id).first();
  const comp = await db.prepare("SELECT * FROM comps WHERE class_id=? AND status IN ('live','paused') ORDER BY created DESC").bind(l.class_id).first()
    || await db.prepare("SELECT * FROM comps WHERE class_id=? AND status='ended' ORDER BY created DESC").bind(l.class_id).first();
  const out = { now: Date.now(), name: l.name, cls: { name: c.name, grade: c.grade, code: c.code }, comp: null };
  if (comp) {
    const v = compView(comp); v.deadline = effDeadline(comp, l);
    const mine = (await db.prepare("SELECT id,n,level,status,score,win,collisions,time_s AS time,progress,breakdown,disq FROM attempts WHERE comp_id=? AND learner_id=? ORDER BY n").bind(comp.id, l.id).all()).results || [];
    // late close: an open attempt past the deadline is locked by the server
    if (comp.status === "ended" || (comp.status === "live" && Date.now() > v.deadline + 15000)) {
      await db.prepare("UPDATE attempts SET status='locked' WHERE comp_id=? AND learner_id=? AND status='open'").bind(comp.id, l.id).run();
      mine.forEach((a) => { if (a.status === "open") a.status = "locked"; });
    }
    out.comp = v;
    if (comp.published) {
      const lb = await leaderboard(db, comp.id, false), best = await db.prepare("SELECT breakdown FROM attempts WHERE comp_id=? AND status='submitted' AND disq=0").bind(comp.id).all();
      const keys = ["reach", "complete", "collisions", "logic", "time", "movement"], sum = {}, n = {};
      (best.results || []).forEach((r) => { try { const bd = JSON.parse(r.breakdown || "{}"); keys.forEach((k) => { if (bd[k] != null) { sum[k] = (sum[k] || 0) + bd[k]; n[k] = (n[k] || 0) + 1; } }); } catch (e) {} });
      const scored = lb.filter((r) => r.status === "Submitted"), me2 = lb.find((r) => r.id === l.id);
      out.stats = { avg: scored.length ? Math.round(scored.reduce((t, r) => t + r.score, 0) / scored.length) : 0, n: scored.length, rank: me2 ? me2.rank : 0, crit: Object.fromEntries(keys.map((k) => [k, n[k] ? Math.round(sum[k] / n[k]) : 0])) };
    }
    out.mine = mine.map((a) => ({ ...a, breakdown: a.breakdown ? JSON.parse(a.breakdown) : null }));
    const showBoard = v.rules.board === "live" || comp.published;
    if (showBoard) { const rows = await leaderboard(db, comp.id, false); out.board = rows.slice(0, 15).map((r) => ({ rank: r.rank, name: r.name, score: r.score, status: r.status, me: r.id === l.id })); }
    else out.boardHidden = true;
  }
  return J(out);
};

R["attempt/start"] = async (db, b) => {
  const l = await learner(db, b); if (!l) return bad("Please join your class again.", 401);
  const comp = await db.prepare("SELECT * FROM comps WHERE id=? AND class_id=?").bind(str(b.compId, 40), l.class_id).first(); if (!comp) return bad("Competition not found.", 404);
  const now = Date.now(), rules = JSON.parse(comp.rules || "{}"), dl = effDeadline(comp, l);
  if (comp.status !== "live") return bad(comp.status === "paused" ? "The competition is paused." : comp.status === "draft" ? "It has not started yet." : "The competition has ended.");
  if (now < comp.start_at - 500) return bad("Wait for the countdown.");
  if (now > dl) return bad("Time is up.");
  const lvls = String(comp.level || "").split(",").filter(Boolean), lvl = lvls.includes(str(b.level, 40)) ? str(b.level, 40) : lvls[0];
  const open = await db.prepare("SELECT * FROM attempts WHERE comp_id=? AND learner_id=? AND status='open'").bind(comp.id, l.id).first();
  if (open) return J({ level: open.level || lvls[0], attemptId: open.id, startedAt: open.started, deadline: dl, now, rules: JSON.parse(open.rules), prog: open.prog ? JSON.parse(open.prog) : null, resumed: true });
  const used = (await db.prepare("SELECT COUNT(*) AS n FROM attempts WHERE comp_id=? AND learner_id=? AND COALESCE(level,?)=?").bind(comp.id, l.id, lvls[0], lvl).first()).n;
  if (rules.attempts > 0 && used >= rules.attempts) return bad("You have used all your attempts.");
  const id = uid();
  await db.prepare("INSERT INTO attempts(id,comp_id,learner_id,n,rules,started,status,level) VALUES(?,?,?,?,?,?,'open',?)").bind(id, comp.id, l.id, used + 1, comp.rules, now, lvl).run();
  await ev(db, comp.id, l.id, "attempt_start", { n: used + 1 });
  return J({ level: lvl, attemptId: id, startedAt: now, deadline: dl, now, rules, prog: null });
};

async function openAttempt(db, l, b) {
  const a = await db.prepare("SELECT * FROM attempts WHERE id=? AND learner_id=?").bind(str(b.attemptId, 40), l.id).first(); if (!a) return { err: bad("Attempt not found.", 404) };
  const comp = await db.prepare("SELECT * FROM comps WHERE id=?").bind(a.comp_id).first();
  if (a.status !== "open") return { err: bad("This attempt is locked.", 409) };
  return { a, comp, dl: effDeadline(comp, l) };
}

R["attempt/save"] = async (db, b) => {
  const l = await learner(db, b); if (!l) return bad("Please join your class again.", 401);
  const o = await openAttempt(db, l, b); if (o.err) return o.err;
  const now = Date.now(); if (o.comp.status === "ended" || now > o.dl + 15000) return bad("Time is up.", 409);
  await db.prepare("UPDATE attempts SET prog=?,progress=?,collisions=? WHERE id=?").bind(JSON.stringify(b.prog || []).slice(0, 20000), clamp(Math.round(+b.progress || 0), 0, 100), clamp(Math.round(+b.collisions || 0), 0, 999), o.a.id).run();
  const e = (Array.isArray(b.events) ? b.events : []).slice(0, 8);
  for (const x of e) await ev(db, o.comp.id, l.id, str(x.type, 30), x.data);
  return J({ ok: true, now, status: o.comp.status, deadline: o.dl });
};


// Engineering labs in a competition: the server re-runs the physics on the submitted design (nothing is trusted from the phone).
function labEval(level, d) {
  d = d || {};
  if (level.startsWith("lab-bridge-")) return Bridge.evaluate(d.mem, level.slice(11));
  if (level.startsWith("lab-gear-")) return Gear.evaluate({ ...d, ch: level.slice(9) });
  if (level.startsWith("lab-hydro-")) return Hydro.evaluate({ ...d, ch: level.slice(10) });
  if (level.startsWith("lab-arm-")) return Labs2.Arm.evaluate({ ...d, ch: level.slice(8) });
  if (level.startsWith("lab-sumo-")) return Labs2.Sumo.evaluate({ ...d, ch: level.slice(9) });
  if (level.startsWith("lab-rescue-")) return Rescue.evaluate({ ...d, arena: level.slice(11) });
  if (level.startsWith("lab-mcu-")) return Mcu.evaluate({ ...d, ch: "mcu_" + level.slice(8) });
  if (level.startsWith("lab-ai-")) return Labs2.AI.evaluate({ ...d, ch: level.slice(7) });
  return { ok: false, t: "Unknown lab." };
}
function labScore(rules, ev, elapsed) {
  const ok = !!ev.ok, st = ev.stars || 0, b = {};
  b.reach = ok ? 300 : 0; b.complete = ok ? 200 : 0; b.collisions = ok ? (st >= 2 ? 150 : 75) : 0; b.logic = st >= 3 ? 150 : 0;
  b.time = ok && rules.speed ? Math.round(100 * Math.min(1, rules.targetTime / Math.max(elapsed, 1))) : 0; b.movement = ok ? 100 : 0;
  return { total: b.reach + b.complete + b.collisions + b.logic + b.time + b.movement, breakdown: b, max: rules.speed ? 1000 : 900 };
}
R["attempt/submit"] = async (db, b) => {
  const l = await learner(db, b); if (!l) return bad("Please join your class again.", 401);
  const o = await openAttempt(db, l, b); if (o.err) return o.err;
  const now = Date.now();
  if (now > o.dl + 15000) return bad("Time is up.", 409); // small grace for network delay
  const rules = JSON.parse(o.a.rules);
  if (String(o.a.level || "").startsWith("lab-")) {
    const ev2 = labEval(o.a.level, b.design), elapsed = Math.max(1, (now - o.a.started) / 1000), sc = labScore(rules, ev2, elapsed), nb = Array.isArray(b.design && b.design.mem) ? b.design.mem.length : Array.isArray(b.design && b.design.tr) ? b.design.tr.length : Array.isArray(b.design && b.design.prog) ? b.design.prog.length : Array.isArray(b.design && b.design.log) ? b.design.log.length : 0;
    await db.prepare("UPDATE attempts SET status='submitted',submitted=?,score=?,breakdown=?,win=?,collisions=0,time_s=?,blocks=?,progress=?,prog=? WHERE id=?")
      .bind(now, sc.total, JSON.stringify(sc.breakdown), ev2.ok ? 1 : 0, elapsed, clamp(nb, 0, 9999), ev2.ok ? 100 : 0, JSON.stringify(b.design || {}).slice(0, 20000), o.a.id).run();
    const ph = b.design && b.design.phys;
    if (String(o.a.level).startsWith("lab-rescue-") && ev2.ok && ph && typeof ph === "object")
      await db.prepare("INSERT OR REPLACE INTO phys(attempt_id,comp_id,learner_id,ok,t,status,ts) VALUES(?,?,?,?,?,'pending',?)").bind(o.a.id, o.comp.id, l.id, ph.ok ? 1 : 0, clamp(Math.round((+ph.t || 0) * 10) / 10, 0, 9999), now).run();
    await ev(db, o.comp.id, l.id, "submit", { score: sc.total, win: !!ev2.ok, lab: true });
    return J({ score: sc.total, breakdown: sc.breakdown, max: sc.max, msg: ev2.t });
  }
  const r = b.result || {}, s = score(rules, r);
  await db.prepare("UPDATE attempts SET status='submitted',submitted=?,score=?,breakdown=?,win=?,collisions=?,time_s=?,blocks=?,progress=?,prog=? WHERE id=?")
    .bind(now, s.total, JSON.stringify(s.breakdown), r.win ? 1 : 0, clamp(Math.round(+r.collisions || 0), 0, 999), Math.max(0, +r.time || 0), clamp(Math.round(+r.blocks || 0), 0, 9999), r.win ? 100 : clamp(Math.round(+r.progress || 0), 0, 100), JSON.stringify(b.prog || []).slice(0, 20000), o.a.id).run();
  await ev(db, o.comp.id, l.id, "submit", { score: s.total, win: !!r.win });
  return J({ score: s.total, breakdown: s.breakdown, max: s.max });
};

// Used by /api/mila: is this learner currently allowed to use Mila?
export async function milaAllowed(env, lt) {
  if (!env.DB || !lt) return true;
  try {
    await init(env.DB);
    const l = await env.DB.prepare("SELECT * FROM learners WHERE tok_hash=? AND removed=0").bind(await sha(lt)).first(); if (!l) return true;
    const comp = await env.DB.prepare("SELECT * FROM comps WHERE class_id=? AND status IN ('live','paused') ORDER BY created DESC").bind(l.class_id).first(); if (!comp) return true;
    const open = await env.DB.prepare("SELECT 1 FROM attempts WHERE comp_id=? AND learner_id=? AND status='open'").bind(comp.id, l.id).first();
    if (!open) return true; // only blocked while an attempt is actually open
    return !!JSON.parse(comp.rules || "{}").mila;
  } catch (e) { return true; }
}


// ---------- awards & certificates ----------
// IDs look like MM-RBL-2026-00001. Each certificate stores a snapshot of the signatories at issue time,
// so later profile changes never alter a certificate that has already been issued.
const FOUNDER_DEFAULT = { name: "Godfrey Odhiambo", title: "Founder, Milestone Minds", sig: "" };
async function founder(db) { const r = await db.prepare("SELECT v FROM settings WHERE k='founder'").first(); return { ...FOUNDER_DEFAULT, ...(r ? JSON.parse(r.v) : {}) }; }
async function putSig(db, data) { if (!data) return ""; const id = (await sha(data)).slice(0, 20); await db.prepare("INSERT OR IGNORE INTO sigs(id,data) VALUES(?,?)").bind(id, data).run(); return id; }
function cleanSig(v) { v = String(v || ""); if (!v) return ""; if (!/^data:image\/(png|jpeg);base64,[A-Za-z0-9+\/=]+$/.test(v) || v.length > 220000) return null; return v; }
const teacherOk = (c) => !!(c.t_status === "verified" && c.t_auth && c.t_name && c.t_sig);
async function nextCertId(db) {
  const y = new Date().getFullYear(), k = "cert" + y;
  await db.prepare("INSERT OR IGNORE INTO counters(k,n) VALUES(?,0)").bind(k).run();
  const r = await db.prepare("UPDATE counters SET n=n+1 WHERE k=? RETURNING n").bind(k).first();
  return "MM-RBL-" + y + "-" + String(r.n).padStart(5, "0");
}
async function addCert(db, comp, cls, lid, name, kind, rank, sc, extra) {
  const id = await nextCertId(db), f = await founder(db), t = teacherOk(cls);
  const fs = f.sig ? await putSig(db, f.sig) : "";
  const ts = t ? await putSig(db, (await db.prepare("SELECT t_sig FROM classes WHERE id=?").bind(cls.id).first()).t_sig) : "";
  const x = extra || {};
  await db.prepare("INSERT INTO certs(id,comp_id,learner_id,class_id,kind,rank,name,title,school,score,issued,revoked,ver,supersedes,f_name,f_title,f_sig,t_name,t_title,t_school,t_sig) VALUES(?,?,?,?,?,?,?,?,?,?,?,0,?,?,?,?,?,?,?,?,?)")
    .bind(id, comp.id, lid, cls.id, kind, rank, name, comp.title, (cls.t_school || cls.name), sc, Date.now(), x.ver || 1, x.supersedes || null, f.name, f.title, fs, t ? cls.t_name : "", t ? (cls.t_title || "Teacher") : "", t ? (cls.t_school || cls.name) : "", ts).run();
  return id;
}
async function issueCerts(db, comp, cls, rules) {
  if (rules.certs === false) return;
  const have = await db.prepare("SELECT COUNT(*) AS n FROM certs WHERE comp_id=? AND revoked=0 AND kind!='innovation'").bind(comp.id).first();
  await db.prepare("UPDATE certs SET revoked=0 WHERE comp_id=? AND revoked=1").bind(comp.id).run(); // re-publish restores earlier certificates
  if (have.n > 0 || (await db.prepare("SELECT COUNT(*) AS n FROM certs WHERE comp_id=?").bind(comp.id).first()).n > 0) return;
  const rows = (await leaderboard(db, comp.id, false)).filter((r) => r.status === "Submitted" && r.score >= 0);
  for (const r of rows) {
    if (r.rank <= 3 && rules.top3 !== false) await addCert(db, comp, cls, r.id, r.name, r.rank === 1 ? "gold" : r.rank === 2 ? "silver" : "bronze", r.rank, r.score);
    else if (rules.partic !== false) await addCert(db, comp, cls, r.id, r.name, "participation", r.rank, r.score);
  }
  if (rules.special !== false) {
    const all = (await db.prepare("SELECT a.*, l.name AS lname FROM attempts a JOIN learners l ON l.id=a.learner_id WHERE a.comp_id=? AND a.status='submitted' AND a.disq=0 AND a.win=1").bind(comp.id).all()).results || [];
    if (all.length) {
      const f = all.slice().sort((x, y) => (x.time_s - y.time_s) || (y.score - x.score))[0];
      const pz = all.slice().sort((x, y) => (x.collisions - y.collisions) || (x.blocks - y.blocks) || (y.score - x.score))[0];
      await addCert(db, comp, cls, f.learner_id, f.lname, "fastest", 0, f.score);
      if (pz.learner_id !== f.learner_id || all.length === 1) await addCert(db, comp, cls, pz.learner_id, pz.lname, "precision", 0, pz.score);
    }
  }
  await ev(db, comp.id, null, "certs_issued", null);
}
const certView = (c) => ({ id: c.id, kind: c.kind, rank: c.rank, name: c.name, title: c.title, school: c.school, score: c.score, issued: c.issued, revoked: !!c.revoked, compId: c.comp_id, ver: c.ver || 1,
  f: { name: c.f_name, title: c.f_title, sig: c.f_sig || "" }, t: c.t_name ? { name: c.t_name, title: c.t_title, school: c.t_school, sig: c.t_sig || "" } : null });

R["cert/mine"] = async (db, b) => {
  const l = await learner(db, b); if (!l) return bad("Please join your class again.", 401);
  const rows = (await db.prepare("SELECT c.* FROM certs c JOIN comps p ON p.id=c.comp_id WHERE c.learner_id=? AND c.revoked=0 AND p.published=1 ORDER BY c.issued DESC").bind(l.id).all()).results || [];
  const comps = {}; for (const r of rows) { if (!comps[r.comp_id]) { const p = await db.prepare("SELECT rules FROM comps WHERE id=?").bind(r.comp_id).first(); comps[r.comp_id] = JSON.parse((p && p.rules) || "{}"); } }
  return J({ certs: rows.map((r) => ({ ...certView(r), dl: comps[r.comp_id].dl !== false })) });
};
R["cert/verify"] = async (db, b) => {
  const id = str(b.id, 40).toUpperCase().replace(/[^A-Z0-9-]/g, "");
  const c = await db.prepare("SELECT c.*, p.published AS pub FROM certs c JOIN comps p ON p.id=c.comp_id WHERE c.id=?").bind(id).first();
  if (!c) return J({ found: false, valid: false });
  const status = c.revoked === 2 ? "Superseded" : (c.revoked || !c.pub) ? "Revoked" : "Valid";
  return J({ found: true, valid: status === "Valid", status, replacedBy: c.replaced_by || null, issuer: "Milestone Minds", cert: certView(c) });
};
R["sig/get"] = async (db, b) => { const r = await db.prepare("SELECT data FROM sigs WHERE id=?").bind(str(b.id, 40)).first(); return J({ data: r ? r.data : "" }); };
// Teacher "Certificate & Professional Identity" profile. Only the class's teacher key can change it; learners cannot.
R["teacher/profile"] = async (db, b) => {
  const c = await teacher(db, b); if (!c) return bad("Not allowed.", 401);
  if (b.save) {
    const sig = b.sig === undefined ? c.t_sig : cleanSig(b.sig); if (sig === null) return bad("The signature must be a PNG or JPG image under 150 KB.");
    const name = str(b.name, 80), title = str(b.title, 80), school = str(b.school, 100);
    if (!name || !title || !school) return bad("Enter your full name, designation and school.");
    const changed = sig !== c.t_sig || name !== c.t_name || title !== c.t_title || school !== c.t_school;
    await db.prepare("UPDATE classes SET t_name=?,t_title=?,t_school=?,t_sig=?,t_auth=?,t_status=? WHERE id=?").bind(name, title, school, sig || "", b.auth ? 1 : 0, changed || !c.t_status ? "pending" : c.t_status, c.id).run();
    await ev(db, null, null, "teacher_profile", { class: c.id });
  }
  const p = await db.prepare("SELECT t_name,t_title,t_school,t_sig,t_status,t_auth FROM classes WHERE id=?").bind(c.id).first();
  return J({ profile: { name: p.t_name || "", title: p.t_title || "", school: p.t_school || "", sig: p.t_sig || "", status: p.t_status === "verified" ? "Verified" : (p.t_name ? "Pending" : "Not set"), auth: !!p.t_auth } });
};
// Platform administration (Milestone Minds only). Needs the ADMIN_KEY secret on the Worker.
async function admin(env, b) { return !!env.ADMIN_KEY && String(b.adminKey || "") === env.ADMIN_KEY; }
R["admin/founder"] = async (db, b, env) => {
  if (!env.ADMIN_KEY) return bad("Set the ADMIN_KEY secret on the Worker first.", 503);
  if (!(await admin(env, b))) return bad("Not allowed.", 401);
  if (b.save) { const sig = cleanSig(b.sig); if (sig === null) return bad("The signature must be a PNG or JPG image under 150 KB."); const cur = await founder(db); await db.prepare("INSERT OR REPLACE INTO settings(k,v) VALUES('founder',?)").bind(JSON.stringify({ name: str(b.name, 80) || cur.name, title: str(b.title, 80) || cur.title, sig: b.sig === undefined ? cur.sig : sig })).run(); }
  const f = await founder(db); return J({ founder: { name: f.name, title: f.title, hasSig: !!f.sig } });
};
R["admin/classes"] = async (db, b, env) => {
  if (!(await admin(env, b))) return bad("Not allowed.", 401);
  const q = "%" + str(b.q, 40).replace(/[%_]/g, "") + "%";
  const rows = (await db.prepare("SELECT c.code,c.name,c.grade,c.t_school,c.plan,c.plan_until,c.created,(SELECT COUNT(*) FROM learners l WHERE l.class_id=c.id AND l.removed=0) AS learners FROM classes c WHERE c.code LIKE ? OR c.name LIKE ? OR IFNULL(c.t_school,'') LIKE ? ORDER BY c.created DESC LIMIT 200").bind(q, q, q).all()).results || [];
  return J({ classes: rows.map((r) => { const p = planOf(r); return { ...p, code: r.code, name: r.name, grade: r.grade, school: r.t_school || "", learners: r.learners, learners_cap: p.learners, created: r.created }; }), plans: Object.keys(PLANS).map((k) => ({ id: k, label: PLANS[k].label, learners: PLANS[k].learners })) });
};
R["admin/plan"] = async (db, b, env) => {
  if (!(await admin(env, b))) return bad("Not allowed.", 401);
  const plan = String(b.plan || ""); if (!PLANS[plan]) return bad("Unknown plan.");
  const days = Math.max(0, Math.min(1500, Math.round(+b.days || 0))), until = plan === "free" || !days ? 0 : Date.now() + days * 86400000;
  const r = await db.prepare("UPDATE classes SET plan=?,plan_until=? WHERE code=?").bind(plan, until, normCode(b.code)).run();
  return r.meta && r.meta.changes ? J({ ok: true, until }) : bad("Class not found.", 404);
};
R["admin/verify"] = async (db, b, env) => {
  if (!(await admin(env, b))) return bad("Not allowed.", 401);
  const code = normCode(b.classCode);
  if (b.list) { const rows = (await db.prepare("SELECT code,name,t_name,t_title,t_school,t_status FROM classes WHERE t_name IS NOT NULL AND t_name!=''").all()).results || []; return J({ teachers: rows }); }
  const r = await db.prepare("UPDATE classes SET t_status=? WHERE code=?").bind(b.revoke ? "pending" : "verified", code).run();
  return J({ ok: true });
};
// A correction issues a NEW certificate (next version) and invalidates the old one.
R["cert/correct"] = async (db, b) => {
  const c = await teacher(db, b); if (!c) return bad("Not allowed.", 401);
  const old = await db.prepare("SELECT * FROM certs WHERE id=? AND class_id=?").bind(str(b.id, 40).toUpperCase(), c.id).first(); if (!old) return bad("Certificate not found.", 404);
  if (old.revoked) return bad("This certificate is no longer current.");
  const name = str(b.name, 80) || old.name, comp = await db.prepare("SELECT * FROM comps WHERE id=?").bind(old.comp_id).first();
  const nid = await addCert(db, comp, c, old.learner_id, name, old.kind, old.rank, old.score, { ver: (old.ver || 1) + 1, supersedes: old.id });
  await db.prepare("UPDATE certs SET revoked=2, replaced_by=? WHERE id=?").bind(nid, old.id).run();
  await ev(db, comp.id, old.learner_id, "cert_corrected", { from: old.id, to: nid });
  return J({ id: nid });
};
R["cert/list"] = async (db, b) => {
  const c = await teacher(db, b); if (!c) return bad("Not allowed.", 401);
  const comp = await db.prepare("SELECT * FROM comps WHERE id=? AND class_id=?").bind(str(b.compId, 40), c.id).first(); if (!comp) return bad("Competition not found.", 404);
  const rows = (await db.prepare("SELECT * FROM certs WHERE comp_id=? AND revoked=0 ORDER BY kind, rank").bind(comp.id).all()).results || [];
  return J({ certs: rows.map(certView), published: !!comp.published });
};
R["fame"] = async (db, b) => {
  const l = await learner(db, b); if (!l) return bad("Please join your class again.", 401);
  const rows = (await db.prepare("SELECT c.learner_id, c.name, c.kind, c.score FROM certs c JOIN comps p ON p.id=c.comp_id WHERE c.class_id=? AND c.revoked=0 AND p.published=1").bind(l.class_id).all()).results || [];
  const W = { gold: 5, silver: 3, bronze: 2, participation: 1, fastest: 2, precision: 2, innovation: 2 }, by = {};
  rows.forEach((r) => { const x = (by[r.learner_id] = by[r.learner_id] || { name: r.name, pts: 0, gold: 0, silver: 0, bronze: 0, certs: 0, best: 0 }); x.pts += W[r.kind] || 1; x.certs++; if (r.kind === "gold" || r.kind === "silver" || r.kind === "bronze") x[r.kind]++; x.best = Math.max(x.best, r.score || 0); });
  const list = Object.values(by).sort((a, b2) => (b2.pts - a.pts) || (b2.best - a.best)).slice(0, 10);
  return J({ hall: list });
};

export async function handleApi(request, env, path) {
  if (request.method !== "POST") return bad("Method not allowed", 405);
  if (!env.DB) return J({ error: "The classroom database is not connected yet.", setup: true }, 503);
  let body;
  if (path.startsWith("mpesa/callback/")) {
    try { body = await request.json(); } catch { return bad("Bad request"); }
    try { await init(env.DB); return await mpesaCallback(env.DB, env, path.slice(15), body); } catch (e) { return J({ ResultCode: 0, ResultDesc: "Accepted" }); }
  }
  const fn = R[path]; if (!fn) return bad("Not found", 404);
  try { body = await request.json(); } catch { return bad("Bad request"); }
  try { await init(env.DB); return await fn(env.DB, body || {}, env, request); }
  catch (e) { return J({ error: "Server error: " + String((e && e.message) || e).slice(0, 120) }, 500); }
}
