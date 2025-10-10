import "dotenv/config";
import { createHash } from "node:crypto";
import app from "./app.js";

console.log(
  "[BOOT] JWT_SECRET_SHA256_HEAD:",
  createHash("sha256")
    .update(String(process.env.JWT_SECRET || ""))
    .digest("hex")
    .slice(0, 12)
);

const PORT = Number(process.env.PORT || 5000);
app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
  console.log(
    "[BOOT] JWT_SECRET length:",
    (process.env.JWT_SECRET || "").length
  );
});
