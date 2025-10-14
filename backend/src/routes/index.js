// backend/src/routes/index.js
// รวม router ทั้งหมด และแยกเป็น public/protected ให้ mount จาก entry

// PUBLIC
import authRoutes from "#app/routes/auth/auth.routes.js";
import authMeRoutes from "#app/routes/auth/auth.me.routes.js";

// PROTECTED
import productsRoutes from "#app/routes/products/products.routes.js";
import productTypesRoutes from "#app/routes/products/productTypes.routes.js";
import branchesRoutes from "#app/routes/branches/branches.routes.js";
import usersRoutes from "#app/routes/users/users.routes.js";
import salesRoutes from "#app/routes/sales/sales.routes.js";

// Consignment
import consignmentPartnersRoutes from "#app/routes/consignment/consignment.partners.routes.js";
import consignmentCategoriesRoutes from "#app/routes/consignment/categories.routes.js";

// Others
import suppliersRoutes from "#app/routes/suppliers/suppliers.routes.js";
import purchasesRoutes from "#app/routes/purchases/purchases.routes.js";
import ordersRoutes from "#app/routes/orders/orders.routes.js";
import inventoryRoutes from "#app/routes/inventory/inventory.routes.js";
import transfersRoutes from "#app/routes/transfers/transfers.routes.js";
import bankAccountsRoutes from '#app/routes/bank/bank-accounts.routes.js';

export function mountPublicRoutes(app) {
  app.use("/api/auth", authRoutes);
  app.use("/api/auth/me", authMeRoutes);
}

export function mountProtectedRoutes(app) {
  // Core
  app.use("/api/product-types", productTypesRoutes);
  app.use("/api/products", productsRoutes);
  app.use("/api/users", usersRoutes);
  app.use("/api/branches", branchesRoutes);
  app.use("/api/sales", salesRoutes);

  // Consignment
  app.use("/api/consignment/partners", consignmentPartnersRoutes);
  app.use("/api/consignment/categories", consignmentCategoriesRoutes);

  // Others
  app.use("/api/suppliers", suppliersRoutes);
  app.use("/api/purchases", purchasesRoutes);
  app.use("/api/orders", ordersRoutes);
  app.use("/api/inventory", inventoryRoutes);
  app.use("/api/transfers", transfersRoutes);
  app.use('/api', bankAccountsRoutes);
}
