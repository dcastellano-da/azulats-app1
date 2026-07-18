import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const token = request.cookies.get("azul_ats_token")?.value;
  const { pathname } = request.nextUrl;

  // Rule 1: Redirect to /login if unauthenticated and trying to access secure routes
  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/busquedas") ||
    pathname.startsWith("/reclutamiento") ||
    pathname.startsWith("/configuracion") ||
    pathname.startsWith("/talento")
  ) {
    if (!token) {
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Rule 2: Redirect authenticated users away from login page
  if (pathname === "/login") {
    if (token) {
      const dashboardUrl = new URL("/dashboard", request.url);
      return NextResponse.redirect(dashboardUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/busquedas/:path*", "/reclutamiento/:path*", "/configuracion/:path*", "/talento/:path*", "/login"],
};
