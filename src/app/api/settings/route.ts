import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { settingSchema } from "@/lib/validation";
import { getOrCreateSetting } from "@/lib/business";

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = settingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  await getOrCreateSetting(session.user.id);
  const setting = await prisma.setting.update({
    where: { userId: session.user.id },
    data: parsed.data,
  });
  return NextResponse.json(setting);
}
