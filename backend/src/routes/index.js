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

// Consignment
import consignmentPartnersRouter from "#app/routes/consignment/consignment.partners.routes.js";
import consignmentCategoriesRouter from "#app/routes/consignment/consignment.categories.routes.js";
import consignmentCategoryProductsRouter from "#app/routes/consignment/consignment.categoryProducts.routes.js";

// Others
import purchasesRouter from "#app/routes/purchases/purchases.routes.js";
import suppliersRouter from "#app/routes/suppliers/suppliers.routes.js";
import ordersRoutes from "#app/routes/orders/orders.routes.js";
import inventoryRoutes from "#app/routes/inventory/inventory.routes.js";
import bankAccountsRoutes from "#app/routes/bank/bank-accounts.routes.js";
import deliveriesRoutes from "#app/routes/deliveries/deliveries.routes.js";
import printRoutes from "#app/routes/print.routes.js";

// ✅ แก้ให้ชี้ไฟล์ใหม่ที่ถูกต้อง
import salesRoutes from "#app/routes/sales/sales.routes.js";

export function mountPublicRoutes(app) {
  app.use("/api/auth", authRoutes);
  app.use("/api/auth/me", authMeRoutes);
}

export function mountProtectedRoutes(app) {
  app.use("/api/products", productsRoutes);
  app.use("/api/product-types", productTypesRoutes);
  app.use("/api/users", usersRoutes);
  app.use("/api/branches", branchesRoutes);

  // POS (สาขา)
  app.use("/api/sales/branch", salesBranchRoutes);

  // Consignment
  app.use("/api/consignment/partners", consignmentPartnersRouter);
  app.use("/api/consignment/categories", consignmentCategoriesRouter);
  app.use("/api/consignment/categories", consignmentCategoryProductsRouter);

  // Others
  app.use("/api/purchases", purchasesRouter);
  app.use("/api/suppliers", suppliersRouter);
  app.use("/api/orders", ordersRoutes);
  app.use("/api/inventory", inventoryRoutes);
  app.use("/api", bankAccountsRoutes);
  app.use("/api/deliveries", deliveriesRoutes);

  // 📄 Print PDF (คงไว้ที่นี่ที่เดียว)
  app.use("/api/print", printRoutes);

  // Sales summary / top-products / staff-summary
  app.use("/api/sales", salesRoutes);
}
