import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { subDays, startOfDay, format } from "date-fns";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const days = Number(searchParams.get("days") || 14);
  const since = startOfDay(subDays(new Date(), days - 1));

  const [totalProducts, totalWarehouses, stockLevels, movements] = await Promise.all([
    prisma.product.count(),
    prisma.warehouse.count(),
    prisma.stockLevel.findMany({ include: { product: true } }),
    prisma.stockMovement.findMany({
      where: { createdAt: { gte: since } },
      include: { product: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const totalUnits = stockLevels.reduce((sum, s) => sum + s.quantity, 0);
  const totalValue = stockLevels.reduce((sum, s) => sum + s.quantity * Number(s.product.price), 0);

  // Sum on-hand quantity per product (across all warehouses), then compare to its reorder level
  type ProductTotal = { total: number; reorder: number };
  const productTotals = new Map<string, ProductTotal>();
  for (const s of stockLevels) {
    const existing = productTotals.get(s.productId);
    productTotals.set(s.productId, {
      total: (existing?.total || 0) + s.quantity,
      reorder: s.product.reorderLevel,
    });
  }
  const lowStockCount = Array.from(productTotals.values()).filter((v) => v.total <= v.reorder).length;

  // Build a per-day IN/OUT series
  const dayMap = new Map<string, { date: string; in: number; out: number }>();
  for (let i = 0; i < days; i++) {
    const d = format(subDays(new Date(), days - 1 - i), "MMM d");
    dayMap.set(d, { date: d, in: 0, out: 0 });
  }
  for (const m of movements) {
    const key = format(m.createdAt, "MMM d");
    const entry = dayMap.get(key);
    if (entry) {
      if (m.type === "IN") entry.in += m.quantity;
      else entry.out += m.quantity;
    }
  }

  return NextResponse.json({
    totalProducts,
    totalWarehouses,
    totalUnits,
    totalValue,
    lowStockCount,
    series: Array.from(dayMap.values()),
  });
}
