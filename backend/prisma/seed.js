import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const mainBranch = await prisma.branch.upsert({
    where: { code: "MAIN" },
    update: {},
    create: { code: "MAIN", name: "Chalin Shop", address: "-" }
  });

  await prisma.productType.upsert({
    where: { name: "เครื่องประดับ" },
    update: {},
    create: { name: "เครื่องประดับ" }
  });

  const adminPass = await bcrypt.hash("Tg271260", 10);
  await prisma.user.upsert({
    where: { email: "admin@chalinshop.com" },
    update: {},
    create: {
      email: "admin@chalinshop.com",
      password: adminPass,
      name: "System Admin",
      role: Role.ADMIN,
      branchId: mainBranch.id
    }
  });
  console.log("✅ Seed completed");
}

main().finally(async () => prisma.$disconnect());
