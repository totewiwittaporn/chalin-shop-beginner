import api from "@/lib/axios";

/** ---------- HQ: Doc (Header/Footer) Templates ---------- */
export const getDocTemplates = async (hqId, params = {}) => {
  const { data } = await api.get(`/api/headquarters/${hqId}/doc-templates`, { params });
  // ปกป้อง TemplatePicker ไม่ให้พังถ้าโครงสร้าง response ต่างไป
  return Array.isArray(data?.items) || Array.isArray(data) ? data : { items: [] };
};

export const createDocTemplate = (hqId, payload) =>
  api.post(`/api/headquarters/${hqId}/doc-templates`, payload).then((r) => r.data);

export const updateDocTemplate = (hqId, id, payload) =>
  api.put(`/api/headquarters/${hqId}/doc-templates/${id}`, payload).then((r) => r.data);

/** ---------- HQ: Table Templates ---------- */
export const getTableTemplates = async (hqId, params = {}) => {
  const { data } = await api.get(`/api/headquarters/${hqId}/table-templates`, { params });
  return Array.isArray(data?.items) || Array.isArray(data) ? data : { items: [] };
};

export const createTableTemplate = (hqId, payload) =>
  api.post(`/api/headquarters/${hqId}/table-templates`, payload).then((r) => r.data);

export const updateTableTemplate = (hqId, id, payload) =>
  api.put(`/api/headquarters/${hqId}/table-templates/${id}`, payload).then((r) => r.data);

/** ---------- Partner: Document Preferences (ต่อ DocKind) ---------- */
export const getPartnerDocPrefs = (partnerId) =>
  api.get(`/api/consignment/partners/${partnerId}/doc-prefs`).then((r) => r.data);

export const updatePartnerDocPrefs = (partnerId, prefs /* Array<{docKind, headerTemplateId?, tableTemplateId?}> */) =>
  api.put(`/api/consignment/partners/${partnerId}/doc-prefs`, { items: prefs }).then((r) => r.data);
