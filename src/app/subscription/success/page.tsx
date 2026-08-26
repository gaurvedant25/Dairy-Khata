import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ThankYou } from "@/components/ThankYou";

export const metadata = { title: "Thank you · Dairy Ledger" };

export default async function SubscriptionSuccessPage() {
  const session = await auth();
  if (!session) redirect("/login");
  return <ThankYou />;
}
