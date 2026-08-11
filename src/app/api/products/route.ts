import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const productSchema = z.object({
  sku: z.string().min(1),
  barcode: z.string().optional().nullable(),
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  unit: z.string().default("pcs"),
  price: z.number().nonnegative().default(0),
  reorderLevel: z.number().int().nonnegative().default(10),
  categoryId: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || undefined;
  const categoryId = searchParams.get("categoryId") || undefined;

  const products = await prisma.product.findMany({
    where: {
      AND: [
        q
          ? {
              OR: [
                { name: { contains: q } },
                { sku: { contains: q } },
                { barcode: { contains: q } },
              ],
            }
          : {},
        categoryId ? { categoryId } : {},
      ],
    },
    include: {
      category: true,
      stockLevels: { include: { warehouse: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const withTotals = products.map((p) => ({
    ...p,
    totalStock: p.stockLevels.reduce((sum, s) => sum + s.quantity, 0),
    lowStock: p.stockLevels.reduce((sum, s) => sum + s.quantity, 0) <= p.reorderLevel,
  }));

  return NextResponse.json(withTotals);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  try {
    const product = await prisma.product.create({ data: parsed.data });

    const warehouses = await prisma.warehouse.findMany();
    await prisma.stockLevel.createMany({
      data: warehouses.map((w) => ({ productId: product.id, warehouseId: w.id, quantity: 0 })),
      skipDuplicates: true,
    });

    return NextResponse.json(product, { status: 201 });
  } catch (e: any) {
    if (e.code === "P2002") {
      return NextResponse.json({ error: "SKU or barcode already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 });
  }
}
