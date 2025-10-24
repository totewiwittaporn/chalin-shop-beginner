// backend/src/routes/deliveries/consignmentDeliveries.routes.js
import { Router } from 'express';
import {
  list,
  get,
  create,
  updateStatus,
  confirmReceive,
} from '#app/controllers/deliveries/consignmentDeliveries.controller.js';

const r = Router();

r.get('/', list);
r.get('/:id', get);
r.post('/', create);
r.patch('/:id/status', updateStatus);
r.patch('/:id/confirm', confirmReceive);

export default r;
