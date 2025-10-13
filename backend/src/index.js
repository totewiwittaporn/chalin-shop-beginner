// backend/src/index.js
import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import "dotenv/config";

import { requireAuth } from "#app/middleware/auth.js";
import { errorHandler } from "#app/middleware/error.js";
import { mountPublicRoutes, mountProtectedRoutes } from "#app/routes/index.js";

const app = express();

// Base middlewares
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(",") || "*",
  credentials: true,
}));
app.use(express.json());

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// Health
app.get("/health", (_req, res) => res.json({ ok: true, env: process.env.NODE_ENV || "development" }));

// Public routes (ไม่ต้องล็อกอิน)
mountPublicRoutes(app);

// Protected routes (ต้องล็อกอิน)
app.use(requireAuth);
mountProtectedRoutes(app);

// 404 fallback
app.use((_req, res) => res.status(404).json({ message: "Not Found" }));

// Error handler กลาง
app.use(errorHandler);

const port = Number(process.env.PORT || 5000);
app.listen(port, () => {
  console.log(`[API] Ready on http://localhost:${port} (${process.env.NODE_ENV || "development"})`);
});
