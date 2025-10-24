import { Router } from 'express';
import { list, get, create, updateStatus } from '#app/controllers/deliveries/branchDeliveries.controller.js';

const r = Router();
r.get('/', list);
r.get('/:id', get);
r.post('/', create);
r.patch('/:id/status', updateStatus);

export default r;
