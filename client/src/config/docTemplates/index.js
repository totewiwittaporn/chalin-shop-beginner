// src/config/docTemplates/index.js
import { DOC_TYPES_POS } from "./docTemplatesPOS";
// ...import ชุดอื่นของคุณ

export const DOC_TYPES = {
  // ...ของเดิม
  ...DOC_TYPES_POS, // ⬅️ เพิ่มของ POS
};

export function getDocTemplate(docType /*, partnerCode, overrides */) {
  if (DOC_TYPES[docType]) return DOC_TYPES[docType];
  return undefined;
}
