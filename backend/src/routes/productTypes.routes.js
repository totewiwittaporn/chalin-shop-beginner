import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { requireAuth, requireRole } from "../middleware/auth.js";
 
 const prisma = new PrismaClient();
 const router = Router();
 
router.use(requireAuth);
 
 router.get("/", async (req, res, next) => {
   try {
     const search = (req.query.search || "").toString();
   } catch (e) { next(e); }
 });
 
router.post("/", requireRole("ADMIN"), async (req, res, next) => {
   try {
     const { name } = req.body;
     const created = await prisma.productType.create({ data: { name } });
     res.status(201).json(created);
   } catch (e) { next(e); }
 });
 
router.put("/:id", requireRole("ADMIN"), async (req, res, next) => {
   try {
     const id = Number(req.params.id);
     const { name } = req.body;
     const updated = await prisma.productType.update({ where: { id }, data: { name } });
     res.json(updated);
   } catch (e) { next(e); }
 });
 
router.delete("/:id", requireRole("ADMIN"), async (req, res, next) => {
   try {
     const id = Number(req.params.id);
     await prisma.productType.delete({ where: { id } });
     res.status(204).end();
   } catch (e) { next(e); }
 });
 
 export default router;
