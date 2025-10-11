// backend/src/error.js
export function errorHandler(err, req, res, _next) {
  // โครง log ที่อ่านง่ายเวลา dev
  const status = typeof err.status === "number" ? err.status : 500;
  const code = err.code || undefined;

  // ซ่อน stack ใน production
  const payload = {
    error: err.message || "Internal Server Error",
    ...(code ? { code } : {}),
    ...(process.env.NODE_ENV !== "production" ? { stack: err.stack } : {}),
  };

  // ใส่ trace เบา ๆ ใน dev เพื่อไล่ต้นตอ
  if (process.env.NODE_ENV !== "production") {
    console.error("[ERROR]", {
      path: req.path,
      method: req.method,
      status,
      message: err.message,
      stack: err.stack,
    });
  }

  res.status(status).json(payload);
}
