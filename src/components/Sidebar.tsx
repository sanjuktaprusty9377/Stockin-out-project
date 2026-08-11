"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: "◧", roles: ["ADMIN", "STAFF"] },
  { href: "/stock", label: "Stock In / Out", icon: "⇅", roles: ["ADMIN", "STAFF"] },
  { href: "/stock/scan", label: "Scan Barcode", icon: "▤", roles: ["ADMIN", "STAFF"] },
  { href: "/products", label: "Products", icon: "▣", roles: ["ADMIN", "STAFF"] },
  { href: "/categories", label: "Categories", icon: "▥", roles: ["ADMIN", "STAFF"] },
  { href: "/warehouses", label: "Warehouses", icon: "⌂", roles: ["ADMIN", "STAFF"] },
  { href: "/reports", label: "Reports", icon: "▦", roles: ["ADMIN", "STAFF"] },
  { href: "/users", label: "Users", icon: "◉", roles: ["ADMIN"] },
];

export default function Sidebar({ role }: { role: "ADMIN" | "STAFF" }) {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:flex-col w-60 shrink-0 bg-brand text-white min-h-screen">
      <div className="px-6 py-6 border-b border-white/10">
        <span className="font-mono text-[10px] tracking-[0.2em] text-brand-light/70">MANIFEST NO. 0001</span>
        <h1 className="font-display text-2xl tracking-tight -mt-0.5">STOCK LEDGER</h1>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {links
          .filter((l) => l.roles.includes(role))
          .map((link) => {
            const active = pathname === link.href || (link.href !== "/dashboard" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                  active
                    ? "bg-white/15 text-white font-medium"
                    : "text-brand-light/80 hover:bg-white/10 hover:text-white"
                )}
              >
                <span className="w-4 text-center opacity-80">{link.icon}</span>
                {link.label}
              </Link>
            );
          })}
      </nav>

      <div className="px-6 py-4 border-t border-white/10 font-mono text-[10px] text-brand-light/50">
        Role: {role}
      </div>
    </aside>
  );
}
