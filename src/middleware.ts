import { type NextRequest, NextResponse } from "next/server";

import { updateSession } from "@/utils/supabase/middleware";

function needsLogin(pathname: string): boolean {
  return (
    pathname === "/dashboard" ||
    pathname === "/wallet" ||
    pathname.startsWith("/dashboard/") ||
    pathname.startsWith("/wallet/")
  );
}

export async function middleware(request: NextRequest) {
  const { response, user, authConfigured } = await updateSession(request);

  if (!authConfigured) {
    return response;
  }

  const pathname = request.nextUrl.pathname;
  if (needsLogin(pathname) && !user) {
    const nextPath =
      pathname + (request.nextUrl.search ? request.nextUrl.search : "");
    const loginUrl = new URL("/login", request.nextUrl.origin);
    loginUrl.searchParams.set("next", nextPath);
    loginUrl.searchParams.set("login_error", "need_auth");
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
