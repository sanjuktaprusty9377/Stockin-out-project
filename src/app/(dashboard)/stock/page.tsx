"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import MovementStamp from "@/components/MovementStamp";
import { formatDateTime } from "@/lib/utils";

type Product = { id: string; sku: string; name: string; unit: string; barcode: string | null };
type Warehouse = { id: string; name: string };
type Movement = {
  id: string; type: "IN" | "OUT"; quantity: number; reference: string | null; createdAt: string;
  product: Product; warehouse: Warehouse; user: { name: string };
};

function StockPageInner() {
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [type, setType] = useState<"IN" | "OUT">("IN");
  const [productId, setProductId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadRefData = useCallback(async () => {
    const [pRes, wRes, mRes] = await Promise.all([
      fetch("/api/products"),
      fetch("/api/warehouses"),
      fetch("/api/stock-movements?limit=25"),
    ]);
    setProducts(await pRes.json());
    setWarehouses(await wRes.json());
    setMovements(await mRes.json());
  }, []);

  useEffect(() => { loadRefData(); }, [loadRefData]);

  // Pre-fill product from barcode scan redirect (?productId=)
  useEffect(() => {
    const pid = searchParams.get("productId");
    if (pid) setProductId(pid);
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setSuccess("");
    setSubmitting(true);
    const res = await fetch("/api/stock-movements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type, productId, warehouseId,
        quantity: parseInt(quantity || "0", 10),
        reference: reference || null,
        note: note || null,
      }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error?.formErrors?.[0] || data.error || "Failed to record movement");
      return;
    }
    setSuccess(`Recorded ${type === "IN" ? "stock in" : "stock out"} successfully.`);
    setQuantity(""); setReference(""); setNote("");
    loadRefData();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl text-ink">Stock In / Out</h1>
        <p className="text-muted text-sm mt-1">Log every unit received or shipped, per warehouse.</p>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <form onSubmit={handleSubmit} className="lg:col-span-2 bg-surface border border-line rounded-lg p-5 shadow-card space-y-4 h-fit">
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setType("IN")}
              className={`py-2.5 rounded-md text-sm font-semibold border ${type === "IN" ? "bg-stockin-bg border-stockin-DEFAULT text-stockin-DEFAULT" : "border-line text-muted"}`}>
              ▲ Stock In
            </button>
            <button type="button" onClick={() => setType("OUT")}
              className={`py-2.5 rounded-md text-sm font-semibold border ${type === "OUT" ? "bg-stockout-bg border-stockout-DEFAULT text-stockout-DEFAULT" : "border-line text-muted"}`}>
              ▼ Stock Out
            </button>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-1.5">Product</label>
            <select required value={productId} onChange={(e) => setProductId(e.target.value)} className="w-full rounded-md border border-line px-3 py-2 text-sm">
              <option value="">Select product…</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-1.5">Warehouse</label>
            <select required value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} className="w-full rounded-md border border-line px-3 py-2 text-sm">
              <option value="">Select warehouse…</option>
              {warehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-1.5">Quantity</label>
            <input required type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-full rounded-md border border-line px-3 py-2 text-sm" />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-1.5">Reference (PO / invoice)</label>
            <input value={reference} onChange={(e) => setReference(e.target.value)} className="w-full rounded-md border border-line px-3 py-2 text-sm" />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-1.5">Note</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="w-full rounded-md border border-line px-3 py-2 text-sm" />
          </div>

          {error && <p className="text-sm text-stockout-DEFAULT bg-stockout-bg rounded-md px-3 py-2">{error}</p>}
          {success && <p className="text-sm text-stockin-DEFAULT bg-stockin-bg rounded-md px-3 py-2">{success}</p>}

          <button type="submit" disabled={submitting}
            className={`w-full py-2.5 rounded-md text-sm font-semibold text-white disabled:opacity-60 ${type === "IN" ? "bg-stockin-DEFAULT hover:opacity-90" : "bg-stockout-DEFAULT hover:opacity-90"}`}>
            {submitting ? "Recording…" : `Record ${type === "IN" ? "Stock In" : "Stock Out"}`}
          </button>
        </form>

        <div className="lg:col-span-3 bg-surface border border-line rounded-lg shadow-card">
          <div className="px-5 py-4 border-b border-line">
            <h2 className="font-display text-2xl text-ink">Recent movements</h2>
          </div>
          <div className="divide-y divide-line max-h-[600px] overflow-y-auto scrollbar-thin">
            {movements.length === 0 && <p className="px-5 py-6 text-sm text-muted">No movements recorded yet.</p>}
            {movements.map((m) => (
              <div key={m.id} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <MovementStamp type={m.type} />
                  <div>
                    <p className="text-sm font-medium">{m.product.name}</p>
                    <p className="text-xs text-muted font-mono">
                      {m.quantity} {m.product.unit} · {m.warehouse.name}
                      {m.reference ? ` · Ref: ${m.reference}` : ""} · {m.user.name}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-muted whitespace-nowrap">{formatDateTime(m.createdAt)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StockPage() {
  return (
    <Suspense fallback={<p className="text-muted text-sm">Loading…</p>}>
      <StockPageInner />
    </Suspense>
  );
}
