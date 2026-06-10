// Shared store for the Health Metric Wheel.
// GET  /api/data            -> { store: <the saved teams object, or null> }   (open, no password)
// POST /api/data {password, store} -> { ok: true }   (password-gated write)
//
// Dependency-free: talks to the Upstash/Vercel KV REST API with plain fetch.
// Required env vars (auto-added when you connect a KV/Redis store in Vercel),
// plus EDIT_PASSWORD which you set yourself.

const KEY = "hmw:store";

function creds() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  return { url, token };
}

export default async function handler(req, res) {
  const { url, token } = creds();
  if (!url || !token) {
    res.status(500).json({ error: "store_not_configured" });
    return;
  }
  const auth = { Authorization: `Bearer ${token}` };

  if (req.method === "GET") {
    try {
      const r = await fetch(`${url}/get/${KEY}`, { headers: auth });
      const j = await r.json();
      res.status(200).json({ store: j && j.result ? JSON.parse(j.result) : null });
    } catch (e) {
      res.status(502).json({ error: "read_failed" });
    }
    return;
  }

  if (req.method === "POST") {
    const body = req.body || {};
    if (!process.env.EDIT_PASSWORD || body.password !== process.env.EDIT_PASSWORD) {
      res.status(401).json({ error: "bad_password" });
      return;
    }
    const store = body.store;
    if (!store || !Array.isArray(store.teams)) {
      res.status(400).json({ error: "invalid_store" });
      return;
    }
    try {
      const r = await fetch(`${url}/set/${KEY}`, {
        method: "POST",
        headers: { ...auth, "Content-Type": "text/plain" },
        body: JSON.stringify(store),
      });
      const j = await r.json();
      res.status(200).json({ ok: j && j.result === "OK" });
    } catch (e) {
      res.status(502).json({ error: "write_failed" });
    }
    return;
  }

  res.status(405).json({ error: "method_not_allowed" });
}
