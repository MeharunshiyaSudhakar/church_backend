const express = require("express");
const router = express.Router();
const pool = require("../db");
const verifyAdmin = require("../middleware/adminAuth");

// GET all
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM public.carousel ORDER BY id ASC");
    res.json(result.rows);
  } catch (err) {
  console.error("Carousel query error:", err);
  res.status(500).json({ error: err.message });
}

});

// ADD
router.post("/", verifyAdmin, async (req, res) => {
  const { title, description, image_url } = req.body;
  try {
    await pool.query(
      "INSERT INTO public.carousel (title, description, image_url) VALUES ($1,$2,$3)",
      [title, description, image_url]
    );
    res.json({ message: "Added" });
  } catch (err) {
  console.error("Carousel query error:", err);
  res.status(500).json({ error: err.message });
}

});

// DELETE
router.delete("/:id", verifyAdmin, async (req, res) => {
  try {
    await pool.query("DELETE FROM public.carousel WHERE id=$1", [req.params.id]);
    res.json({ message: "Deleted" });
  } catch (err) {
  console.error("Carousel query error:", err);
  res.status(500).json({ error: err.message });
}

});

module.exports = router;
