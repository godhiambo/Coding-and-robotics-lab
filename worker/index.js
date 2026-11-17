// Cloudflare Worker entry: serves the static site from ./site and runs /api/mila on the server,
// so GEMINI_API_KEY stays secret.
import { onRequestPost } from "../functions/api/mila.js";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === "/api/mila") {
      if (request.method === "POST") return onRequestPost({ request, env, ctx });
      return new Response("Method not allowed", { status: 405, headers: { allow: "POST" } });
    }
    return env.ASSETS.fetch(request);
  },
};
