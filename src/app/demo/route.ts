import { signIn } from "@/lib/auth";

// Landing page "See it in action": create a pre-filled demo account and drop
// the visitor straight into the app.
export async function GET() {
  await signIn("demo", { redirectTo: "/dashboard" });
}
