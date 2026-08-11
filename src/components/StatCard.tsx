export default function StatCard({
  label,
  value,
  sub,
  accent = "brand",
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: "brand" | "rust" | "stockin" | "stockout";
}) {
  const accentClass = {
    brand: "text-brand",
    rust: "text-rust",
    stockin: "text-stockin-DEFAULT",
    stockout: "text-stockout-DEFAULT",
  }[accent];

  return (
    <div className="bg-surface border border-line rounded-lg p-5 shadow-card">
      <p className="text-xs uppercase tracking-wide text-muted font-medium">{label}</p>
      <p className={`font-display text-4xl mt-2 ${accentClass}`}>{value}</p>
      {sub && <p className="text-xs text-muted mt-1">{sub}</p>}
    </div>
  );
}
