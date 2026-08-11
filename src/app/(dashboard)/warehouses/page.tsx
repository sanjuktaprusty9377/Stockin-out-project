"use client";

import { useEffect, useState, useCallback } from "react";

type Warehouse = { id: string; name: string; location: string | null; totalUnits: number };

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [form, setForm] = useState({ name: "", location: "" });
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const [wRes, meRes] = await Promise.all([fetch("/api/warehouses"), fetch("/api/session-role")]);
    setWarehouses(await wRes.json());
    if (meRes.ok) setIsAdmin((await meRes.json()).role === "ADMIN");
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/warehouses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error?.formErrors?.[0] || data.error || "Failed to create warehouse");
      return;
    }
    setForm({ name: "", location: "" });
    setShowForm(false);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this warehouse and all its stock records?")) return;
    await fetch(`/api/warehouses/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-4xl text-ink">Warehouses</h1>
          <p className="text-muted text-sm mt-1">Every location holding stock, and how much sits in each.</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowForm((v) => !v)} className="bg-brand hover:bg-brand-dark text-white text-sm font-medium px-4 py-2 rounded-md">
            {showForm ? "Cancel" : "+ Add warehouse"}
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-surface border border-line rounded-lg p-5 shadow-card grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-1.5">Name</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-md border border-line px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-1.5">Location</label>
            <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="w-full rounded-md border border-line px-3 py-2 text-sm" />
          </div>
          <div className="sm:col-span-2 flex items-center gap-3">
            <button type="submit" className="bg-brand hover:bg-brand-dark text-white text-sm font-medium px-4 py-2 rounded-md">Save warehouse</button>
            {error && <p className="text-sm text-stockout-DEFAULT">{error}</p>}
          </div>
        </form>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {warehouses.map((w) => (
          <div key={w.id} className="bg-surface border border-line rounded-lg p-5 shadow-card">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-display text-xl text-ink">{w.name}</h3>
                <p className="text-xs text-muted mt-1">{w.location || "No location set"}</p>
              </div>
              {isAdmin && (
                <button onClick={() => handleDelete(w.id)} className="text-xs text-stockout-DEFAULT hover:underline">Delete</button>
              )}
            </div>
            <p className="font-display text-3xl text-brand mt-4">{w.totalUnits.toLocaleString("en-IN")}</p>
            <p className="text-xs text-muted font-mono">units on hand</p>
          </div>
        ))}
        {warehouses.length === 0 && <p className="text-muted text-sm">No warehouses yet.</p>}
      </div>
    </div>
  );
}
