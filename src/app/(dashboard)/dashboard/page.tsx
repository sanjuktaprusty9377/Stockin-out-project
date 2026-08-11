import { prisma } from "@/lib/prisma";
import StatCard from "@/components/StatCard";
import MovementStamp from "@/components/MovementStamp";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import MovementChart from "@/components/MovementChart";
import { subDays, startOfDay, format } from "date-fns";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [totalProducts, totalWarehouses, stockLevels, recentMovements] = await Promise.all([
    prisma.product.count(),
    prisma.warehouse.count(),
    prisma.stockLevel.findMany({ include: { product: true } }),
    prisma.stockMovement.findMany({
      include: { product: true, warehouse: true, user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  const totalUnits = stockLevels.reduce((s, l) => s + l.quantity, 0);
  const totalValue = stockLevels.reduce((s, l) => s + l.quantity * Number(l.product.price), 0);

  const productTotalsMap = new Map<string, { total: number; reorder: number }>();
  for (const s of stockLevels) {
    const entry = productTotalsMap.get(s.productId) || { total: 0, reorder: s.product.reorderLevel };
    entry.total += s.quantity;
    productTotalsMap.set(s.productId, entry);
  }
  const lowStockCount = Array.from(productTotalsMap.values()).filter((v) => v.total <= v.reorder).length;

  const days = 14;
  const since = startOfDay(subDays(new Date(), days - 1));
  const movements = await prisma.stockMovement.findMany({
    where: { createdAt: { gte: since } },
    select: { type: true, quantity: true, createdAt: true },
  });
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl text-ink">Dashboard</h1>
        <p className="text-muted text-sm mt-1">Live snapshot of stock across all warehouses.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Products" value={totalProducts} accent="brand" />
        <StatCard label="Warehouses" value={totalWarehouses} accent="brand" />
        <StatCard label="Units in stock" value={totalUnits.toLocaleString("en-IN")} accent="stockin" />
        <StatCard
          label="Low stock alerts"
          value={lowStockCount}
          accent="stockout"
          sub={lowStockCount > 0 ? "Needs reordering" : "All healthy"}
        />
      </div>

      <StatCard label="Inventory value" value={formatCurrency(totalValue)} accent="rust" sub="Based on current on-hand quantity × unit price" />

      <div className="bg-surface border border-line rounded-lg p-5 shadow-card">
        <h2 className="font-display text-2xl text-ink mb-4">Stock movement — last 14 days</h2>
        <MovementChart data={Array.from(dayMap.values())} />
      </div>

      <div className="bg-surface border border-line rounded-lg shadow-card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-line">
          <h2 className="font-display text-2xl text-ink">Recent activity</h2>
          <Link href="/stock" className="text-xs font-medium text-brand hover:underline">
            View all →
          </Link>
        </div>
        <div className="divide-y divide-line">
          {recentMovements.length === 0 && (
            <p className="px-5 py-6 text-sm text-muted">No stock movements recorded yet.</p>
          )}
          {recentMovements.map((m) => (
            <div key={m.id} className="flex items-center justify-between px-5 py-3">
              <div className="flex items-center gap-3">
                <MovementStamp type={m.type} />
                <div>
                  <p className="text-sm font-medium">{m.product.name}</p>
                  <p className="text-xs text-muted font-mono">
                    {m.quantity} {m.product.unit} · {m.warehouse.name} · {m.user.name}
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted">{formatDateTime(m.createdAt)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
