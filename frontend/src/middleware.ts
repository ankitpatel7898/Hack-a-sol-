import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Bypass static Next.js assets, API routes, and static files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Check auth cookies
  const roleCookie = request.cookies.get("healthshield_role")?.value;
  const loggedInCookie = request.cookies.get("healthshield_logged_in")?.value;
  const isAuthenticated = Boolean(loggedInCookie && roleCookie);
  const userRole = roleCookie as "patient" | "hospital" | "insurer" | undefined;

  // 1. Root ("/") route: handled by page.tsx or redirect to /loading
  if (pathname === "/") {
    return NextResponse.next();
  }

  // 2. Loading splash page ("/loading"): always accessible
  if (pathname === "/loading") {
    return NextResponse.next();
  }

  // 3. Public Home page ("/home"): Unauthenticated users only.
  // Logged-in users visiting /home are automatically redirected to their respective dashboard.
  if (pathname === "/home") {
    if (isAuthenticated && userRole) {
      const url = request.nextUrl.clone();
      url.pathname = `/${userRole}/dashboard`;
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // 4. Auth routes ("/auth/*"):
  // If user is already authenticated, redirect them to their dedicated dashboard
  if (pathname.startsWith("/auth/")) {
    if (isAuthenticated && userRole) {
      const url = request.nextUrl.clone();
      url.pathname = `/${userRole}/dashboard`;
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // 5. Patient Protected Routes ("/patient/*")
  if (pathname.startsWith("/patient")) {
    if (!isAuthenticated) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/patient/login";
      return NextResponse.redirect(url);
    }
    if (userRole !== "patient") {
      const url = request.nextUrl.clone();
      url.pathname = `/${userRole}/dashboard`;
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // 6. Hospital Protected Routes ("/hospital/*")
  if (pathname.startsWith("/hospital")) {
    if (!isAuthenticated) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/hospital/login";
      return NextResponse.redirect(url);
    }
    if (userRole !== "hospital") {
      const url = request.nextUrl.clone();
      url.pathname = `/${userRole}/dashboard`;
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // 7. Insurer Protected Routes ("/insurer/*")
  if (pathname.startsWith("/insurer")) {
    if (!isAuthenticated) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/insurer/login";
      return NextResponse.redirect(url);
    }
    if (userRole !== "insurer") {
      const url = request.nextUrl.clone();
      url.pathname = `/${userRole}/dashboard`;
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
