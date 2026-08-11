"use client";

import { useEffect, useState, useCallback } from "react";
import { formatCurrency } from "@/lib/utils";

type Category = { id: string; name: string };
type Product = {
  id: string;
  sku: string;
  barcode: string | null;
  name: string;
  unit: string;
  price: string;
  reorderLevel: number;
  category: Category | null;
  totalStock: number;
  lowStock: boolean;
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [form, setForm] = useState({ sku: "", barcode: "", name: "", unit: "pcs", price: "", reorderLevel: "10", categoryId: "" });
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const [pRes, cRes, meRes] = await Promise.all([
      fetch(`/api/products?q=${encodeURIComponent(q)}`),
      fetch("/api/categories"),
      fetch("/api/session-role"),
    ]);
    setProducts(await pRes.json());
    setCategories(await cRes.json());
    if (meRes.ok) {
      const me = await meRes.json();
      setIsAdmin(me.role === "ADMIN");
    }
    setLoading(false);
  }, [q]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        price: parseFloat(form.price || "0"),
        reorderLevel: parseInt(form.reorderLevel || "0", 10),
        categoryId: form.categoryId || null,
        barcode: form.barcode || null,
      }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error?.formErrors?.[0] || data.error || "Failed to create product");
      return;
    }
    setForm({ sku: "", barcode: "", name: "", unit: "pcs", price: "", reorderLevel: "10", categoryId: "" });
    setShowForm(false);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this product? This cannot be undone.")) return;
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-4xl text-ink">Products</h1>
          <p className="text-muted text-sm mt-1">Catalog of items tracked across your warehouses.</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowForm((v) => !v)}
            className="bg-brand hover:bg-brand-dark text-white text-sm font-medium px-4 py-2 rounded-md"
          >
            {showForm ? "Cancel" : "+ Add product"}
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-surface border border-line rounded-lg p-5 shadow-card grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Input label="SKU" required value={form.sku} onChange={(v) => setForm({ ...form, sku: v })} />
          <Input label="Barcode" value={form.barcode} onChange={(v) => setForm({ ...form, barcode: v })} />
          <Input label="Name" required value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          <Input label="Unit" value={form.unit} onChange={(v) => setForm({ ...form, unit: v })} />
          <Input label="Price (₹)" type="number" value={form.price} onChange={(v) => setForm({ ...form, price: v })} />
          <Input label="Reorder level" type="number" value={form.reorderLevel} onChange={(v) => setForm({ ...form, reorderLevel: v })} />
          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-1.5">Category</label>
            <select
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm"
            >
              <option value="">None</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="lg:col-span-3 flex items-center gap-3">
            <button type="submit" className="bg-brand hover:bg-brand-dark text-white text-sm font-medium px-4 py-2 rounded-md">
              Save product
            </button>
            {error && <p className="text-sm text-stockout-DEFAULT">{error}</p>}
          </div>
        </form>
      )}

      <div className="bg-surface border border-line rounded-lg shadow-card">
        <div className="p-4 border-b border-line">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, SKU, or barcode…"
            className="w-full max-w-sm rounded-md border border-line px-3 py-2 text-sm"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted border-b border-line">
                <th className="px-5 py-3">Product</th>
                <th className="px-5 py-3">SKU / Barcode</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Price</th>
                <th className="px-5 py-3">Stock</th>
                {isAdmin && <th className="px-5 py-3"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {!loading && products.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-muted">No products found.</td></tr>
              )}
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-paper/50">
                  <td className="px-5 py-3 font-medium">{p.name}</td>
                  <td className="px-5 py-3 font-mono text-xs text-muted">{p.sku}{p.barcode ? ` · ${p.barcode}` : ""}</td>
                  <td className="px-5 py-3">{p.category?.name || "—"}</td>
                  <td className="px-5 py-3">{formatCurrency(p.price)}</td>
                  <td className="px-5 py-3">
                    <span className={p.lowStock ? "text-stockout-DEFAULT font-semibold" : ""}>
                      {p.totalStock} {p.unit}
                    </span>
                    {p.lowStock && <span className="ml-2 stamp text-stockout-DEFAULT bg-stockout-bg text-[10px]">Low</span>}
                  </td>
                  {isAdmin && (
                    <td className="px-5 py-3 text-right">
                      <button onClick={() => handleDelete(p.id)} className="text-xs text-stockout-DEFAULT hover:underline">
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Input({
  label, value, onChange, type = "text", required = false,
}: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean }) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-1.5">{label}</label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm"
      />
    </div>
  );
}
