"use client";

import { useEffect, useState } from "react";
import StatCard from "@/components/StatCard";
import MovementChart from "@/components/MovementChart";
import { formatCurrency } from "@/lib/utils";

type Summary = {
  totalProducts: number; totalWarehouses: number; totalUnits: number;
  totalValue: number; lowStockCount: number; series: { date: string; in: number; out: number }[];
};
type LowStockItem = { id: string; name: string; sku: string; totalStock: number; reorderLevel: number; unit: string; category: { name: string } | null };

export default function ReportsPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [lowStock, setLowStock] = useState<LowStockItem[]>([]);
  const [days, setDays] = useState(14);

  useEffect(() => {
    fetch(`/api/reports/summary?days=${days}`).then((r) => r.json()).then(setSummary);
  }, [days]);

  useEffect(() => {
    fetch("/api/reports/low-stock").then((r) => r.json()).then(setLowStock);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl text-ink">Reports</h1>
        <p className="text-muted text-sm mt-1">Inventory value, movement trends, and reorder alerts.</p>
      </div>

      {summary && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Products" value={summary.totalProducts} />
            <StatCard label="Warehouses" value={summary.totalWarehouses} />
            <StatCard label="Units on hand" value={summary.totalUnits.toLocaleString("en-IN")} accent="stockin" />
            <StatCard label="Inventory value" value={formatCurrency(summary.totalValue)} accent="rust" />
          </div>

          <div className="bg-surface border border-line rounded-lg p-5 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-2xl text-ink">Movement trend</h2>
              <select value={days} onChange={(e) => setDays(Number(e.target.value))} className="rounded-md border border-line px-3 py-1.5 text-sm">
                <option value={7}>Last 7 days</option>
                <option value={14}>Last 14 days</option>
                <option value={30}>Last 30 days</option>
              </select>
            </div>
            <MovementChart data={summary.series} />
          </div>
        </>
      )}

      <div className="bg-surface border border-line rounded-lg shadow-card">
        <div className="px-5 py-4 border-b border-line flex items-center justify-between">
          <h2 className="font-display text-2xl text-ink">Low stock — reorder needed</h2>
          <span className="stamp text-stockout-DEFAULT bg-stockout-bg">{lowStock.length} items</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted border-b border-line">
                <th className="px-5 py-3">Product</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">On hand</th>
                <th className="px-5 py-3">Reorder level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {lowStock.length === 0 && (
                <tr><td colSpan={4} className="px-5 py-6 text-center text-muted">Nothing to reorder — all stock levels healthy.</td></tr>
              )}
              {lowStock.map((p) => (
                <tr key={p.id}>
                  <td className="px-5 py-3 font-medium">{p.name} <span className="text-xs text-muted font-mono">({p.sku})</span></td>
                  <td className="px-5 py-3 text-muted">{p.category?.name || "—"}</td>
                  <td className="px-5 py-3 text-stockout-DEFAULT font-semibold">{p.totalStock} {p.unit}</td>
                  <td className="px-5 py-3 text-muted">{p.reorderLevel} {p.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
