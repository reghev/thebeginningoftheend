const express = require("express");
const path = require("path");
const app = express();

app.use(express.static(path.join(__dirname, "../fronjend")));

const Database = require("better-sqlite3");

const db = new Database(path.join(__dirname, "guestbook.db"));
db.exec(`
  CREATE TABLE IF NOT EXISTS entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at INTEGER NOT NULL
  )
`);

const getEntries = db.prepare(
  "SELECT id, name, message, created_at FROM entries ORDER BY id DESC LIMIT 100"
);
const addEntry = db.prepare(
  "INSERT INTO entries (name, message, created_at) VALUES (?, ?, ?)"
);

const lastPost = new Map(); // ip -> time of their last post
const COOLDOWN_MS = 30 * 1000;

app.get("/api/guestbook", (req, res) => {
  res.json(getEntries.all());
});

app.post("/api/guestbook", (req, res) => {
  const name = String(req.body.name ?? "").trim();
  const message = String(req.body.message ?? "").trim();

  if (name.length < 1 || name.length > 50) {
    return res.status(400).json({ error: "Name must be 1 to 50 characters." });
  }
  if (message.length < 1 || message.length > 500) {
    return res.status(400).json({ error: "Message must be 1 to 500 characters." });
  }

  const now = Date.now();
  const last = lastPost.get(req.ip) || 0;
  if (now - last < COOLDOWN_MS) {
    const wait = Math.ceil((COOLDOWN_MS - (now - last)) / 1000);
    return res.status(429).json({ error: `Slow down, try again in ${wait}s.` });
  }
  lastPost.set(req.ip, now);

  addEntry.run(name, message, now);
  res.json({ ok: true });
});
app.use(express.static(path.join(__dirname, "../frontend")));

console.log("Serving files from:", path.join(__dirname, "../frontend"));
const TARGET = new Date("2032-12-29T03:00:00-05:00").getTime(); //this makes sure the counter is accurate 

app.get("/api/time", (req, res) => {
  res.set("Cache-Control", "no-store");
  res.json({ now: Date.now(), target: TARGET });
});
app.listen(3000, () => console.log("Running on http://localhost:3000"));