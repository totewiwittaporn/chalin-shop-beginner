import api from '@/lib/api';

export const deliveryAPI = {
  createBranch: (payload) => api.post('/api/delivery/branch/create', payload).then((r) => r.data),
  ackBranch: (payload) => api.post('/api/delivery/branch/ack', payload).then((r) => r.data),
  createConsignment: (payload) =>
    api.post('/api/delivery/consignment/create', payload).then((r) => r.data),
  ackConsignment: (payload) =>
    api.post('/api/delivery/consignment/ack', payload).then((r) => r.data),
};
