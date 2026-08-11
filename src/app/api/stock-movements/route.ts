import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  type: z.enum(["IN", "OUT"]),
  quantity: z.number().int().positive(),
  productId: z.string().min(1),
  warehouseId: z.string().min(1),
  reference: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId") || undefined;
  const warehouseId = searchParams.get("warehouseId") || undefined;
  const type = searchParams.get("type") as "IN" | "OUT" | null;
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const limit = Number(searchParams.get("limit") || 50);

  const movements = await prisma.stockMovement.findMany({
    where: {
      productId,
      warehouseId,
      type: type || undefined,
      createdAt: {
        gte: from ? new Date(from) : undefined,
        lte: to ? new Date(to) : undefined,
      },
    },
    include: { product: true, warehouse: true, user: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return NextResponse.json(movements);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { type, quantity, productId, warehouseId, reference, note } = parsed.data;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const stockLevel = await tx.stockLevel.upsert({
        where: { productId_warehouseId: { productId, warehouseId } },
        update: {},
        create: { productId, warehouseId, quantity: 0 },
      });

      if (type === "OUT" && stockLevel.quantity < quantity) {
        throw new Error("INSUFFICIENT_STOCK");
      }

      const newQuantity = type === "IN" ? stockLevel.quantity + quantity : stockLevel.quantity - quantity;

      await tx.stockLevel.update({
        where: { productId_warehouseId: { productId, warehouseId } },
        data: { quantity: newQuantity },
      });

      const movement = await tx.stockMovement.create({
        data: {
          type,
          quantity,
          productId,
          warehouseId,
          userId: session.user.id,
          reference,
          note,
        },
        include: { product: true, warehouse: true, user: { select: { name: true } } },
      });

      return movement;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (e: any) {
    if (e.message === "INSUFFICIENT_STOCK") {
      return NextResponse.json({ error: "Not enough stock in this warehouse for a stock-out." }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to record movement" }, { status: 500 });
  }
}
