// Serverless function (Vercel): reads the maths question in a photo with an AI model and returns it as text.
// Set the environment variable ANTHROPIC_API_KEY to switch it on. Without the key the app uses its built-in reader.
const MODEL = process.env.MATHSLAB_MODEL || "claude-haiku-5-5";
const PROMPT = `Transcribe the mathematics question or questions in this image as plain text for a calculator-style parser.
Rules:
- One question per line. Keep question numbers as "6." and keep instruction words such as Integrate, Differentiate, Find dy/dx, Evaluate, Maximise.
- Powers with ^ and brackets: x^2, e^(3x), (ax + b)^2, sin(x)^2.
- Fractions as (numerator)/(denominator). Roots as sqrt(...).
- Integrals as "∫ ... dx"; definite integrals as "Integrate ... from a to b".
- Inverse trigonometric functions as asin(...), acos(...), atan(...).
- Always put brackets after function names: sin(2x), log(x).
- For a linear programming problem write: Maximise Z = ... subject to ..., ..., x >= 0, y >= 0.
Output only the transcription, with no explanation. If there is no mathematics in the image, output NONE.`;
const hits = new Map(); // light per-address limit; resets when the function restarts

module.exports = async (req, res) => {
  const key = process.env.ANTHROPIC_API_KEY;
  if (req.method === "GET") return res.status(200).json({ ai: !!key });
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST." });
  if (!key) return res.status(503).json({ error: "The AI reader is not set up." });
  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0], now = Date.now(), recent = (hits.get(ip) || []).filter((t) => now - t < 3600e3);
  if (recent.length >= 40) return res.status(429).json({ error: "Too many photos in the last hour. Please type the question, or try later." });
  hits.set(ip, [...recent, now]);
  const { image, type } = req.body || {};
  if (typeof image !== "string" || image.length > 6e6 || !["image/jpeg", "image/png", "image/webp"].includes(type)) return res.status(400).json({ error: "Send a JPEG, PNG or WebP picture under 4 MB." });
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: MODEL, max_tokens: 600, messages: [{ role: "user", content: [{ type: "image", source: { type: "base64", media_type: type, data: image } }, { type: "text", text: PROMPT }] }] }),
    });
    const j = await r.json();
    if (!r.ok) return res.status(502).json({ error: "The AI service refused the request. Check the API key and model name." });
    const text = (j.content || []).filter((c) => c.type === "text").map((c) => c.text).join("\n").trim();
    if (!text || text === "NONE") return res.status(200).json({ error: "I could not find a maths question in this photo." });
    return res.status(200).json({ text });
  } catch (e) {
    return res.status(502).json({ error: "The AI service could not be reached." });
  }
};
