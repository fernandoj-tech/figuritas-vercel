// Vercel Serverless Function · POST /api/admin
// Acciones de superadmin que requieren privilegios elevados (eliminar cuenta).
// Verifica que quien llama sea el admin (por email) usando su token, y actúa con la service_role.
// Necesita env vars: SUPABASE_URL (opcional, tiene fallback) y SUPABASE_SERVICE_ROLE_KEY (secreta).

const ADMIN_EMAIL = "fernandojagoe@gmail.com";
const DEFAULT_URL = "https://jmnkaierwpubxtwumirz.supabase.co";

module.exports = async (req, res) => {
  if (req.method !== "POST") { res.status(405).json({ error: "method not allowed" }); return; }
  try {
    const URL = process.env.SUPABASE_URL || DEFAULT_URL;
    const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!SERVICE) { res.status(500).json({ error: "Falta SUPABASE_SERVICE_ROLE_KEY en Vercel" }); return; }

    const authH = req.headers.authorization || "";
    const token = authH.startsWith("Bearer ") ? authH.slice(7) : "";
    if (!token) { res.status(401).json({ error: "sin token" }); return; }

    // Validar el token del que llama y obtener su email
    const ures = await fetch(URL + "/auth/v1/user", { headers: { apikey: SERVICE, authorization: "Bearer " + token } });
    const caller = await ures.json();
    if (!ures.ok || !caller || (caller.email || "").toLowerCase() !== ADMIN_EMAIL) {
      res.status(403).json({ error: "no autorizado" }); return;
    }

    let body = req.body;
    if (typeof body === "string") { try { body = JSON.parse(body); } catch (_) { body = {}; } }
    const action = body && body.action;
    const targetId = body && body.targetId;
    if (!targetId) { res.status(400).json({ error: "falta targetId" }); return; }

    const adminHeaders = { apikey: SERVICE, authorization: "Bearer " + SERVICE, "content-type": "application/json" };

    if (action === "delete") {
      const r = await fetch(URL + "/auth/v1/admin/users/" + targetId, { method: "DELETE", headers: adminHeaders });
      if (!r.ok) { const t = await r.text(); res.status(502).json({ error: t }); return; }
      res.status(200).json({ ok: true }); return;
    }
    if (action === "block" || action === "unblock") {
      const r = await fetch(URL + "/rest/v1/profiles?id=eq." + encodeURIComponent(targetId), {
        method: "PATCH",
        headers: Object.assign({}, adminHeaders, { Prefer: "return=minimal" }),
        body: JSON.stringify({ blocked: action === "block" })
      });
      if (!r.ok) { const t = await r.text(); res.status(502).json({ error: t }); return; }
      res.status(200).json({ ok: true }); return;
    }
    res.status(400).json({ error: "acción inválida" });
  } catch (e) {
    res.status(500).json({ error: String((e && e.message) || e) });
  }
};
