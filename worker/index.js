// Cloudflare Worker entry: serves the static site from ./site and runs the /api/* routes on the server
// (Mila via Gemini, plus the classroom + competition API on D1).
import { onRequestPost } from "../functions/api/mila.js";
import { handleApi, milaAllowed } from "./api.js";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === "/api/mila") {
      if (request.method !== "POST") return new Response("Method not allowed", { status: 405, headers: { allow: "POST" } });
      // Competition rules: block Mila for a learner whose open attempt has Mila switched off.
      let lt = "";
      try { lt = String(((await request.clone().json()) || {}).lt || ""); } catch (e) {}
      if (lt && !(await milaAllowed(env, lt))) {
        return new Response(JSON.stringify({ error: "Mila is switched off for this competition." }), { status: 403, headers: { "content-type": "application/json" } });
      }
      return onRequestPost({ request, env, ctx });
    }
    if (url.pathname.startsWith("/api/")) return handleApi(request, env, url.pathname.slice(5));
    return env.ASSETS.fetch(request);
  },
};
