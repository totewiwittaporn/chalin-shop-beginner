// backend/src/server.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";

import { errorHandler } from "#app/error.js";
import { requireAuth } from "#app/middleware/auth.js";

// Routes
import productsRoutes from "#app/routes/products.routes.js";
import usersRoutes from "#app/routes/users.js";
import salesRoutes from "#app/routes/sales.js";
import productTypesRoutes from "#app/routes/productTypes.routes.js";
import authRoutes from "#app/routes/auth.routes.js";
import authMeRoutes from "#app/routes/auth.me.routes.js";
import branchesRouter from "#app/routes/branches.routes.js";

const app = express();
const PORT = Number(process.env.PORT || 5000);

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

// FE ใช้จริง
app.use("/api/product-types", productTypesRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/branches", branchesRouter);

// 404 fallback
app.use((_req, res) => res.status(404).json({ error: "Not Found" }));

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
