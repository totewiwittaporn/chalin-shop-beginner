// backend/src/routes/index.js

// PUBLIC
import authRoutes from "#app/routes/auth/auth.routes.js";
import authMeRoutes from "#app/routes/auth/auth.me.routes.js";

// PROTECTED
import productsRoutes from "#app/routes/products/products.routes.js";
import productTypesRoutes from "#app/routes/products/productTypes.routes.js";
import branchesRoutes from "#app/routes/branches/branches.routes.js";
import usersRoutes from "#app/routes/users/users.routes.js";
import salesBranchRoutes from "#app/routes/sales/branch/sales.routes.js";
import salesDashboardRoutes from "#app/routes/sales/dashboard.routes.js";

// Consignment
import consignmentRouter from "#app/routes/consignment/index.js";
import consignmentDeliveriesRoutes from "#app/routes/deliveries/consignmentDeliveries.routes.js";

// Others
import purchasesRouter from "#app/routes/purchases/purchases.routes.js";
import suppliersRouter from "#app/routes/suppliers/suppliers.routes.js";
import ordersRoutes from "#app/routes/orders/orders.routes.js";
import inventoryRoutes from "#app/routes/inventory/inventory.routes.js";
import bankAccountsRoutes from "#app/routes/bank/bank-accounts.routes.js";
import deliveriesRoutes from "#app/routes/deliveries/branchDeliveries.routes.js";
import deliveryDocRoutes from "#app/routes/docs/delivery.routes.js";
import printRoutes from "#app/routes/print.routes.js";

// Headquarters (core)
import headquartersRouter from "#app/routes/headquarter/headquarters.routes.js";

// ✅ NEW: Templates & Partner Prefs
import hqTableTplRouter from "#app/routes/headquarter/headquarters.tableTemplates.routes.js";
import hqDocTplRouter from "#app/routes/headquarter/headquarters.docTemplates.routes.js";
import partnerDocPrefsRouter from "#app/routes/docs/partners.docPrefs.routes.js";

// ✅ NEW: operational deliveries (ใช้โมเดลใหม่)
import branchOperationalRoutes from "#app/routes/deliveries/branchDeliveries.routes.js";
import consignOperationalRoutes from "#app/routes/deliveries/consignmentDeliveries.routes.js";

// Doc
import documentsRoutes from "#app/routes/docs/documents.routes.js";


// ----------------------------------------

export function mountPublicRoutes(app) {
  app.use("/api/auth", authRoutes);
  app.use("/api/auth/me", authMeRoutes);
}

export function mountProtectedRoutes(app) {
  // Core
  app.use("/api/products", productsRoutes);
  app.use("/api/product-types", productTypesRoutes);
  app.use("/api/users", usersRoutes);
  app.use("/api/branches", branchesRoutes);

  // POS (สาขา)
  app.use("/api/sales/branch", salesBranchRoutes);
  app.use("/api/sales", salesDashboardRoutes);

  // Consignment
  app.use("/api/consignment", consignmentRouter);

  // ✅ โมเดลใหม่
  app.use("/api/branch-deliveries", branchOperationalRoutes);
  app.use("/api/consignment-deliveries", consignOperationalRoutes);

  // ♻️ alias ชั่วคราว (ของเดิม)
  app.use("/api/deliveries", deliveriesRoutes);
  app.use("/api/deliveries/consignment", consignmentDeliveriesRoutes);

  // Others
  app.use("/api/purchases", purchasesRouter);
  app.use("/api/suppliers", suppliersRouter);
  app.use("/api/orders", ordersRoutes);
  app.use("/api/inventory", inventoryRoutes);
  app.use("/api", bankAccountsRoutes);

  // Headquarters + templates
  app.use("/api/headquarters", headquartersRouter);
  app.use("/api/headquarters", hqTableTplRouter);
  app.use("/api/headquarters", hqDocTplRouter);

  // Consignment Partner → document preferences
  app.use("/api/consignment/partners", partnerDocPrefsRouter);

  // Print PDF
  app.use("/api/docs/delivery", deliveryDocRoutes);
  app.use("/api/print", printRoutes);
  app.use("/api/docs", documentsRoutes);

}
