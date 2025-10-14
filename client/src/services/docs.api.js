import api from '@/lib/api'


export const docsAPI = {
createBill: (payload) => api.post('/api/docs/bill', payload).then(r => r.data),
createReceipt: (payload) => api.post('/api/docs/receipts', payload).then(r => r.data),
getDoc: (kind, id) => api.get(`/api/docs/${kind}/${id}`).then(r => r.data),
}