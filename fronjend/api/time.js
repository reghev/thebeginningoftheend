module.exports = (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json({
    now: Date.now(),
    target: new Date("2032-12-29T03:00:00-05:00").getTime(),
  });
};