const express = require("express");
const router = express.Router();
const pool = require("../db");
const verifyAdmin = require("../middleware/adminAuth");

// GET all events
router.get("/", async (req, res) => {
  const result = await pool.query("SELECT * FROM events ORDER BY date ASC");
  res.json(result.rows);
});

// ADD event
router.post("/", verifyAdmin, async (req, res) => {
  const { title, description, date } = req.body;

  await pool.query(
    "INSERT INTO events (title, description, date) VALUES ($1, $2, $3)",
    [title, description, date]
  );

  res.json({ message: "Event added" });
});

// UPDATE event
router.put("/:id", verifyAdmin, async (req, res) => {
  const { title, description, date } = req.body;

  await pool.query(
    "UPDATE events SET title = $1, description = $2, date = $3 WHERE id = $4",
    [title, description, date, req.params.id]
  );

  res.json({ message: "Event updated" });
});

// DELETE event
router.delete("/:id", verifyAdmin, async (req, res) => {
  await pool.query("DELETE FROM events WHERE id = $1", [req.params.id]);
  res.json({ message: "Event deleted" });
});

module.exports = router;
