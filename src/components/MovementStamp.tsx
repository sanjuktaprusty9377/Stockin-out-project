export default function MovementStamp({ type }: { type: "IN" | "OUT" }) {
  if (type === "IN") {
    return <span className="stamp text-stockin-DEFAULT bg-stockin-bg">▲ In</span>;
  }
  return <span className="stamp text-stockout-DEFAULT bg-stockout-bg">▼ Out</span>;
}
