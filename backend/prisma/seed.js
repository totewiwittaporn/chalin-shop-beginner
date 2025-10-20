// backend/prisma/seed.js
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding...");

  // Users
  const adminEmail = "admin@chalinshop.com";
  const adminPass = "Tg271260";
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: "ผู้ดูแลระบบ",
      role: "ADMIN",
      password: adminPass,
      passwordHash: await bcrypt.hash(adminPass, 10),
    },
  });
  console.log("👑 Admin:", admin.email, "/", adminPass);

  const consignEmail = "totee.wiwittaporn@gmail.com";
  const consignPass = "Tg271260";
  await prisma.user.upsert({
    where: { email: consignEmail },
    update: {},
    create: {
      email: consignEmail,
      name: "ร้านฝากขายทดสอบ",
      role: "CONSIGNMENT",
      password: await bcrypt.hash(adminPass, 10),
      passwordHash: await bcrypt.hash(consignPass, 10),
    },
  });
  console.log("🏪 Consignment:", consignEmail, "/", consignPass);

  // Branch (stock owner)
  const stockBranch = await prisma.branch.upsert({
    where: { code: "MAIN-STOCK" },
    update: {},
    create: {
      code: "MAIN-STOCK",
      name: "คลังหลัก (stock owner)",
      isActive: true,
    },
  });
  console.log("🏬 Stock Branch:", stockBranch.code);

  // Headquarters
  const hq = await prisma.headquarters.upsert({
    where: { code: "HQ" },
    update: { stockBranchId: stockBranch.id },
    create: {
      code: "HQ",
      name: "สาขาหลัก (ชื่อจริงในระบบ)",
      stockBranchId: stockBranch.id,
    },
  });
  console.log("🏢 HQ:", hq.code);

  // Consignment Partners
  const partnerA = await prisma.consignmentPartner.upsert({
    where: { code: "A" },
    update: {},
    create: { code: "A", name: "ร้านฝากขาย A" },
  });
  const partnerB = await prisma.consignmentPartner.upsert({
    where: { code: "B" },
    update: {},
    create: { code: "B", name: "ร้านฝากขาย B" },
  });
  console.log("🤝 Partners:", partnerA.code, partnerB.code);

  // HQ Alias per Partner
  await prisma.headquartersAlias.upsert({
    where: {
      partnerId_headquartersId: {
        partnerId: partnerA.id,
        headquartersId: hq.id,
      },
    },
    update: { displayName: "Chalin Clothes" },
    create: {
      partnerId: partnerA.id,
      headquartersId: hq.id,
      displayName: "Chalin Clothes",
    },
  });
  await prisma.headquartersAlias.upsert({
    where: {
      partnerId_headquartersId: {
        partnerId: partnerB.id,
        headquartersId: hq.id,
      },
    },
    update: { displayName: "สุกัญญา" },
    create: {
      partnerId: partnerB.id,
      headquartersId: hq.id,
      displayName: "สุกัญญา",
    },
  });
  console.log("🏷  HQ Aliases: OK");

  // Product type + products
  const type = await prisma.productType.upsert({
    where: { name: "เครื่องประดับ" },
    update: {},
    create: { name: "เครื่องประดับ" },
  });
  await prisma.product.upsert({
    where: { sku: "GB-SILVER" },
    update: {},
    create: {
      sku: "GB-SILVER",
      name: "กิ๊บเงิน",
      basePrice: 20,
      salePrice: 25,
      typeId: type.id,
    },
  });
  await prisma.product.upsert({
    where: { sku: "GB-GOLD" },
    update: {},
    create: {
      sku: "GB-GOLD",
      name: "กิ๊บทอง",
      basePrice: 25,
      salePrice: 30,
      typeId: type.id,
    },
  });
  console.log("🧾 Products: OK");

  // Payment Channels for HQ
  await prisma.bankAccount.upsert({
    where: { id: 1 }, // ใช้ where ที่เหมาะสมในระบบคุณ (เช่น unique composite)
    update: {},
    create: {
      ownerKind: "HEADQUARTERS",
      ownerId: hq.id,
      channelType: "BANK",
      bankCode: "KBANK",
      accountNo: "123-4-56789-0",
      accountName: "บริษัท ชาลิน จำกัด",
      preferred: true,
      isActive: true,
      displayName: "บัญชี KBANK (หลัก)",
    },
  });
  await prisma.bankAccount.upsert({
    where: { id: 2 },
    update: {},
    create: {
      ownerKind: "HEADQUARTERS",
      ownerId: hq.id,
      channelType: "PROMPTPAY",
      promptpayId: "0800000000",
      preferred: false,
      isActive: true,
      displayName: "PromptPay - HQ",
    },
  });
  console.log("💳 Payment Channels (HQ): OK");

  console.log("✅ Seeding complete.");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
