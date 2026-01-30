const express = require("express");
const router = express.Router();
const pool = require("../db");
const verifyAdmin = require("../middleware/adminAuth");

// helper to wrap routes
function adminRoute(method, path, handler) {
  router[method](path, verifyAdmin, async (req, res) => {
    try {
      await handler(req, res);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  });
}

/* ============================
   🌀 CAROUSEL (home_carousel)
   ============================ */

// GET all carousel items
adminRoute("get", "/carousel", async (req, res) => {
  const result = await pool.query(
    "SELECT * FROM home_carousel ORDER BY sort_order, id"
  );
  res.json(result.rows);
});

// CREATE carousel item
adminRoute("post", "/carousel", async (req, res) => {
  const { title, description, image_url, sort_order } = req.body;
  const result = await pool.query(
    `INSERT INTO home_carousel (title, description, image_url, sort_order)
     VALUES ($1, $2, $3, COALESCE($4, 0))
     RETURNING *`,
    [title, description, image_url, sort_order]
  );
  res.json(result.rows[0]);
});

// UPDATE carousel item
adminRoute("put", "/carousel/:id", async (req, res) => {
  const { id } = req.params;
  const { title, description, image_url, sort_order } = req.body;

  const result = await pool.query(
    `UPDATE home_carousel
     SET title = $1,
         description = $2,
         image_url = $3,
         sort_order = COALESCE($4, sort_order)
     WHERE id = $5
     RETURNING *`,
    [title, description, image_url, sort_order, id]
  );
  if (!result.rows.length) return res.status(404).json({ error: "Not found" });
  res.json(result.rows[0]);
});

// DELETE carousel item
adminRoute("delete", "/carousel/:id", async (req, res) => {
  const { id } = req.params;
  await pool.query("DELETE FROM home_carousel WHERE id = $1", [id]);
  res.json({ message: "Deleted" });
});

/* ============================
   🕒 SERVICE TIMES (service_times)
   ============================ */

// GET all service times
adminRoute("get", "/service-times", async (req, res) => {
  const result = await pool.query(
    "SELECT * FROM service_times ORDER BY id"
  );
  res.json(result.rows);
});

// CREATE service time
adminRoute("post", "/service-times", async (req, res) => {
  const { title, day, time, location } = req.body;
  const result = await pool.query(
    `INSERT INTO service_times (title, day, time, location)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [title, day, time, location]
  );
  res.json(result.rows[0]);
});

// UPDATE service time
adminRoute("put", "/service-times/:id", async (req, res) => {
  const { id } = req.params;
  const { title, day, time, location } = req.body;
  const result = await pool.query(
    `UPDATE service_times
     SET title = $1, day = $2, time = $3, location = $4
     WHERE id = $5
     RETURNING *`,
    [title, day, time, location, id]
  );
  if (!result.rows.length) return res.status(404).json({ error: "Not found" });
  res.json(result.rows[0]);
});

// DELETE service time
adminRoute("delete", "/service-times/:id", async (req, res) => {
  const { id } = req.params;
  await pool.query("DELETE FROM service_times WHERE id = $1", [id]);
  res.json({ message: "Deleted" });
});

/* ============================
   📅 EVENTS (events)
   ============================ */

// GET all events
adminRoute("get", "/events", async (req, res) => {
  const result = await pool.query(
    "SELECT * FROM events ORDER BY date ASC, id ASC"
  );
  res.json(result.rows);
});

// CREATE event
adminRoute("post", "/events", async (req, res) => {
  const { title, description, date, image_url } = req.body;
  const result = await pool.query(
    `INSERT INTO events (title, description, date, image_url)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [title, description, date, image_url]
  );
  res.json(result.rows[0]);
});

// UPDATE event
adminRoute("put", "/events/:id", async (req, res) => {
  const { id } = req.params;
  const { title, description, date, image_url } = req.body;
  const result = await pool.query(
    `UPDATE events
     SET title = $1, description = $2, date = $3, image_url = $4
     WHERE id = $5
     RETURNING *`,
    [title, description, date, image_url, id]
  );
  if (!result.rows.length) return res.status(404).json({ error: "Not found" });
  res.json(result.rows[0]);
});

// DELETE event
adminRoute("delete", "/events/:id", async (req, res) => {
  const { id } = req.params;
  await pool.query("DELETE FROM events WHERE id = $1", [id]);
  res.json({ message: "Deleted" });
});

module.exports = router;
