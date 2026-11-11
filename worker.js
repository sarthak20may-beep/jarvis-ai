
const corsHeaders = {
  "Access-Control-Allow-Origin": "https://sarthak20may-beep.github.io",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/") {
      return json({ name: "JARVIS AI", status: "online" });
    }

    if (request.method !== "POST" || url.pathname !== "/ask") {
      return json({ error: "Use POST /ask" }, 404);
    }

    try {
      if (!env.AI) {
        return json({ error: "Workers AI binding AI is missing." }, 500);
      }

      const body = await request.json();
      const message = typeof body.message === "string"
        ? body.message.trim()
        : "";

      if (!message) {
        return json({ error: "Message is required." }, 400);
      }

      if (message.length > 4000) {
        return json({ error: "Message is too long." }, 400);
      }

      const result = await env.AI.run(
        "@cf/mistralai/mistral-small-3.1-24b-instruct",
        {
          messages: [
            {
              role: "system",
              content: "You are JARVIS, a helpful AI assistant. Reply clearly and naturally in the user's language. Keep voice answers concise."
            },
            {
              role: "user",
              content: message
            }
          ],
          max_tokens: 512,
          temperature: 0.3
        }
      );

      const answer = result?.response ||
        result?.choices?.[0]?.message?.content;

      if (!answer) {
        return json({ error: "AI returned an empty response." }, 502);
      }

      return json({
        answer: String(answer).trim(),
        provider: "Cloudflare Workers AI"
      });

    } catch (error) {
      return json({
        error: "AI request failed.",
        details: error.message
      }, 500);
    }
  }
};
