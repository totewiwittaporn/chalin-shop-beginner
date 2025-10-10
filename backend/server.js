// backend/src/server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");

const app = express();
const PORT = Number(process.env.PORT || 5000);

// middlewares
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

// health
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// product types route (อันที่คุณมี)
app.use("/api/product-types", require("./routes/productTypeRoutes"));

// start
app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
