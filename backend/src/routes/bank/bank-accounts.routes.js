import { Router } from 'express';
import { BankAccountsController as C } from '#app/controllers/bank/bankAccounts.controller.js';
import { requireAuth } from '#app/middleware/auth.js';

const r = Router();
r.use(requireAuth);

// Branch accounts
r.get('/branches/:branchId/bank-accounts', C.listBranch);
r.post('/branches/:branchId/bank-accounts', C.createBranch);
r.put('/branches/bank-accounts/:accId', C.updateBranch);
r.delete('/branches/bank-accounts/:accId', C.removeBranch);

// Partner accounts
r.get('/consignment/partners/:partnerId/bank-accounts', C.listPartner);
r.post('/consignment/partners/:partnerId/bank-accounts', C.createPartner);
r.put('/consignment/bank-accounts/:accId', C.updatePartner);
r.delete('/consignment/bank-accounts/:accId', C.removePartner);

// Set default
r.post('/bank-accounts/:scope/set-default', C.setDefault); // scope: branch|partner

export default r;
