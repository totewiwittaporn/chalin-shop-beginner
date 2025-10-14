import { BankAccountsService } from '#app/services/bankAccounts.service.js';

export const BankAccountsController = {
  // Branch
  async listBranch(req, res) {
    const rows = await BankAccountsService.listBranch(Int(req.params.branchId));
    res.json(rows);
  },
  async createBranch(req, res) {
    const row = await BankAccountsService.createBranch(Int(req.params.branchId), req.body);
    res.json(row);
  },
  async updateBranch(req, res) {
    const row = await BankAccountsService.updateBranch(req.params.accId, req.body);
    res.json(row);
  },
  async removeBranch(req, res) {
    await BankAccountsService.removeBranch(req.params.accId);
    res.json({ ok: true });
  },

  // Partner
  async listPartner(req, res) {
    const rows = await BankAccountsService.listPartner(Int(req.params.partnerId));
    res.json(rows);
  },
  async createPartner(req, res) {
    const row = await BankAccountsService.createPartner(Int(req.params.partnerId), req.body);
    res.json(row);
  },
  async updatePartner(req, res) {
    const row = await BankAccountsService.updatePartner(req.params.accId, req.body);
    res.json(row);
  },
  async removePartner(req, res) {
    await BankAccountsService.removePartner(req.params.accId);
    res.json({ ok: true });
  },

  // Default
  async setDefault(req, res) {
    const { scope } = req.params;               // 'branch' | 'partner'
    const { ownerId, accId, forType } = req.body; // forType: 'RECEIPT' | 'BILL'
    const row = await BankAccountsService.setDefault({ scope, ownerId: Int(ownerId), accId: Int(accId), forType });
    res.json(row);
  },
};
