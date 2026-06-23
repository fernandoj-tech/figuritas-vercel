// Vercel Serverless Function · POST /api/scan  (Google Gemini · free tier)
// Recibe { image: "<base64 jpeg>" } y devuelve { stickers: [{code,num}] }.
// La API key vive en la env var GEMINI_API_KEY (Settings -> Environment Variables).
// Saca una key gratis en https://aistudio.google.com/apikey

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
    const KEY = process.env.GEMINI_API_KEY;
    if (!KEY) { res.status(500).json({ error: "Falta GEMINI_API_KEY en el proyecto de Vercel." }); return; }

    let body = req.body;
    if (typeof body === "string") { try { body = JSON.parse(body); } catch (_) { body = {}; } }
    const image = (body && body.image) || "";
    if (!image) { res.status(400).json({ error: "Falta la imagen." }); return; }

    const MODEL = process.env.SCAN_MODEL || "gemini-3.5-flash";
    const url = "https://generativelanguage.googleapis.com/v1beta/models/" + MODEL + ":generateContent";

    const gr = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": KEY },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inline_data: { mime_type: "image/jpeg", data: image } },
            { text: PROMPT }
          ]
        }],
        generationConfig: { temperature: 0, maxOutputTokens: 2048, responseMimeType: "application/json" }
      })
    });

    const data = await gr.json();
    if (data.error) { res.status(502).json({ error: data.error.message || "Error de la API" }); return; }

    const text = ((((data.candidates || [])[0] || {}).content || {}).parts || [])
      .filter(p => typeof p.text === "string").map(p => p.text).join("");

    let stickers = [];
    try {
      const c = text.slice(text.indexOf("["), text.lastIndexOf("]") + 1);
      stickers = JSON.parse(c);
      if (!Array.isArray(stickers)) stickers = [];
    } catch (_) { stickers = []; }

    res.status(200).json({ stickers });
  } catch (e) {
    res.status(500).json({ error: String((e && e.message) || e) });
  }
};
