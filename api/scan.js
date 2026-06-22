// Vercel Serverless Function · POST /api/scan
// Recibe { image: "<base64 jpeg>" } y devuelve { stickers: [{code,num}] }.
// La API key vive en la env var ANTHROPIC_API_KEY (Settings → Environment Variables).

const VALID_CODES = [
  "MEX","RSA","KOR","CZE","CAN","BIH","QAT","SUI","BRA","MAR","HAI","SCO","USA","PAR",
  "AUS","TUR","GER","CUW","CIV","ECU","NED","JPN","SWE","TUN","BEL","EGY","IRN","NZL",
  "ESP","CPV","KSA","URU","FRA","SEN","IRQ","NOR","ARG","ALG","AUT","JOR","POR","COD",
  "UZB","COL","ENG","CRO","GHA","PAN"
].join(",");

const PROMPT =
  'Identifica TODAS las figuritas visibles en esta foto del album "Usa Mex Can 26". ' +
  'Cada una muestra un codigo de equipo de 3 letras y un numero. ' +
  'Devolve SOLO un array JSON, sin texto ni markdown: [{"code":"ARG","num":5}]. ' +
  'Reglas: equipos validos = [' + VALID_CODES + '] con num del 1 al 20. ' +
  'Especiales FWC = code "FWC" num 0 a 19 (la "00" es 0). ' +
  'Coca-Cola = code "CC" num 1 a 14. ' +
  'Lee el texto tal cual aparece. Si una no se lee con claridad, omitila. No inventes figuritas.';

module.exports = async (req, res) => {
  if (req.method !== "POST") { res.status(405).json({ error: "method not allowed" }); return; }
  try {
    const KEY = process.env.ANTHROPIC_API_KEY;
    if (!KEY) { res.status(500).json({ error: "Falta ANTHROPIC_API_KEY en el proyecto de Vercel." }); return; }

    let body = req.body;
    if (typeof body === "string") { try { body = JSON.parse(body); } catch (_) { body = {}; } }
    const image = (body && body.image) || "";
    if (!image) { res.status(400).json({ error: "Falta la imagen." }); return; }

    const MODEL = process.env.SCAN_MODEL || "claude-sonnet-4-6";
    const ar = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: MODEL, max_tokens: 1024,
        messages: [{ role: "user", content: [
          { type: "image", source: { type: "base64", media_type: "image/jpeg", data: image } },
          { type: "text", text: PROMPT }
        ] }]
      })
    });
    const data = await ar.json();
    if (data.error) { res.status(502).json({ error: data.error.message || "Error de la API" }); return; }

    const text = (data.content || []).filter(b => b.type === "text").map(b => b.text).join("");
    let stickers = [];
    try { const c = text.slice(text.indexOf("["), text.lastIndexOf("]") + 1); stickers = JSON.parse(c); if (!Array.isArray(stickers)) stickers = []; } catch (_) { stickers = []; }

    res.status(200).json({ stickers });
  } catch (e) {
    res.status(500).json({ error: String((e && e.message) || e) });
  }
};
