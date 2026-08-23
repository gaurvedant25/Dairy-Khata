import type { TrustLevel } from "@/lib/business";

const STYLES: Record<TrustLevel["label"], string> = {
  Excellent: "bg-emerald-100 text-emerald-800",
  Good: "bg-green-100 text-green-800",
  Fair: "bg-amber-100 text-amber-800",
  Poor: "bg-orange-100 text-orange-800",
  "Very Poor": "bg-red-100 text-red-800",
};

export function TrustBadge({ trust }: { trust: TrustLevel }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${STYLES[trust.label]}`}>
      {"★".repeat(trust.score)}
      {"☆".repeat(5 - trust.score)} {trust.label}
    </span>
  );
}
