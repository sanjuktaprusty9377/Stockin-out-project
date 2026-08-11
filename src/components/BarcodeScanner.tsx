"use client";

import { useEffect, useRef, useState } from "react";

export default function BarcodeScanner({ onScan }: { onScan: (code: string) => void }) {
  const containerId = "barcode-scanner-region";
  const scannerRef = useRef<any>(null);
  const [error, setError] = useState("");
  const [active, setActive] = useState(false);

  useEffect(() => {
    return () => {
      // Clean up camera stream on unmount
      if (scannerRef.current) {
        scannerRef.current.stop?.().catch(() => {});
      }
    };
  }, []);

  async function start() {
    setError("");
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode(containerId);
      scannerRef.current = scanner;
      setActive(true);
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 150 } },
        (decodedText: string) => {
          onScan(decodedText);
          scanner.stop().then(() => setActive(false)).catch(() => {});
        },
        () => {
          /* ignore per-frame scan errors */
        }
      );
    } catch (e) {
      setError("Could not access camera. Check permissions, or enter the code manually below.");
      setActive(false);
    }
  }

  async function stop() {
    if (scannerRef.current) {
      await scannerRef.current.stop().catch(() => {});
    }
    setActive(false);
  }

  return (
    <div>
      <div id={containerId} className="rounded-lg overflow-hidden border border-line bg-black/90 aspect-video max-w-md" />
      {error && <p className="text-sm text-stockout-DEFAULT mt-3">{error}</p>}
      <div className="mt-3">
        {!active ? (
          <button onClick={start} className="bg-brand hover:bg-brand-dark text-white text-sm font-medium px-4 py-2 rounded-md">
            Start camera scan
          </button>
        ) : (
          <button onClick={stop} className="border border-line text-sm font-medium px-4 py-2 rounded-md">
            Stop scanning
          </button>
        )}
      </div>
    </div>
  );
}
