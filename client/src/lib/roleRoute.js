export function dashboardPathByRole(role) {
  const r = String(role || "").toUpperCase();
  switch (r) {
    case "ADMIN": return "/dashboard/admin";
    case "STAFF": return "/dashboard/staff";
    case "CONSIGNMENT": return "/dashboard/consignment";
    case "QUOTE_VIEWER": return "/viewer/welcome";
    default: return "/dashboard/staff";
  }
}
