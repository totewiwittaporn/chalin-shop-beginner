// client/src/services/consignmentPartners.api.js
import api from "@/lib/api";

// คืน Array<Partner> หรือ []  (รองรับทั้ง {items:[]} และ array ตรงๆ)
export async function getConsignmentPartners({ q = "", status = "ACTIVE", page = 1, pageSize = 500 } = {}) {
  const res = await api.get("/api/consignment/partners", {
    params: { q, status, page, pageSize },
  });
  const data = res.data || [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.items)) return data.items;
  return [];
}
