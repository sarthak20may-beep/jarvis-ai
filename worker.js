// JARVIS Smart AI Router — Cloudflare Worker
// API keys must be added as Worker Secrets, never committed to GitHub.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // For production, replace * with your GitHub Pages origin.
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

function chooseProvider(message) {
  const m = message.toLowerCase();

  // Simple, transparent routing rules. User can override with provider field.
  if (/(essay|story|rewrite|letter|email|poem|summari[sz]e|long writing|creative)/i.test(m)) {
    return "claude";
  }
  if (/(math|calculate|logic|reason|debug|code|program|algorithm|explain step by step)/i.test(m)) {
    return "openai";
  }
  return "gemini";
}

async function askOpenAI(message, env) {
  if (!env.OPENAI_API_KEY) throw new Error("OpenAI API key is not configured.");
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are JARVIS, a helpful assistant. Reply clearly in the user's language." },
        { role: "user", content: message }
      ],
      temperature: 0.7,
    }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error?.message || "OpenAI request failed.");
  return data.choices?.[0]?.message?.content || "No response from OpenAI.";
}

async function askGemini(message, env) {
  if (!env.GEMINI_API_KEY) throw new Error("Gemini API key is not configured.");
  const model = "gemini-2.0-flash";
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `You are JARVIS, a helpful assistant. Reply clearly in the user's language.\n\n${message}` }] }]
    }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error?.message || "Gemini request failed.");
  return data.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("") || "No response from Gemini.";
}

async function askClaude(message, env) {
  if (!env.ANTHROPIC_API_KEY) throw new Error("Claude API key is not configured.");
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-3-5-haiku-latest",
      max_tokens: 900,
      system: "You are JARVIS, a helpful assistant. Reply clearly in the user's language.",
      messages: [{ role: "user", content: message }],
    }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error?.message || "Claude request failed.");
  return data.content?.map(c => c.text || "").join("") || "No response from Claude.";
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/") {
      return json({ name: "JARVIS Smart AI Router", status: "online", endpoint: "POST /ask" });
    }
    if (request.method !== "POST" || url.pathname !== "/ask") {
      return json({ error: "Use POST /ask" }, 404);
    }

    try {
      const body = await request.json();
      const message = typeof body.message === "string" ? body.message.trim() : "";
      if (!message) return json({ error: "message is required" }, 400);
      if (message.length > 8000) return json({ error: "Message is too long (max 8000 characters)." }, 400);

      const requested = ["openai", "gemini", "claude"].includes(body.provider) ? body.provider : "auto";
      const provider = requested === "auto" ? chooseProvider(message) : requested;

      let answer;
      if (provider === "openai") answer = await askOpenAI(message, env);
      else if (provider === "gemini") answer = await askGemini(message, env);
      else answer = await askClaude(message, env);

      return json({ answer, provider, mode: requested });
    } catch (e) {
      return json({ error: e.message || "Unexpected server error." }, 500);
    }
  },
};
