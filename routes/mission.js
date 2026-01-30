const express = require("express");
const router = express.Router();
const pool = require("../db");
const verifyAdmin = require("../middleware/adminAuth");

// ---------------------- GET MISSION PAGE DATA ----------------------
router.get("/", async (req, res) => {
  const intro = await pool.query("SELECT * FROM mission_content ORDER BY id DESC LIMIT 1");
  const goals = await pool.query("SELECT * FROM mission_goals ORDER BY id ASC");

  res.json({
    intro: intro.rows[0] || {},
    goals: goals.rows
  });
});

// ---------------------- UPDATE INTRO & VERSE -----------------------
router.post("/intro", verifyAdmin, async (req, res) => {
  const { intro, verse, verse_ref } = req.body;

  await pool.query(
    "INSERT INTO mission_content (intro, verse, verse_ref) VALUES ($1, $2, $3)",
    [intro, verse, verse_ref]
  );

  res.json({ message: "Mission content updated" });
});

// ---------------------- ADD GOAL -----------------------
router.post("/goal", verifyAdmin, async (req, res) => {
  const { title, description } = req.body;

  await pool.query(
    "INSERT INTO mission_goals (title, description) VALUES ($1, $2)",
    [title, description]
  );

  res.json({ message: "Goal added" });
});

router.put("/goal/:id", verifyAdmin, async (req, res) => {
  const { title, description } = req.body;

  await pool.query(
    "UPDATE mission_goals SET title = $1, description = $2 WHERE id = $3",
    [title, description, req.params.id]
  );

  res.json({ message: "Goal updated" });
});


// ---------------------- DELETE GOAL -----------------------
router.delete("/goal/:id", verifyAdmin, async (req, res) => {
  await pool.query("DELETE FROM mission_goals WHERE id = $1", [req.params.id]);
  res.json({ message: "Goal deleted" });
});

module.exports = router;
