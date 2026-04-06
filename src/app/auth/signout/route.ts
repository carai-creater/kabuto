import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { SESSION_COOKIE } from "@/lib/session";
import { createClientOrNull } from "@/utils/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClientOrNull();
  if (supabase) {
    await supabase.auth.signOut();
  }

  const jar = await cookies();
  jar.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  const { origin } = new URL(request.url);
  return NextResponse.redirect(origin + "/", { status: 303 });
}
