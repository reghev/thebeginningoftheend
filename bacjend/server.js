const express = require("express");
const path = require("path");
const app = express();

app.use(express.static(path.join(__dirname, "../fronjend")));

// Serve everything in the frontend folder
app.use(express.static(path.join(__dirname, "../frontend")));

let messages = [];

app.get("/api/messages", (req, res) => {
  res.json(messages);
});

app.post("/api/messages", (req, res) => {
  messages.push(req.body.text);
  res.json({ ok: true });
});
console.log("Serving files from:", path.join(__dirname, "../frontend"));
const TARGET = new Date("2032-12-29T03:00:00-05:00").getTime(); //this makes sure the counter is accurate 

app.get("/api/time", (req, res) => {
  res.set("Cache-Control", "no-store");
  res.json({ now: Date.now(), target: TARGET });
});
app.listen(3000, () => console.log("Running on http://localhost:3000"));