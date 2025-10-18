export function withBranchContext(req, res, next) {
  const role = req.user?.role;
  const body = req.body || {};
  const header = body.header || {};

  if (role === "STAFF") {
    const staffBranchId = req.user?.branchId;
    if (!staffBranchId) return res.status(403).json({ message: "STAFF has no branch assigned" });
    req.branchId = Number(staffBranchId);
    body.header = { ...header, branchId: req.branchId };
    return next();
  }

  if (role === "ADMIN") {
    const bId = header.branchId ?? req.query.branchId;
    if (!bId) return res.status(400).json({ message: "branchId is required for ADMIN" });
    req.branchId = Number(bId);
    body.header = { ...header, branchId: req.branchId };
    return next();
  }

  return res.status(403).json({ message: "role not allowed" });
}
