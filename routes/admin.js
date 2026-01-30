const express = require("express");
const router = express.Router();
const verifyAdmin = require("../middleware/adminAuth");

// Admin Dashboard Data
router.get("/dashboard", verifyAdmin, (req, res) => {
  res.json({
    message: "Welcome Admin!",
    admin: req.user,
  });
});

// Example admin-only action
router.post("/add-event", verifyAdmin, (req, res) => {
  // later we will insert event into DB
  res.json({ message: "Event added successfully (Admin only)" });
});

module.exports = router;
