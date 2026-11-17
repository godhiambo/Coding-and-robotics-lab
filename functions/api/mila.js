// Cloudflare Pages Function: /api/mila  (keeps the Anthropic API key secret on the server)
// Set ANTHROPIC_API_KEY under Pages > Settings > Variables and Secrets (Production).
const MODEL = "claude-haiku-5-5";
const J = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { "content-type": "application/json", "cache-control": "no-store" } });
export async function onRequestPost({ request, env }) {
  if (!env.ANTHROPIC_API_KEY) return J({ error: "Mila's AI is not switched on yet (missing API key)." }, 503);
  let body; try { body = await request.json(); } catch { return J({ error: "Bad request" }, 400); }
  const prompt = String((body && body.prompt) || "");
  if (!prompt || prompt.length > 8000) return J({ error: "Prompt missing or too long" }, 400);
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: env.MILA_MODEL || MODEL, max_tokens: 900, messages: [{ role: "user", content: prompt }] }),
  });
  if (!r.ok) return J({ error: r.status === 429 ? "Mila needs a short rest." : "Mila could not think just now (" + r.status + ")." }, r.status === 429 ? 429 : 502);
  const d = await r.json();
  const text = ((d.content || []).find((c) => c.type === "text") || {}).text || "";
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return J({ error: "Mila's answer was not understood." }, 502);
  try { return J(JSON.parse(m[0])); } catch { return J({ error: "Mila's answer was not understood." }, 502); }
}
