import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import authRoutes from "#app/routes/auth.routes.js";
import productTypesRoutes from "#app/routes/productTypes.routes.js";
import branchesRoutes from "#app/routes/branches.routes.js";
import { errorHandler } from "#app/middleware/error.js";
import debugRoutes from "#app/routes/_debug.routes.js";
import authMeRoutes from "#app/routes/auth.me.routes.js";
import productsRoutes from "#app/routes/products.routes.js";
import suppliersRoutes from "#app/src/routes/suppliers/suppliersRoutes.js";

const app = express();

const allowed = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      return cb(null, allowed.includes(origin));
    },
    credentials: true,
  })
);

app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

app.use("/api/_debug", debugRoutes);
app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api/auth", authMeRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/product-types", productTypesRoutes);
app.use("/api/branches", branchesRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/suppliers", suppliersRoutes);

app.use(errorHandler);

export default app;
