const { Redis } = require("@upstash/redis");

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN,
});

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "GET") {
    const entries = await redis.lrange("guestbook", 0, 99);
    return res.status(200).json(entries);
  }

  if (req.method === "POST") {
    const name = String(req.body?.name ?? "").trim();
    const message = String(req.body?.message ?? "").trim();

    if (name.length < 1 || name.length > 50) {
      return res.status(400).json({ error: "Name must be 1 to 50 characters." });
    }
    if (message.length < 1 || message.length > 500) {
      return res.status(400).json({ error: "Message must be 1 to 500 characters." });
    }

    // Rate limit: one post per 30 seconds per visitor
    const ip = (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
    const allowed = await redis.set(`ratelimit:${ip}`, 1, { nx: true, ex: 30 });
    if (!allowed) {
      return res.status(429).json({ error: "Slow down, try again in a few seconds." });
    }

    await redis.lpush("guestbook", { name, message, created_at: Date.now() });
    await redis.ltrim("guestbook", 0, 999); // keep the newest 1000
    return res.status(200).json({ ok: true });
  }

  res.setHeader("Allow", "GET, POST");
  res.status(405).json({ error: "Method not allowed" });
};