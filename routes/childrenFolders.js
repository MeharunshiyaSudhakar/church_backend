// backend/routes/childrenFolders.js
const express = require("express");
const router = express.Router();
const pool = require("../db");
const verifyAdmin = require("../middleware/adminAuth");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// ensure uploads/syllabus exists
const UPLOAD_DIR = path.join(__dirname, "..", "uploads", "syllabus");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${unique}${ext}`);
  },
});
const upload = multer({ storage });

// ---------------- FOLDERS ----------------

// list folders
router.get("/folders", async (req, res) => {
  try {
    const r = await pool.query(
      "SELECT * FROM syllabus_folders WHERE page_type = 'children' ORDER BY id DESC"
    );
    res.json(r.rows);
  } catch (err) {
    console.error("children folders GET error", err);
    res.status(500).json({ error: "DB error" });
  }
});

// create folder (admin)
router.post("/folders", verifyAdmin, async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Name required" });
  try {
    // ensure unique name
    const exists = await pool.query("SELECT id FROM syllabus_folders WHERE name=$1", [name]);
    if (exists.rows.length > 0) {
      return res.status(400).json({ error: "Folder name already exists" });
    }
    const r = await pool.query(
      "INSERT INTO syllabus_folders (name,page_type) VALUES ($1, 'children') RETURNING *",
      [name]
    );
    res.json(r.rows[0]);
  } catch (err) {
    console.error("folders POST error", err);
    res.status(500).json({ error: "DB error" });
  }
});

// delete folder (admin) — cascade will remove files in DB if FK ON DELETE CASCADE
router.delete("/folders/:id", verifyAdmin, async (req, res) => {
  try {
    // remove files on disk first
    const files = await pool.query("SELECT file_url FROM syllabus_files WHERE folder_id=$1", [
      req.params.id,
    ]);
    for (const f of files.rows) {
      if (f.file_url) {
        const localPath = path.join(__dirname, "..", f.file_url.replace(/^\//, ""));
        if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
      }
    }

    await pool.query("DELETE FROM syllabus_folders WHERE id=$1", [req.params.id]);
    res.json({ message: "Folder deleted" });
  } catch (err) {
    console.error("folders DELETE error", err);
    res.status(500).json({ error: "Delete failed" });
  }
});

// ---------------- FILES ----------------

// list files in folder
router.get("/files/:folderId", async (req, res) => {
  try {
    const r = await pool.query(
      "SELECT id, filename, file_url, file_type, uploaded_at FROM syllabus_files WHERE folder_id=$1 ORDER BY id ASC",
      [req.params.folderId]
    );
    res.json(r.rows);
  } catch (err) {
    console.error("files GET error", err);
    res.status(500).json({ error: "DB error" });
  }
});

// upload file to folder (admin only)
router.post("/files/upload", verifyAdmin, upload.single("file"), async (req, res) => {
  try {
    const { folder_id } = req.body;
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const filename = req.file.originalname;
    const file_url = `/uploads/syllabus/${req.file.filename}`; // public path served by express.static
    const file_type = req.file.mimetype;

    await pool.query(
      "INSERT INTO syllabus_files (folder_id, filename, file_url, file_type) VALUES ($1, $2, $3, $4)",
      [folder_id, filename, file_url, file_type]
    );

    res.json({ message: "Uploaded", file_url });
  } catch (err) {
    console.error("files upload error", err);
    res.status(500).json({ error: "Upload failed" });
  }
});

// delete file (admin)
router.delete("/files/:id", verifyAdmin, async (req, res) => {
  try {
    const r = await pool.query("SELECT file_url FROM syllabus_files WHERE id=$1", [req.params.id]);
    if (r.rows.length === 0) return res.status(404).json({ error: "File not found" });

    const fileUrl = r.rows[0].file_url;
    if (fileUrl) {
      const localPath = path.join(__dirname, "..", fileUrl.replace(/^\//, ""));
      if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
    }

    await pool.query("DELETE FROM syllabus_files WHERE id=$1", [req.params.id]);
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error("files DELETE error", err);
    res.status(500).json({ error: "Delete failed" });
  }
});

module.exports = router;
