import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  // Check for the token cookie.
  // In a real application we would verify the JWT signature here if possible,
  // but since it's an httpOnly cookie, just checking for its existence is a good first layer.
  // The backend will reject invalid tokens anyway.
  const hasToken = request.cookies.has("token");
  const path = request.nextUrl.pathname;

  const isProtectedRoute =
    path.startsWith("/dashboard") || path.startsWith("/problems");
  const isAuthRoute = path === "/signin" || path === "/signup";

  if (isProtectedRoute && !hasToken) {
    // Redirect to signin if trying to access protected route without token
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  if (isAuthRoute && hasToken) {
    // Redirect to dashboard if trying to access auth routes while logged in
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/problems/:path*", "/signin", "/signup"],
};
