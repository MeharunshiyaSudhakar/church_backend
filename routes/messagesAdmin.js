const express = require("express");
const router = express.Router();
const multer = require("multer");
const pool = require("../db");
const verifyAdmin = require("../middleware/adminAuth");

/* STORAGE */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/messages");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

/* ================= FOLDERS ================= */

// GET
router.get("/folders", async (req, res) => {
  const r = await pool.query(
    "SELECT * FROM syllabus_folders WHERE page_type='messages' ORDER BY created_at DESC"
  );
  res.json(r.rows);
});

// CREATE
router.post("/folders", verifyAdmin, async (req, res) => {
  const { month, year } = req.body;

  await pool.query(
    "INSERT INTO syllabus_folders (name, year, page_type) VALUES ($1,$2,'messages')",
    [month, year]
  );

  res.json({ message: "Folder created" });
});

// DELETE
router.delete("/folders/:id", verifyAdmin, async (req, res) => {
  await pool.query(
    "DELETE FROM syllabus_folders WHERE id=$1",
    [req.params.id]
  );
  res.json({ message: "Deleted" });
});

/* ================= FILES ================= */

// GET FILES
router.get("/folders/:id/files", async (req, res) => {
  const r = await pool.query(
    "SELECT * FROM syllabus_files WHERE folder_id=$1",
    [req.params.id]
  );
  res.json(r.rows);
});

// UPLOAD FILE
router.post(
  "/upload-file",
  verifyAdmin,
  upload.single("file"),
  async (req, res) => {
    const { folder_id } = req.body;

    let fileType = "pdf";
    if (req.file.mimetype.startsWith("image")) fileType = "image";
    if (req.file.mimetype.startsWith("video")) fileType = "video";

    const fileUrl = `/uploads/messages/${req.file.filename}`;

    await pool.query(
      `
      INSERT INTO syllabus_files
      (folder_id, filename, file_url, file_type)
      VALUES ($1,$2,$3,$4)
      `,
      [folder_id, req.file.originalname, fileUrl, fileType]
    );

    res.json({ message: "Uploaded" });
  }
);

// DELETE FILE
router.delete("/files/:id", verifyAdmin, async (req, res) => {
  await pool.query(
    "DELETE FROM syllabus_files WHERE id=$1",
    [req.params.id]
  );
  res.json({ message: "Deleted" });
});

module.exports = router;
