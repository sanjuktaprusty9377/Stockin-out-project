"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      setError("Invalid email or password.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left: ledger hero panel */}
      <div className="hidden lg:flex flex-col justify-between bg-brand text-white p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none" style={{
          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 39px, #fff 40px)"
        }} />
        <div className="relative">
          <span className="font-mono text-xs tracking-[0.2em] text-brand-light/80">MANIFEST NO. 0001</span>
          <h1 className="font-display text-7xl leading-[0.9] tracking-tight mt-4">
            STOCK<br />LEDGER
          </h1>
          <p className="mt-6 max-w-sm text-brand-light/90 font-body">
            Every unit received, every unit shipped — logged, timestamped, and reconciled across every warehouse.
          </p>
        </div>

        <div className="relative flex gap-4">
          <div className="stamp text-stockin-DEFAULT bg-white/95 border-stockin-DEFAULT">
            ▲ Stock In
          </div>
          <div className="stamp text-stockout-DEFAULT bg-white/95 border-stockout-DEFAULT">
            ▼ Stock Out
          </div>
        </div>

        <p className="relative font-mono text-xs text-brand-light/60">
          Next.js · MySQL · Prisma · Role-based access
        </p>
      </div>

      {/* Right: login form */}
      <div className="flex items-center justify-center p-8 bg-paper">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8">
            <h1 className="font-display text-4xl text-brand">STOCK LEDGER</h1>
          </div>

          <h2 className="font-display text-3xl text-ink mb-1">Sign in</h2>
          <p className="text-muted text-sm mb-8">Access your warehouse dashboard.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-1.5">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-line bg-surface px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand"
                placeholder="you@company.com"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-line bg-surface px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-sm text-stockout-DEFAULT bg-stockout-bg border border-stockout-DEFAULT/30 rounded-md px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand hover:bg-brand-dark text-white font-medium rounded-md py-2.5 text-sm transition-colors disabled:opacity-60"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-line text-xs text-muted font-mono space-y-1">
            <p>Seeded demo accounts:</p>
            <p>admin@example.com / Admin@123</p>
            <p>staff@example.com / Staff@123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
