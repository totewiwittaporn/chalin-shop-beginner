// backend/src/routes/deliveries/consignmentDeliveries.routes.js
import { Router } from 'express';
import * as ctrl from '#app/controllers/deliveries/consignmentDeliveries.controller.js';
// TODO: ใส่ middleware auth/role ตามจริง เช่น requireAuth, allowRoles(['ADMIN','CONSIGN'])

const router = Router();

router.get('/', ctrl.list);
router.post('/', ctrl.create);
router.get('/:id', ctrl.get);
router.patch('/:id/receive', ctrl.receive);
router.get('/:id/print', ctrl.print);

export default router;
