"use client";

import { signOut } from "next-auth/react";

export default function Topbar({ name, role }: { name: string; role: string }) {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-line bg-surface">
      <div>
        <p className="text-xs text-muted font-mono">{new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium leading-tight">{name}</p>
          <p className="text-xs text-muted leading-tight">{role}</p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-xs font-medium px-3 py-1.5 rounded-md border border-line hover:bg-paper transition-colors"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
