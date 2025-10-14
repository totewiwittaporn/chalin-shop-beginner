import api from '@/lib/api';

export const bankAPI = {
  listBranch: (branchId) => api.get(`/api/branches/${branchId}/bank-accounts`).then(r => r.data),
  createBranch: (branchId, data) => api.post(`/api/branches/${branchId}/bank-accounts`, data).then(r => r.data),
  updateBranch: (accId, data) => api.put(`/api/branches/bank-accounts/${accId}`, data).then(r => r.data),
  removeBranch: (accId) => api.delete(`/api/branches/bank-accounts/${accId}`).then(r => r.data),

  listPartner: (partnerId) => api.get(`/api/consignment/partners/${partnerId}/bank-accounts`).then(r => r.data),
  createPartner: (partnerId, data) => api.post(`/api/consignment/partners/${partnerId}/bank-accounts`, data).then(r => r.data),
  updatePartner: (accId, data) => api.put(`/api/consignment/bank-accounts/${accId}`, data).then(r => r.data),
  removePartner: (accId) => api.delete(`/api/consignment/bank-accounts/${accId}`).then(r => r.data),

  setDefault: (scope, ownerId, accId, forType) =>
    api.post(`/api/bank-accounts/${scope}/set-default`, { ownerId, accId, forType }).then(r => r.data),
};
