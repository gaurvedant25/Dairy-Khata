import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateSetting } from "@/lib/business";

const schema = z.object({
  starredProducts: z.array(z.string().trim().min(1).max(100)).max(50),
});

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  await getOrCreateSetting(session.user.id);
  const setting = await prisma.setting.update({
    where: { userId: session.user.id },
    data: { starredProducts: parsed.data.starredProducts },
  });
  return NextResponse.json({ starredProducts: setting.starredProducts });
}
