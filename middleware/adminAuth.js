// middleware/adminAuth.js
const jwt = require("jsonwebtoken");
require("dotenv").config();

module.exports = function (req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "No token provided" });
  const parts = authHeader.split(" ");
  if (parts.length !== 2) return res.status(401).json({ error: "Invalid auth header" });

  const token = parts[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "admin") return res.status(403).json({ error: "Admin only" });
    req.user = decoded;
    // helpful debug log (remove in production)
    console.log(`Admin auth success for ${decoded.email}`);
    next();
  } catch (err) {
    console.error("adminAuth error:", err && err.message);
    return res.status(401).json({ error: "Invalid token" });
  }
};
