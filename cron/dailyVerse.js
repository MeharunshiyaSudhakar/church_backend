const cron = require("node-cron");
const pool = require("../db");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

cron.schedule("0 6 * * *", async () => {
  console.log("📖 Sending Daily Verse");

  const verse = "The Lord is my shepherd; I shall not want. — Psalm 23:1";

  const result = await pool.query(`
    SELECT s.email
    FROM subscriptions s
    JOIN subscription_categories sc
    ON s.id = sc.subscription_id
    WHERE sc.category = 'daily_verse'
  `);

  const emails = result.rows.map(r => r.email);

  if (emails.length === 0) return;

  await transporter.sendMail({
    from: `"Church" <${process.env.MAIL_USER}>`,
    to: process.env.MAIL_USER,
    bcc: emails,
    subject: "Daily Bible Verse",
    html: `<p>${verse}</p>`,
  });

  console.log("✅ Daily verse sent");
});
