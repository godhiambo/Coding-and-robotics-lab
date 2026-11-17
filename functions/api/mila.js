// Cloudflare Pages Function: /api/mila  (keeps the Gemini API key secret on the server)
// Set GEMINI_API_KEY under Pages > Settings > Variables and Secrets (Production). Optional: GEMINI_MODEL.
const MODEL = "gemini-2.5-flash";
const J = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { "content-type": "application/json", "cache-control": "no-store" } });
export async function onRequestPost({ request, env }) {
  if (!env.GEMINI_API_KEY) return J({ error: "Mila's AI is not switched on yet (missing API key)." }, 503);
  let body; try { body = await request.json(); } catch { return J({ error: "Bad request" }, 400); }
  const prompt = String((body && body.prompt) || "");
  if (!prompt || prompt.length > 8000) return J({ error: "Prompt missing or too long" }, 400);
  const model = env.GEMINI_MODEL || MODEL;
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { "x-goog-api-key": env.GEMINI_API_KEY, "content-type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: 1200, temperature: 0.4, responseMimeType: "application/json" },
    }),
  });
  if (!r.ok) return J({ error: r.status === 429 ? "Mila needs a short rest." : "Mila could not think just now (" + r.status + ")." }, r.status === 429 ? 429 : 502);
  const d = await r.json();
  const text = (((d.candidates || [])[0] || {}).content || {}).parts?.map((p) => p.text || "").join("") || "";
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) return J({ error: "Mila's answer was not understood." }, 502);
  try { return J(JSON.parse(m[0])); } catch { return J({ error: "Mila's answer was not understood." }, 502); }
}
