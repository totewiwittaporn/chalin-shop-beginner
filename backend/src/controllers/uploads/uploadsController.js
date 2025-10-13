// backend/src/controllers/uploads/uploadsController.js
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOAD_DIR = path.resolve(__dirname, "../../../uploads");

export async function ensureUploadDir() {
  await fs.mkdir(UPLOAD_DIR, { recursive: true }).catch(() => {});
}

export async function upload(req, res) {
  try {
    await ensureUploadDir();
    const file = req.file;
    if (!file) return res.status(400).json({ message: "file is required" });

    // ไฟล์ถูกเขียนโดย multer.diskStorage แล้ว
    const url = `/uploads/${file.filename}`;
    res.json({
      id: file.filename,
      url,
      filename: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Upload failed" });
  }
}
