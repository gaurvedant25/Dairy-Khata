// The business runs in India, but the server (Vercel) runs in UTC — so a naive
// `new Date()` rolls "today" and "this month" over at 05:30 IST instead of
// midnight. These helpers pin the calendar to IST regardless of the host clock,
// so early-morning milk rounds are always dated correctly.
const IST = "Asia/Kolkata";

const istFmt = new Intl.DateTimeFormat("en-CA", {
  timeZone: IST,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Today's date in IST as "YYYY-MM-DD". */
export function istToday(now: Date = new Date()): string {
  return istFmt.format(now); // en-CA formats as YYYY-MM-DD
}

/** IST calendar parts for an instant: month is 0-based (to feed `new Date(y, m, d)`). */
export function istParts(now: Date = new Date()): { y: number; m: number; d: number } {
  const [y, m, d] = istFmt.format(now).split("-").map(Number);
  return { y, m: m - 1, d };
}
