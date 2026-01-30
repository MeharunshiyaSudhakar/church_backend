// routes/serviceTimes.js
const express = require("express");
const router = express.Router();
const pool = require("../db");
const verifyAdmin = require("../middleware/adminAuth");

// Convert 24h → AM/PM
function formatAMPM(time) {
  if (!time) return "";
  // time could be "HH:MM" or "HH:MM:SS"
  const parts = time.split(":");
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1] || "00";
  const ampm = hours >= 12 ? "PM" : "AM";
  const formattedHour = hours % 12 || 12;
  return `${formattedHour}:${minutes} ${ampm}`;
}

router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM service_times ORDER BY id ASC");
    const formatted = result.rows.map((item) => ({
      ...item,
      // if DB stores a time type like "09:00:00", trim seconds
      time: formatAMPM(String(item.time).split(".")[0]),
    }));
    res.json(formatted);
  } catch (err) {
    console.error("GET /api/service-times error:", err);
    res.status(500).json({ error: "Failed to fetch service times" });
  }
});

// ADD service time
router.post("/", verifyAdmin, async (req, res) => {
  try {
    const { name, time } = req.body;
    if (!name || !time) return res.status(400).json({ error: "Name and time are required" });

    // Accept "HH:MM" or "HH:MM:SS" — store as text to avoid DB time zone issues
    const timeToStore = String(time).slice(0,5); // keep HH:MM
    const insert = await pool.query(
      "INSERT INTO service_times (name, time) VALUES ($1, $2) RETURNING *",
      [name, timeToStore]
    );
    res.json({ message: "Service time added", item: insert.rows[0] });
  } catch (err) {
    console.error("POST /api/service-times error:", err);
    res.status(500).json({ error: "Failed to add service time" });
  }
});

// UPDATE
router.put("/:id", verifyAdmin, async (req, res) => {
  try {
    const { name, time } = req.body;
    if (!name || !time) return res.status(400).json({ error: "Name and time are required" });

    const timeToStore = String(time).slice(0,5);
    const update = await pool.query(
      "UPDATE service_times SET name = $1, time = $2 WHERE id = $3 RETURNING *",
      [name, timeToStore, req.params.id]
    );
    if (update.rowCount === 0) return res.status(404).json({ error: "Not found" });
    res.json({ message: "Updated", item: update.rows[0] });
  } catch (err) {
    console.error("PUT /api/service-times error:", err);
    res.status(500).json({ error: "Failed to update service time" });
  }
});

// DELETE
router.delete("/:id", verifyAdmin, async (req, res) => {
  try {
    const del = await pool.query("DELETE FROM service_times WHERE id = $1 RETURNING *", [req.params.id]);
    if (del.rowCount === 0) return res.status(404).json({ error: "Not found" });
    res.json({ message: "Deleted", item: del.rows[0] });
  } catch (err) {
    console.error("DELETE /api/service-times error:", err);
    res.status(500).json({ error: "Failed to delete service time" });
  }
});

module.exports = router;
