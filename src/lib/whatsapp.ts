type BillItem = { product: string; unit: string; quantity: number; amount: number };

export type BillDay = {
  dateLabel: string; // e.g. "1 Aug"
  items: BillItem[];
  dayTotal: number;
};

type BillInput = {
  customerName: string;
  businessName: string;
  monthLabel: string; // e.g. "August 2026"
  days: BillDay[];
  monthTotal: number;
  totalPaid: number;
  dues: number;
};

/** Compact per-item label without the price, e.g. "Milk 2 L". */
function itemShort(it: BillItem): string {
  if (!it.unit) return it.product; // no-unit item (priced per order)
  const qty = it.quantity.toFixed(it.unit === "piece" ? 0 : 1);
  return `${it.product} ${qty} ${it.unit}`;
}

/**
 * Turn an Indian-style phone number into the digits wa.me expects.
 * Strips spaces/punctuation and adds the 91 country code for bare 10-digit
 * numbers. Returns null if there aren't enough digits to be usable.
 */
export function toWhatsAppNumber(phone: string | null | undefined): string | null {
  if (!phone) return null;
  let digits = phone.replace(/\D/g, "");
  if (digits.length === 10) digits = "91" + digits;
  else if (digits.length === 11 && digits.startsWith("0")) digits = "91" + digits.slice(1);
  if (digits.length < 11) return null;
  return digits;
}

/**
 * Build a WhatsApp bill that lists what the customer bought on each day of the
 * month, then the month total and the amount still due. Asterisks render as
 * bold in WhatsApp.
 */
export function buildBillMessage(b: BillInput): string {
  const lines: string[] = [];
  lines.push(`Namaste ${b.customerName} 🙏`);
  lines.push("");
  lines.push(`*${b.businessName}*`);
  lines.push(`Bill for ${b.monthLabel}`);
  lines.push("");

  if (b.days.length === 0) {
    lines.push("No purchases this month.");
  } else {
    for (const day of b.days) {
      const summary = day.items.map(itemShort).join(", ");
      lines.push(`${day.dateLabel} — ${summary} — ₹${day.dayTotal.toFixed(2)}`);
    }
  }

  lines.push("————————");
  lines.push(`This month: ₹${b.monthTotal.toFixed(2)}`);
  if (b.totalPaid > 0) lines.push(`Paid: ₹${b.totalPaid.toFixed(2)}`);
  lines.push(`*Total due: ₹${b.dues.toFixed(2)}*`);
  lines.push("");
  lines.push("Please clear your dues. Dhanyavaad 🙏");

  return lines.join("\n");
}

export function buildWhatsAppLink(phoneDigits: string, message: string): string {
  return `https://wa.me/${phoneDigits}?text=${encodeURIComponent(message)}`;
}
