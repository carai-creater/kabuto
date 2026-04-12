import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ step: "getUser", ok: false, error: error?.message ?? "no user" });
    }

    const found = await prisma.user.findUnique({
      where: { authUserId: user.id },
      select: { id: true, email: true },
    });

    return NextResponse.json({
      step: "prisma",
      ok: !!found,
      authEmail: user.email,
      authId: user.id,
      prismaUser: found ?? null,
    });
  } catch (e) {
    return NextResponse.json({ step: "error", ok: false, error: String(e) }, { status: 500 });
  }
}
