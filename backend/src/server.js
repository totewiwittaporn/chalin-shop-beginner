import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";

import { errorHandler } from "#app/error.js";
import { requireAuth } from "#app/middleware/auth.js";

// ✅ ใช้ตัวรวมเส้นทางใหม่ (alias #app/)
import { mountPublic, mountProtected } from "#app/routes/index.js";

const app = express();
const PORT = Number(process.env.PORT || 5000);

// CORS
const allowOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(cors({ origin: allowOrigins.length ? allowOrigins : true, credentials: true }));
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

// Health
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// ===== Public routes (no auth) =====
mountPublic(app);

// ===== Protected routes (require auth) =====
app.use(requireAuth);
mountProtected(app);

// 404 fallback
app.use((_req, res) => res.status(404).json({ error: "Not Found" }));

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
