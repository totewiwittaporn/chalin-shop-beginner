import express from "express";
import morgan from "morgan";
import cors from "cors";
import 'dotenv/config'
import { auth } from "#app/middleware/auth.js";
import productsRouter from "#app/routes/products.js";
import consignmentCategoriesRouter from "#app/routes/consignmentCategories.js";
import documentsRouter from "#app/routes/documents.js";

import usersRouter from "#app/routes/users.js";
import salesRouter from "#app/routes/sales.js";

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (req, res) => res.json({ ok: true }));

app.use(auth);

app.use("/api/products", productsRouter);
app.use("/api/consignment-categories", consignmentCategoriesRouter);
app.use("/api/documents", documentsRouter);

app.use("/api/users", usersRouter);
app.use("/api/sales", salesRouter);

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`API on http://localhost:${port}`));
