import { prisma } from '#app/lib/prisma.js';

// Helper: reset default flags within same owner scope
async function resetDefault({ scope, ownerId, field }) {
  if (scope === 'branch') {
    await prisma.branchBankAccount.updateMany({
      where: { branchId: ownerId, [field]: true },
      data:  { [field]: false }
    });
  } else {
    await prisma.partnerBankAccount.updateMany({
      where: { partnerId: ownerId, [field]: true },
      data:  { [field]: false }
    });
  }
}

export const BankAccountsService = {
  listBranch(branchId) {
    return prisma.branchBankAccount.findMany({ where: { branchId } });
  },
  createBranch(branchId, data) {
    return prisma.branchBankAccount.create({ data: { branchId, ...data } });
  },
  updateBranch(accId, data) {
    return prisma.branchBankAccount.update({ where: { id: Int(accId) }, data });
  },
  removeBranch(accId) {
    return prisma.branchBankAccount.delete({ where: { id: Int(accId) } });
  },

  listPartner(partnerId) {
    return prisma.partnerBankAccount.findMany({ where: { partnerId } });
  },
  createPartner(partnerId, data) {
    return prisma.partnerBankAccount.create({ data: { partnerId, ...data } });
  },
  updatePartner(accId, data) {
    return prisma.partnerBankAccount.update({ where: { id: Int(accId) }, data });
  },
  removePartner(accId) {
    return prisma.partnerBankAccount.delete({ where: { id: Int(accId) } });
  },

  async setDefault({ scope, ownerId, accId, forType }) {
    const field = forType === 'RECEIPT' ? 'isDefaultForReceipt' : 'isDefaultForBill';
    await resetDefault({ scope, ownerId, field });
    if (scope === 'branch') {
      return prisma.branchBankAccount.update({
        where: { id: Int(accId) },
        data: { [field]: true }
      });
    } else {
      return prisma.partnerBankAccount.update({
        where: { id: Int(accId) },
        data: { [field]: true }
      });
    }
  }
};
