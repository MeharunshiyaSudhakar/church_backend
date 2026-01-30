require("dotenv").config();          // 🔹 load .env FIRST

const express = require("express");
const cors = require("cors");
const pool = require("./db");

const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const adminContentRoutes = require("./routes/adminContent");
const carouselRoutes = require("./routes/carousel");
const serviceTimesRoutes = require("./routes/serviceTimes");
const eventsRoutes = require("./routes/events");
const missionRoutes = require("./routes/mission");
const childrenAdminRoutes = require("./routes/childrenAdmin");
const childrenFoldersRoutes = require("./routes/childrenFolders");
const subscriptionRoutes = require("./routes/subscriptions");
const broadcastRoutes = require("./routes/broadcast");
const messagesRoutes = require("./routes/messagesAdmin");

require("./cron/dailyVerse");

const app = express();
app.use(cors());
app.use(express.json());
// const messagesUploadRoutes = require("./routes/messagesUpload");
const messagesAdminRoutes = require("./routes/messagesAdmin");


// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/carousel", carouselRoutes);
app.use("/api/service-times", serviceTimesRoutes);
app.use("/api/events", eventsRoutes);
app.use("/api/mission", missionRoutes);
app.use("/api/admin-content", adminContentRoutes);
// Uploads folder
app.use("/uploads", express.static("uploads"));
app.use("/api/children-admin", childrenAdminRoutes);
// in server.js
app.use("/api/children-folders", childrenFoldersRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/broadcast", broadcastRoutes);
app.use("/api/messages", messagesRoutes);
// app.use("/api/messages", messagesUploadRoutes);
app.use("/api/messages-admin", messagesAdminRoutes);
app.use("/uploads", express.static("uploads"));

// Subscriptions API
app.post("/api/subscriptions", async (req, res) => {
  const { name, email, phone, type } = req.body;

  try {
    await pool.query(
      "INSERT INTO subscriptions (name, email, phone, type) VALUES ($1, $2, $3, $4)",
      [name, email, phone, type]
    );

    res.json({ message: "Subscribed Successfully!" });
  } catch (err) {
    res.status(500).json({ error: "Failed to subscribe" });
  }
});

// Root
app.get("/", (req, res) => {
  res.send("Church Backend Running...");
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
