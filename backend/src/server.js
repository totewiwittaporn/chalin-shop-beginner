// src/server.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";

import { errorHandler } from "./error.js";
import { requireAuth } from "./middleware/auth.js";

// Routes ที่มีอยู่จริง
import productsRoutes from "./routes/products.routes.js";
import usersRoutes from "./routes/users.js";
import salesRoutes from "./routes/sales.js";
import productTypesRoutes from "./routes/productTypes.routes.js";

// ถ้ามี auth routes ของคุณอยู่แล้ว ให้ผูกไว้ก่อน requireAuth
import authRoutes from "./routes/auth.routes.js";
import authMeRoutes from "./routes/auth.me.routes.js";

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

// Public auth
app.use("/api/auth", authRoutes);
app.use("/api/auth", authMeRoutes);

// ==== Protected ====
app.use(requireAuth);

// เส้นทางที่ FE ใช้จริง
app.use("/api/product-types", productTypesRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/sales", salesRoutes);

// 404 fallback
app.use((_req, res) => res.status(404).json({ error: "Not Found" }));

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
