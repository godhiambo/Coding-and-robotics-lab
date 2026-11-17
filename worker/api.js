// Milestone Minds Robotics Lab: classroom + competition API (Cloudflare Worker + D1).
// All rules, timing and scoring are decided HERE (server time), never trusted from the browser.
// Needs a D1 binding named DB. Tables are created automatically on first use.

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
];
let ready = false;
async function init(db) { if (ready) return; await db.batch(SCHEMA.map((s) => db.prepare(s))); ready = true; }

const hex = (b) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
const sha = async (s) => hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(String(s))));
const rnd = (n) => hex(crypto.getRandomValues(new Uint8Array(n)));
const uid = () => rnd(8);
function classCode() { const A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; let s = ""; for (const x of crypto.getRandomValues(new Uint8Array(6))) s += A[x % A.length]; return "MM-" + s.slice(0, 3) + "-" + s.slice(3); }
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
  const code = str(body.code, 20).toUpperCase(), key = str(body.key, 80);
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
function compView(c) { return { id: c.id, title: c.title, level: c.level, status: c.status, startAt: c.start_at, deadline: c.deadline, pausedAt: c.paused_at, published: !!c.published, rules: JSON.parse(c.rules || "{}") }; }
function effDeadline(c, l) { return (c.deadline || 0) + ((l && l.extra_s) || 0) * 1000; }

async function leaderboard(db, compId, withNames) {
  const rows = (await db.prepare("SELECT a.*, l.name AS lname FROM attempts a JOIN learners l ON l.id=a.learner_id WHERE a.comp_id=? ORDER BY a.started").bind(compId).all()).results || [];
  const byL = {};
  rows.forEach((a) => { (byL[a.learner_id] = byL[a.learner_id] || { name: a.lname, id: a.learner_id, list: [] }).list.push(a); });
  const out = Object.values(byL).map((L) => {
    const done = L.list.filter((a) => a.status === "submitted" && !a.disq).sort(better);
    const open = L.list.filter((a) => a.status === "open").pop();
    const best = done[0];
    return { id: L.id, name: L.name, score: best ? best.score : 0, win: best ? best.win : 0, collisions: best ? best.collisions : 0, time: best ? best.time_s : 0,
      progress: best ? best.progress : (open ? open.progress : 0), status: open ? "Running" : (best ? "Submitted" : (L.list.some((a) => a.disq) ? "Disqualified" : "Waiting")), attempts: L.list.length,
      detail: withNames ? L.list.map((a) => ({ id: a.id, n: a.n, status: a.status, score: a.score, win: a.win, collisions: a.collisions, time: a.time_s, blocks: a.blocks, progress: a.progress, disq: a.disq })) : undefined };
  });
  out.sort((a, b) => (b.score - a.score) || (b.win - a.win) || (a.collisions - b.collisions) || (a.time - b.time));
  let rank = 0;
  out.forEach((r, i) => { const p = out[i - 1]; if (!p || p.score !== r.score || p.win !== r.win || p.collisions !== r.collisions || p.time !== r.time) rank = i + 1; r.rank = rank; });
  return out;
}

// ---------- routes ----------
const R = {};

R["class/create"] = async (db, b) => {
  const name = str(b.name, 60); if (!name) return bad("Give the class a name.");
  const key = rnd(12), id = uid();
  let code = classCode();
  for (let i = 0; i < 5; i++) { const x = await db.prepare("SELECT 1 FROM classes WHERE code=?").bind(code).first(); if (!x) break; code = classCode(); }
  await db.prepare("INSERT INTO classes(id,code,name,grade,subject,key_hash,created) VALUES(?,?,?,?,?,?,?)").bind(id, code, name, str(b.grade, 30), str(b.subject, 60), await sha(key), Date.now()).run();
  return J({ code, key, name });
};

R["class/get"] = async (db, b) => {
  const c = await teacher(db, b); if (!c) return bad("Wrong class code or teacher key.", 401);
  const ls = (await db.prepare("SELECT id,name,extra_s,joined FROM learners WHERE class_id=? AND removed=0 ORDER BY name").bind(c.id).all()).results || [];
  const cs = (await db.prepare("SELECT * FROM comps WHERE class_id=? ORDER BY created DESC").bind(c.id).all()).results || [];
  return J({ cls: { code: c.code, name: c.name, grade: c.grade, subject: c.subject }, learners: ls, comps: cs.map(compView), now: Date.now() });
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
  const title = str(b.title, 80), level = str(b.level, 40); if (!title || !level) return bad("Pick a mission and give the competition a title.");
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
  } else if (a === "disq" || a === "undisq") {
    const att = await db.prepare("SELECT * FROM attempts WHERE id=? AND comp_id=?").bind(str(b.attemptId, 40), comp.id).first(); if (!att) return bad("Attempt not found.", 404);
    await db.prepare("UPDATE attempts SET disq=? WHERE id=?").bind(a === "disq" ? 1 : 0, att.id).run();
    await ev(db, comp.id, att.learner_id, a === "disq" ? "disqualified" : "reinstated", { reason: str(b.reason, 120) });
    return J({ ok: true });
  } else return bad("Unknown action.");
  await ev(db, comp.id, null, "teacher_" + a, a === "extend" ? { minutes: b.minutes } : null);
  return J({ ok: true });
};

R["comp/board"] = async (db, b) => {
  const c = await teacher(db, b); if (!c) return bad("Not allowed.", 401);
  const comp = await db.prepare("SELECT * FROM comps WHERE id=? AND class_id=?").bind(str(b.compId, 40), c.id).first(); if (!comp) return bad("Competition not found.", 404);
  const rows = await leaderboard(db, comp.id, true);
  const evs = (await db.prepare("SELECT e.type,e.data,e.at,l.name FROM events e LEFT JOIN learners l ON l.id=e.learner_id WHERE e.comp_id=? ORDER BY e.id DESC LIMIT 60").bind(comp.id).all()).results || [];
  const enrolled = (await db.prepare("SELECT COUNT(*) AS n FROM learners WHERE class_id=? AND removed=0").bind(c.id).first()).n;
  return J({ comp: compView(comp), rows, events: evs, enrolled, now: Date.now() });
};

R["join"] = async (db, b) => {
  const code = str(b.code, 20).toUpperCase(), name = str(b.name, 40);
  if (!code || !name) return bad("Enter the class code and your name.");
  const c = await db.prepare("SELECT * FROM classes WHERE code=?").bind(code).first(); if (!c) return bad("That class code was not found.", 404);
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
    const mine = (await db.prepare("SELECT id,n,status,score,win,collisions,time_s AS time,progress,breakdown,disq FROM attempts WHERE comp_id=? AND learner_id=? ORDER BY n").bind(comp.id, l.id).all()).results || [];
    // late close: an open attempt past the deadline is locked by the server
    if (comp.status === "ended" || (comp.status === "live" && Date.now() > v.deadline + 15000)) {
      await db.prepare("UPDATE attempts SET status='locked' WHERE comp_id=? AND learner_id=? AND status='open'").bind(comp.id, l.id).run();
      mine.forEach((a) => { if (a.status === "open") a.status = "locked"; });
    }
    out.comp = v; out.mine = mine.map((a) => ({ ...a, breakdown: a.breakdown ? JSON.parse(a.breakdown) : null }));
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
  const open = await db.prepare("SELECT * FROM attempts WHERE comp_id=? AND learner_id=? AND status='open'").bind(comp.id, l.id).first();
  if (open) return J({ attemptId: open.id, startedAt: open.started, deadline: dl, now, rules: JSON.parse(open.rules), prog: open.prog ? JSON.parse(open.prog) : null, resumed: true });
  const used = (await db.prepare("SELECT COUNT(*) AS n FROM attempts WHERE comp_id=? AND learner_id=?").bind(comp.id, l.id).first()).n;
  if (rules.attempts > 0 && used >= rules.attempts) return bad("You have used all your attempts.");
  const id = uid();
  await db.prepare("INSERT INTO attempts(id,comp_id,learner_id,n,rules,started,status) VALUES(?,?,?,?,?,?,'open')").bind(id, comp.id, l.id, used + 1, comp.rules, now).run();
  await ev(db, comp.id, l.id, "attempt_start", { n: used + 1 });
  return J({ attemptId: id, startedAt: now, deadline: dl, now, rules, prog: null });
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

R["attempt/submit"] = async (db, b) => {
  const l = await learner(db, b); if (!l) return bad("Please join your class again.", 401);
  const o = await openAttempt(db, l, b); if (o.err) return o.err;
  const now = Date.now();
  if (now > o.dl + 15000) return bad("Time is up.", 409); // small grace for network delay
  const rules = JSON.parse(o.a.rules), r = b.result || {}, s = score(rules, r);
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

export async function handleApi(request, env, path) {
  if (request.method !== "POST") return bad("Method not allowed", 405);
  if (!env.DB) return J({ error: "The classroom database is not connected yet.", setup: true }, 503);
  const fn = R[path]; if (!fn) return bad("Not found", 404);
  let body; try { body = await request.json(); } catch { return bad("Bad request"); }
  try { await init(env.DB); return await fn(env.DB, body || {}); }
  catch (e) { return J({ error: "Server error: " + String((e && e.message) || e).slice(0, 120) }, 500); }
}
