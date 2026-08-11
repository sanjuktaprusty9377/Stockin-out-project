"use client";

import { useEffect, useState, useCallback } from "react";

type Category = { id: string; name: string; description: string | null; _count: { products: number } };

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const [cRes, meRes] = await Promise.all([fetch("/api/categories"), fetch("/api/session-role")]);
    setCategories(await cRes.json());
    if (meRes.ok) setIsAdmin((await meRes.json()).role === "ADMIN");
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error?.formErrors?.[0] || data.error || "Failed to create category");
      return;
    }
    setForm({ name: "", description: "" });
    setShowForm(false);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this category? Products keep their data but lose the category link.")) return;
    await fetch(`/api/categories/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-4xl text-ink">Categories</h1>
          <p className="text-muted text-sm mt-1">Group products for easier browsing and reporting.</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowForm((v) => !v)} className="bg-brand hover:bg-brand-dark text-white text-sm font-medium px-4 py-2 rounded-md">
            {showForm ? "Cancel" : "+ Add category"}
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
            <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-1.5">Description</label>
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-md border border-line px-3 py-2 text-sm" />
          </div>
          <div className="sm:col-span-2 flex items-center gap-3">
            <button type="submit" className="bg-brand hover:bg-brand-dark text-white text-sm font-medium px-4 py-2 rounded-md">Save category</button>
            {error && <p className="text-sm text-stockout-DEFAULT">{error}</p>}
          </div>
        </form>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((c) => (
          <div key={c.id} className="bg-surface border border-line rounded-lg p-5 shadow-card">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-display text-xl text-ink">{c.name}</h3>
                <p className="text-xs text-muted mt-1">{c.description || "No description"}</p>
              </div>
              {isAdmin && (
                <button onClick={() => handleDelete(c.id)} className="text-xs text-stockout-DEFAULT hover:underline">Delete</button>
              )}
            </div>
            <p className="text-xs font-mono text-muted mt-4">{c._count.products} products</p>
          </div>
        ))}
        {categories.length === 0 && <p className="text-muted text-sm">No categories yet.</p>}
      </div>
    </div>
  );
}
