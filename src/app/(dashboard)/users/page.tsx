"use client";

import { useEffect, useState, useCallback } from "react";

type UserRow = { id: string; name: string; email: string; role: "ADMIN" | "STAFF"; createdAt: string };

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "STAFF" as "ADMIN" | "STAFF" });
  const [error, setError] = useState("");
  const [currentUserId, setCurrentUserId] = useState("");

  const load = useCallback(async () => {
    const [uRes, meRes] = await Promise.all([fetch("/api/users"), fetch("/api/session-role")]);
    if (uRes.ok) setUsers(await uRes.json());
    if (meRes.ok) setCurrentUserId((await meRes.json()).id);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error?.formErrors?.[0] || data.error || "Failed to create user");
      return;
    }
    setForm({ name: "", email: "", password: "", role: "STAFF" });
    setShowForm(false);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this user's access?")) return;
    await fetch(`/api/users/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-4xl text-ink">Users</h1>
          <p className="text-muted text-sm mt-1">Manage who can access the ledger and at what level.</p>
        </div>
        <button onClick={() => setShowForm((v) => !v)} className="bg-brand hover:bg-brand-dark text-white text-sm font-medium px-4 py-2 rounded-md">
          {showForm ? "Cancel" : "+ Add user"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-surface border border-line rounded-lg p-5 shadow-card grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-1.5">Name</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-md border border-line px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-1.5">Email</label>
            <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-md border border-line px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-1.5">Password</label>
            <input required type="password" minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full rounded-md border border-line px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-1.5">Role</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as "ADMIN" | "STAFF" })} className="w-full rounded-md border border-line px-3 py-2 text-sm">
              <option value="STAFF">Staff</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <div className="sm:col-span-2 lg:col-span-4 flex items-center gap-3">
            <button type="submit" className="bg-brand hover:bg-brand-dark text-white text-sm font-medium px-4 py-2 rounded-md">Create user</button>
            {error && <p className="text-sm text-stockout-DEFAULT">{error}</p>}
          </div>
        </form>
      )}

      <div className="bg-surface border border-line rounded-lg shadow-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-muted border-b border-line">
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Email</th>
              <th className="px-5 py-3">Role</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {users.map((u) => (
              <tr key={u.id}>
                <td className="px-5 py-3 font-medium">{u.name}</td>
                <td className="px-5 py-3 text-muted">{u.email}</td>
                <td className="px-5 py-3">
                  <span className={`text-xs font-mono px-2 py-0.5 rounded ${u.role === "ADMIN" ? "bg-brand/10 text-brand" : "bg-line text-muted"}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  {u.id !== currentUserId && (
                    <button onClick={() => handleDelete(u.id)} className="text-xs text-stockout-DEFAULT hover:underline">Remove</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
