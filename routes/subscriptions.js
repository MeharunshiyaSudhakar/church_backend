const express = require("express");
const router = express.Router();
const pool = require("../db");
const verifyAdmin = require("../middleware/adminAuth");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});


/* ================= USER SUBSCRIBE ================= */
router.post("/", async (req, res) => {
  const { name, email, phone, categories } = req.body;

  try {
    const userResult = await pool.query(
      `
      INSERT INTO subscriptions (name, email, phone)
      VALUES ($1, $2, $3)
      ON CONFLICT (email)
      DO UPDATE SET name=$1, phone=$3
      RETURNING id
      `,
      [name, email, phone]
    );

    const subscriptionId = userResult.rows[0].id;

    await pool.query(
      "DELETE FROM subscription_categories WHERE subscription_id=$1",
      [subscriptionId]
    );

    for (let cat of categories) {
      await pool.query(
        "INSERT INTO subscription_categories (subscription_id, category) VALUES ($1, $2)",
        [subscriptionId, cat]
      );
    }

    res.json({ message: "Subscribed successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Subscription failed" });
  }
});

/* ================= ADMIN SEND MESSAGE ================= */
router.post("/send", verifyAdmin, async (req, res) => {
  const { category, subject, message } = req.body;

  try {
    const result = await pool.query(
      `
      SELECT s.email
      FROM subscriptions s
      JOIN subscription_categories sc
        ON s.id = sc.subscription_id
      WHERE sc.category = $1
      `,
      [category]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: "No subscribers found" });
    }

    const emails = result.rows.map(r => r.email);

    await transporter.sendMail({
      from: `"Grace Church" <${process.env.MAIL_USER}>`,
      to: emails[0],   // subscribers
      bcc: emails.slice(1),
      subject,
      html: `
        <p>${message}</p>
        <hr/>
        <p style="font-size:12px">
          <a href="http://localhost:5000/api/subscriptions/unsubscribe?category=${category}&email={{EMAIL}}">
            Unsubscribe
          </a>
        </p>
      `,
    });

    res.json({ message: "Broadcast sent successfully" });

  } catch (err) {
    console.error("SEND ERROR:", err);
    res.status(500).json({ error: "Send failed" });
  }
});


// UNSUBSCRIBE FROM ONE CATEGORY
router.get("/unsubscribe", async (req, res) => {
  const { email, category } = req.query;

  if (!email || !category) {
    return res.status(400).send("Invalid unsubscribe link");
  }

  try {
    const user = await pool.query(
      "SELECT id FROM subscriptions WHERE email=$1",
      [email]
    );

    if (user.rows.length === 0) {
      return res.send("Already unsubscribed");
    }

    await pool.query(
      `
      DELETE FROM subscription_categories
      WHERE subscription_id=$1 AND category=$2
      `,
      [user.rows[0].id, category]
    );

    res.send(`You have unsubscribed from ${category}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Unsubscribe failed");
  }
});

// ADMIN VIEW ALL SUBSCRIPTIONS
router.get("/admin/all", verifyAdmin, async (req, res) => {
  const result = await pool.query(`
    SELECT s.id, s.name, s.email, sc.category
    FROM subscriptions s
    LEFT JOIN subscription_categories sc
    ON s.id = sc.subscription_id
    ORDER BY s.email
  `);

  res.json(result.rows);
});

router.delete("/admin/remove", verifyAdmin, async (req, res) => {
  const { subscription_id, category } = req.body;

  await pool.query(
    "DELETE FROM subscription_categories WHERE subscription_id=$1 AND category=$2",
    [subscription_id, category]
  );

  res.json({ message: "Removed" });
});



module.exports = router;
