"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const BarcodeScanner = dynamic(() => import("@/components/BarcodeScanner"), { ssr: false });

export default function ScanPage() {
  const router = useRouter();
  const [manualCode, setManualCode] = useState("");
  const [error, setError] = useState("");
  const [lookingUp, setLookingUp] = useState(false);

  async function lookup(code: string) {
    setError("");
    setLookingUp(true);
    const res = await fetch(`/api/products?q=${encodeURIComponent(code)}`);
    const products = await res.json();
    setLookingUp(false);

    const match = products.find((p: any) => p.barcode === code) || products[0];
    if (!match) {
      setError(`No product found for code "${code}". You can add it under Products first.`);
      return;
    }
    router.push(`/stock?productId=${match.id}`);
  }

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <h1 className="font-display text-4xl text-ink">Scan Barcode</h1>
        <p className="text-muted text-sm mt-1">Scan a product barcode to jump straight to logging a stock in/out.</p>
      </div>

      <div className="bg-surface border border-line rounded-lg p-5 shadow-card">
        <BarcodeScanner onScan={lookup} />
      </div>

      <div className="bg-surface border border-line rounded-lg p-5 shadow-card">
        <label className="block text-xs font-medium text-muted uppercase tracking-wide mb-1.5">
          Or enter code manually
        </label>
        <div className="flex gap-2">
          <input
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="e.g. 8901234500017"
            className="flex-1 rounded-md border border-line px-3 py-2 text-sm font-mono"
          />
          <button
            onClick={() => manualCode && lookup(manualCode)}
            disabled={lookingUp}
            className="bg-brand hover:bg-brand-dark text-white text-sm font-medium px-4 py-2 rounded-md disabled:opacity-60"
          >
            {lookingUp ? "Looking up…" : "Find"}
          </button>
        </div>
        {error && <p className="text-sm text-stockout-DEFAULT mt-3">{error}</p>}
      </div>
    </div>
  );
}
