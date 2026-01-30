// backend/routes/childrenAdmin.js
const express = require("express");
const router = express.Router();
const pool = require("../db");
const verifyAdmin = require("../middleware/adminAuth");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure upload directories exist
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};
ensureDir(path.join(__dirname, "..", "uploads", "children", "images"));
ensureDir(path.join(__dirname, "..", "uploads", "children", "files"));

// Multer storage for images and files
const childrenFilesDir = path.join(__dirname, "..", "uploads", "children", "files");
fs.mkdirSync(childrenFilesDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, childrenFilesDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "_"));
  },
});

const upload = multer({ storage });


// ------------------------- IMAGES -------------------------
// Get images by section (activities / worship)
router.get("/images/:section", async (req, res) => {
  const section = req.params.section;
  try {
    const result = await pool.query(
      "SELECT id, section, url, created_at FROM children_images WHERE section = $1 ORDER BY id DESC",
      [section]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("GET images error:", err);
    res.status(500).json({ error: "DB error" });
  }
});

// Upload image (Admin only)
router.post("/images", verifyAdmin, upload.single("image"), async (req, res) => {
  try {
    const { section } = req.body;
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const url = `/uploads/children/images/${req.file.filename}`; // served statically by server
    await pool.query(
      "INSERT INTO children_images (section, url) VALUES ($1, $2)",
      [section, url]
    );
    res.json({ message: "Image uploaded", url });
  } catch (err) {
    console.error("POST image error:", err);
    res.status(500).json({ error: "Upload failed" });
  }
});

// Delete image (Admin only)
router.delete("/images/:id", verifyAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    const r = await pool.query("SELECT url FROM children_images WHERE id=$1", [id]);
    if (r.rows[0]) {
      const filePath = path.join(__dirname, "..", r.rows[0].url);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    await pool.query("DELETE FROM children_images WHERE id=$1", [id]);
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error("DELETE image error:", err);
    res.status(500).json({ error: "Delete failed" });
  }
});

// ------------------------- VIDEOS -------------------------
// Get videos
router.get("/videos", async (req, res) => {
  try {
    const r = await pool.query("SELECT * FROM children_videos ORDER BY id DESC");
    res.json(r.rows);
  } catch (err) {
    console.error("GET videos", err);
    res.status(500).json({ error: "DB error" });
  }
});

// Add video (Admin)
router.post("/videos", verifyAdmin, async (req, res) => {
  try {
    const { title, youtube_url } = req.body;
    await pool.query(
      "INSERT INTO children_videos (title, youtube_url) VALUES ($1, $2, 'children')",
      [title, youtube_url]
    );
    res.json({ message: "Video added" });
  } catch (err) {
    console.error("POST video", err);
    res.status(500).json({ error: "Insert failed" });
  }
});

// Update video (Admin)
router.put("/videos/:id", verifyAdmin, async (req, res) => {
  try {
    const { title, youtube_url } = req.body;
    await pool.query(
      "UPDATE children_videos SET title=$1, youtube_url=$2 WHERE id=$3",
      [title, youtube_url, req.params.id]
    );
    res.json({ message: "Updated" });
  } catch (err) {
    console.error("PUT video", err);
    res.status(500).json({ error: "Update failed" });
  }
});

// Delete video (Admin)
router.delete("/videos/:id", verifyAdmin, async (req, res) => {
  try {
    await pool.query("DELETE FROM children_videos WHERE id=$1", [req.params.id]);
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error("DELETE video", err);
    res.status(500).json({ error: "Delete failed" });
  }
});

// ------------------------- FOLDERS & FILES -------------------------
// Get folders (admin-created)
router.get("/folders", async (req, res) => {
  try {
    const r = await pool.query(
      "SELECT * FROM syllabus_folders WHERE page_type = 'children' ORDER BY id DESC"
    );
    res.json(r.rows);
  } catch (err) {
    console.error("GET children folders", err);
    res.status(500).json({ error: "DB error" });
  }
});


// Create folder (Admin only)
// routes/childrenAdmin.js
router.post("/folders", verifyAdmin, async (req, res) => {
  const { name } = req.body;

  await pool.query(
    `
    INSERT INTO syllabus_folders (name, page_type)
    VALUES ($1, 'children')
    `,
    [name]
  );

  res.json({ message: "Children folder created" });
});


// Delete folder & its files (Admin only)
router.delete("/folders/:id", verifyAdmin, async (req, res) => {
  try {
    const folderId = req.params.id;
    // delete file rows and actual files
    const files = await pool.query("SELECT file_url FROM syllabus_files WHERE folder_id=$1", [folderId]);
    files.rows.forEach(f => {
      const p = path.join(__dirname, "..", f.file_url);
      if (fs.existsSync(p)) fs.unlinkSync(p);
    });
    await pool.query("DELETE FROM syllabus_files WHERE folder_id=$1", [folderId]);
    await pool.query("DELETE FROM syllabus_folders WHERE id=$1", [folderId]);
    res.json({ message: "Folder deleted" });
  } catch (err) {
    console.error("DELETE folder", err);
    res.status(500).json({ error: "Delete failed" });
  }
});

// Get files in folder
router.get("/folders/:id/files", async (req, res) => {
  try {
    const r = await pool.query("SELECT * FROM syllabus_files WHERE folder_id=$1 ORDER BY id DESC", [req.params.id]);
    res.json(r.rows);
  } catch (err) {
    console.error("GET folder files", err);
    res.status(500).json({ error: "DB error" });
  }
});

// Upload a file to a folder (Admin only) — form-data: file, folder_id
// Upload a file to a folder (Admin only)
router.post(
  "/upload-file",
  verifyAdmin,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const { folder_id } = req.body;

      // ✅ DEFINE fileType (THIS WAS MISSING)
      const ext = path.extname(req.file.originalname).slice(1).toLowerCase();
      let fileType = "other";

      if (ext === "pdf") fileType = "pdf";
      else if (["jpg", "jpeg", "png", "webp"].includes(ext)) fileType = "image";
      else if (["mp4", "webm"].includes(ext)) fileType = "video";

      // ✅ DEFINE fileUrl
      const fileUrl = `/uploads/children/files/${req.file.filename}`;

      // ✅ CORRECT INSERT (NO page_type)
      await pool.query(
        `
        INSERT INTO syllabus_files
        (folder_id, filename, file_url, file_type)
        VALUES ($1, $2, $3, $4)
        `,
        [folder_id, req.file.originalname, fileUrl, fileType]
      );

      res.json({ message: "File uploaded successfully" });
    } catch (err) {
      console.error("CHILDREN UPLOAD ERROR:", err);
      res.status(500).json({ error: "Upload failed" });
    }
  }
);



// Delete file (Admin only)
router.delete("/files/:id", verifyAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    const r = await pool.query("SELECT file_url FROM syllabus_files WHERE id=$1", [id]);
    if (r.rows[0]) {
      const p = path.join(__dirname, "..", r.rows[0].file_url);
      if (fs.existsSync(p)) fs.unlinkSync(p);
    }
    await pool.query("DELETE FROM syllabus_files WHERE id=$1", [id]);
    res.json({ message: "File deleted" });
  } catch (err) {
    console.error("DELETE file", err);
    res.status(500).json({ error: "Delete failed" });
  }
});

module.exports = router;
