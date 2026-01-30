const express = require("express");
const router = express.Router();
const pool = require("../db");
const verifyAdmin = require("../middleware/adminAuth");
const nodemailer = require("nodemailer");

/* EMAIL CONFIG */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

/* SEND BROADCAST */
router.post("/send", verifyAdmin, async (req, res) => {
  const { type, subject, message } = req.body;

  try {
    const result = await pool.query(
      "SELECT email FROM subscriptions WHERE type=$1",
      [type]
    );

    if (result.rows.length === 0) {
      return res.json({ message: "No subscribers for this category" });
    }

    for (const user of result.rows) {
      await transporter.sendMail({
        from: `"Grace Church" <${process.env.MAIL_USER}>`,
        to: user.email,
        subject,
        text: message,
      });
    }

    res.json({ message: "Broadcast sent successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Broadcast failed" });
  }
});

module.exports = router;
