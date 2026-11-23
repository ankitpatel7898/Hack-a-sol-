import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Public static assets and health check
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Check for session refresh token in cookie
  const refreshToken = request.cookies.get("refresh_token")?.value;

  // Protected sub-paths if navigated to directly
  const isProtectedPath =
    pathname.startsWith("/patient") ||
    pathname.startsWith("/hospital") ||
    pathname.startsWith("/insurer");

  if (isProtectedPath && !refreshToken) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.set("auth_required", "true");
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
