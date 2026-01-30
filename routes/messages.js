const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.json({ message: "Messages API working" });
});

module.exports = router;
