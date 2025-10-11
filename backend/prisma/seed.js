import { PrismaClient } from "@prisma/client";
import 'dotenv/config'
const prisma = new PrismaClient();

async function main() {
  // Branch
  const mainBranch = await prisma.branch.upsert({
    where: { code: "MAIN" },
    update: {},
    create: { code: "MAIN", name: "สาขาหลัก" },
  });

  // Users
  const admin = await prisma.user.upsert({
    where: { email: "admin@chalin.local" },
    update: {},
    create: {
      email: "admin@chalin.local",
      password: "admin123", // NOTE: dev only
      role: "ADMIN",
      branchId: mainBranch.id,
      name: "Admin",
    },
  });

  // Product Types
  const hairType = await prisma.productType.upsert({
    where: { name: "กิ๊บผม" },
    update: {},
    create: { name: "กิ๊บผม" },
  });

  // Products
  const p1 = await prisma.product.upsert({
    where: { barcode: "GB-STAR" },
    update: {},
    create: {
      barcode: "GB-STAR",
      name: "กิ๊บรูปดาว",
      productTypeId: hairType.id,
      costPrice: 10.00,
      salePrice: 25.00,
      branchId: mainBranch.id,
    },
  });
  const p2 = await prisma.product.upsert({
    where: { barcode: "GB-SEA" },
    update: {},
    create: {
      barcode: "GB-SEA",
      name: "กิ๊บทะเล",
      productTypeId: hairType.id,
      costPrice: 12.50,
      salePrice: 29.00,
      branchId: mainBranch.id,
    },
  });

  // Consignment Partner
  const partner = await prisma.consignmentPartner.upsert({
    where: { code: "GVT" },
    update: {},
    create: {
      code: "GVT",
      name: "Greenview Tour Shop",
      commissionRate: 10.0,
      status: "ACTIVE",
      branchId: mainBranch.id,
    },
  });

  // Consignment Category (single price)
  const cat = await prisma.consignmentCategory.upsert({
    where: { partnerId_code: { partnerId: partner.id, code: "GB25" } },
    update: {},
    create: {
      partnerId: partner.id,
      code: "GB25",
      name: "กิ๊บเล็ก ราคาเดียว",
      price: 25.00,
    },
  });

  // Map products to category
  await prisma.consignmentCategoryMap.upsert({
    where: { partnerId_productId: { partnerId: partner.id, productId: p1.id } },
    update: { categoryId: cat.id },
    create: { partnerId: partner.id, categoryId: cat.id, productId: p1.id },
  });
  await prisma.consignmentCategoryMap.upsert({
    where: { partnerId_productId: { partnerId: partner.id, productId: p2.id } },
    update: { categoryId: cat.id },
    create: { partnerId: partner.id, categoryId: cat.id, productId: p2.id },
  });

  // Inventory
  await prisma.consignmentInventory.upsert({
    where: { partnerId_productId: { partnerId: partner.id, productId: p1.id } },
    update: { qtyOnHand: 50 },
    create: { partnerId: partner.id, productId: p1.id, qtyOnHand: 50, price: 25.00 },
  });
  await prisma.consignmentInventory.upsert({
    where: { partnerId_productId: { partnerId: partner.id, productId: p2.id } },
    update: { qtyOnHand: 60 },
    create: { partnerId: partner.id, productId: p2.id, qtyOnHand: 60, price: 25.00 },
  });

  // Example CONSALE document
  const doc = await prisma.document.create({
    data: {
      kind: "CONSALE",
      status: "ISSUED",
      code: "CON-20251011-0001",
      issueDate: new Date(),
      branchId: mainBranch.id,
      createdById: admin.id,
      partnerId: partner.id,
      commissionRate: 10.0,
      subTotal: 50.00,
      discount: 0,
      tax: 0,
      total: 50.00,
      items: {
        create: [
          {
            name: "กิ๊บรูปดาว",
            barcode: "GB-STAR",
            displayName: "กิ๊บเล็กราคาเดียว",
            displayCode: "GB25",
            qty: 2,
            unitPrice: 25.00,
            total: 50.00,
            productId: p1.id,
            categoryId: cat.id,
          },
        ],
      },
    },
  });

  console.log("Seed completed:", { mainBranch, admin, pCount: 2, partner: partner.code, doc: doc.code });
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
