import type { NextRequest } from "next/server";
import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isDemoUsername } from "@/lib/demo";

// Leave the demo: delete the throwaway account, sign out, and go either back
// to the landing page or on to sign-up (?to=signup).
export async function GET(req: NextRequest) {
  const to = req.nextUrl.searchParams.get("to") === "signup" ? "/signup" : "/";

  const session = await auth();
  if (session?.user?.id) {
    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { username: true } });
    // Only ever delete demo accounts, never a real owner's.
    if (user && isDemoUsername(user.username)) {
      await prisma.user.delete({ where: { id: session.user.id } });
    }
  }

  await signOut({ redirectTo: to });
}
