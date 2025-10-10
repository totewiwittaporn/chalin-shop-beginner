import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import authRoutes from "./routes/auth.routes.js";
import productTypesRoutes from "./routes/productTypes.routes.js";
import branchesRoutes from "./routes/branches.routes.js";
import { errorHandler } from "./middleware/error.js";
import debugRoutes from "./routes/_debug.routes.js";

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

app.use("/api/auth", authRoutes);
app.use("/api/product-types", productTypesRoutes);
app.use("/api/branches", branchesRoutes);

app.use(errorHandler);

export default app;
