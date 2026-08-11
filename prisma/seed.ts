import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash("Admin@123", 10);
  const staffPassword = await bcrypt.hash("Staff@123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@example.com",
      password: adminPassword,
      role: "ADMIN",
    },
  });

  await prisma.user.upsert({
    where: { email: "staff@example.com" },
    update: {},
    create: {
      name: "Staff User",
      email: "staff@example.com",
      password: staffPassword,
      role: "STAFF",
    },
  });

  const electronics = await prisma.category.upsert({
    where: { name: "Electronics" },
    update: {},
    create: { name: "Electronics", description: "Electronic components and devices" },
  });

  const stationery = await prisma.category.upsert({
    where: { name: "Stationery" },
    update: {},
    create: { name: "Stationery", description: "Office and stationery supplies" },
  });

  const mainWarehouse = await prisma.warehouse.upsert({
    where: { name: "Main Warehouse" },
    update: {},
    create: { name: "Main Warehouse", location: "Bhubaneswar, Odisha" },
  });

  const secondaryWarehouse = await prisma.warehouse.upsert({
    where: { name: "Secondary Warehouse" },
    update: {},
    create: { name: "Secondary Warehouse", location: "Cuttack, Odisha" },
  });

  const products = [
    { sku: "ELE-001", barcode: "8901234500017", name: "USB-C Cable 1m", categoryId: electronics.id, price: 149.0, reorderLevel: 20 },
    { sku: "ELE-002", barcode: "8901234500024", name: "Wireless Mouse", categoryId: electronics.id, price: 599.0, reorderLevel: 15 },
    { sku: "STA-001", barcode: "8901234500031", name: "A4 Paper Ream", categoryId: stationery.id, price: 249.0, reorderLevel: 30 },
  ];

  for (const p of products) {
    const product = await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: { ...p, unit: "pcs" },
    });

    await prisma.stockLevel.upsert({
      where: { productId_warehouseId: { productId: product.id, warehouseId: mainWarehouse.id } },
      update: {},
      create: { productId: product.id, warehouseId: mainWarehouse.id, quantity: 50 },
    });
    await prisma.stockLevel.upsert({
      where: { productId_warehouseId: { productId: product.id, warehouseId: secondaryWarehouse.id } },
      update: {},
      create: { productId: product.id, warehouseId: secondaryWarehouse.id, quantity: 10 },
    });
  }

  console.log("Seed complete. Login with admin@example.com / Admin@123 or staff@example.com / Staff@123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
