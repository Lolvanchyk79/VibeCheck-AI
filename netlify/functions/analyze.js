const https = require("https");

exports.handler = async function(event) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: corsHeaders, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: corsHeaders, body: JSON.stringify({ error: "Method Not Allowed" }) };
  }

  try {
    const { message, wordCount, charCount } = JSON.parse(event.body || "{}");

    if (!message || !message.trim()) {
      return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: "No message provided" }) };
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: "API key not configured" }) };
    }

    const systemPrompt = `You are VibeCheck AI — a socially aware, emotionally intelligent text message analyst. You help people understand what a message might mean, not what it definitely means.

You output ONLY valid JSON — no markdown fences, no preamble, no explanation outside the JSON:

{
  "confidence": <number 0-100>,
  "toneEmoji": "<single emoji>",
  "toneLabel": "<2-4 word probabilistic label>",
  "reasoning": "<1-2 sentences on specific signals>",
  "mostLikelyMeaning": "<most probable interpretation with hedging>",
  "otherPossibleMeanings": ["<2-3 alternative interpretations>"],
  "overallEmotionalSignal": "<positive|mostly positive|neutral|mixed|slightly negative|negative>",
  "notableSignals": ["<specific textual signals observed>"],
  "suggestedResponse": "<calm natural response suggestion>",
  "ambiguityLevel": "<low|medium|high|very high>",
  "emergencyLevel": "<none|low|medium|high>",
  "tldr": "<one honest grounded sentence>"
}`;

    const userMessage = "Analyze this message (" + (wordCount || 1) + " word" + ((wordCount || 1) !== 1 ? "s" : "") + ", " + (charCount || message.length) + " characters):\n\n\"" + message + "\"";

    const requestBody = JSON.stringify({
      model: "claude-opus-4-5",
      max_tokens: 1200,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }]
    });

    const claudeResponse = await new Promise((resolve, reject) => {
      const req = https.request({
        hostname: "api.anthropic.com",
        path: "/v1/messages",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "Content-Length": Buffer.byteLength(requestBody)
        }
      }, (res) => {
        let data = "";
        res.on("data", chunk => data += chunk);
        res.on("end", () => resolve({ status: res.statusCode, body: data }));
      });
      req.on("error", reject);
      req.write(requestBody);
      req.end();
    });

    if (claudeResponse.status !== 200) {
      return { statusCode: 502, headers: corsHeaders, body: JSON.stringify({ error: "AI error: " + claudeResponse.status }) };
    }

    const claudeData = JSON.parse(claudeResponse.body);
    const responseText = claudeData.content[0].text;

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        candidates: [{
          content: { parts: [{ text: responseText }], role: "model" },
          finishReason: "STOP"
        }]
      })
    };

  } catch (error) {
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ error: error.message }) };
  }
};
