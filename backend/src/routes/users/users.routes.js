// backend/src/routes/users/users.routes.js
import express from "express";
import { requireAuth, requireRole } from "#app/middleware/auth.js";
import { listUsers, updateUser } from "#app/controllers/users/usersController.js";

const r = express.Router();

// NOTE: เงื่อนไขสิทธิ์ — ADMIN เท่านั้น
r.get("/", requireAuth, requireRole("ADMIN"), listUsers);
r.patch("/:id", requireAuth, requireRole("ADMIN"), updateUser);

export default r;
