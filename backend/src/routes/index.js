// รวมทุก router ที่จะ mount เข้าระบบ
// ใช้ alias "#app/" ตามที่ตั้งค่าไว้

import authRoutes from "#app/routes/auth/auth.routes.js";
import authMeRoutes from "#app/routes/auth/auth.me.routes.js";

import productsRoutes from "#app/routes/products/products.routes.js";
import productTypesRoutes from "#app/routes/products/productTypes.routes.js";

import branchesRoutes from "#app/routes/branches/branches.routes.js";
import usersRoutes from "#app/routes/users/users.js";
import salesRoutes from "#app/routes/sales/sales.js";

// Consignment family (บางไฟล์อาจยังไม่มี สร้างตามเฟส)
import consignmentPartnersRoutes from "#app/routes/consignment/consignment.partners.routes.js";
import consignmentCategoriesRoutes from "#app/routes/consignment/categories.routes.js";
// import consignmentDeliveriesRoutes from "#app/routes/consignment/deliveries.routes.js";
// import consignmentBillingsRoutes from "#app/routes/consignment/billings.routes.js";
// import consignmentReceiptsRoutes from "#app/routes/consignment/receipts.routes.js";

export function mountPublic(app) {
  // เส้นทางสาธารณะ (ก่อน requireAuth)
  app.use("/api/auth", authRoutes);
  app.use("/api/auth", authMeRoutes);
}

export function mountProtected(app) {
  // เส้นทางที่ต้อง auth แล้ว (หลัง requireAuth)
  app.use("/api/product-types", productTypesRoutes);
  app.use("/api/products", productsRoutes);
  app.use("/api/users", usersRoutes);
  app.use("/api/branches", branchesRoutes);
  app.use("/api/sales", salesRoutes);

  // Consignment
  app.use("/api/consignment/partners", consignmentPartnersRoutes);
  app.use("/api/consignment/partners", consignmentPartnersRoutes);
  app.use("/api/consignment/categories", consignmentCategoriesRoutes);
  // app.use("/api/consignment/deliveries", consignmentDeliveriesRoutes);
  // app.use("/api/consignment/billings", consignmentBillingsRoutes);
  // app.use("/api/consignment/receipts", consignmentReceiptsRoutes);
}
