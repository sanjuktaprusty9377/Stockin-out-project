import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({ name: z.string().min(1), location: z.string().optional().nullable() });

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const warehouses = await prisma.warehouse.findMany({
    include: { stockLevels: true },
    orderBy: { name: "asc" },
  });
  const withTotals = warehouses.map((w) => ({
    ...w,
    totalUnits: w.stockLevels.reduce((sum, s) => sum + s.quantity, 0),
  }));
  return NextResponse.json(withTotals);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  try {
    const warehouse = await prisma.warehouse.create({ data: parsed.data });
    const products = await prisma.product.findMany();
    await prisma.stockLevel.createMany({
      data: products.map((p) => ({ productId: p.id, warehouseId: warehouse.id, quantity: 0 })),
      skipDuplicates: true,
    });
    return NextResponse.json(warehouse, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Warehouse name already exists" }, { status: 409 });
  }
}
