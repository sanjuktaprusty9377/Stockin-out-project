import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const products = await prisma.product.findMany({
    include: { stockLevels: { include: { warehouse: true } }, category: true },
  });

  const lowStock = products
    .map((p) => ({
      ...p,
      totalStock: p.stockLevels.reduce((sum, s) => sum + s.quantity, 0),
    }))
    .filter((p) => p.totalStock <= p.reorderLevel)
    .sort((a, b) => a.totalStock - b.totalStock);

  return NextResponse.json(lowStock);
}
