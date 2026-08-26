// Creates the ₹249/month Razorpay Plan used for autopay subscriptions.
// Run ONCE (per mode) after Razorpay Subscriptions is enabled on the account:
//
//   RAZORPAY_KEY_ID=rzp_live_xxx RAZORPAY_KEY_SECRET=xxx node scripts/create-razorpay-plan.mjs
//
// It prints a plan id (plan_XXXX). Set that as the RAZORPAY_PLAN_ID env var.

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

if (!keyId || !keySecret) {
  console.error("Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in the environment first.");
  process.exit(1);
}

const res = await fetch("https://api.razorpay.com/v1/plans", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: "Basic " + Buffer.from(`${keyId}:${keySecret}`).toString("base64"),
  },
  body: JSON.stringify({
    period: "monthly",
    interval: 1,
    item: {
      name: "Dairy Ledger Premium",
      amount: 24900, // ₹249 in paise
      currency: "INR",
      description: "Dairy Ledger monthly subscription",
    },
  }),
});

const data = await res.json();
if (!res.ok) {
  console.error("Failed to create plan:", JSON.stringify(data, null, 2));
  process.exit(1);
}

console.log("\n✅ Plan created.");
console.log("RAZORPAY_PLAN_ID=" + data.id);
console.log("\nMode:", keyId.startsWith("rzp_live") ? "LIVE" : "TEST");
