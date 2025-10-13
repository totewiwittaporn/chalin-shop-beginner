// backend/src/routes/uploads/uploads.routes.js
import { Router } from "express";
import multer from "multer";
import path from "path";
import { requireAuth } from "#app/middleware/auth.js";
import { upload as uploadHandler } from "#app/controllers/uploads/uploadsController.js";

const router = Router();

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, path.resolve("uploads")),
  filename: (_, file, cb) => {
    const ts = Date.now();
    const safe = file.originalname.replace(/[^\w.\-]+/g, "_");
    cb(null, `${ts}_${safe}`);
  },
});
const upload = multer({ storage });

// POST /api/uploads (multipart/form-data: file)
router.post("/", requireAuth, upload.single("file"), uploadHandler);

export default router;
