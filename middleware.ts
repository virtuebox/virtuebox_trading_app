/**
 * middleware.ts
 * Next.js Middleware (Edge Runtime) for route protection.
 * Protects /dashboard and /partners — requires valid JWT cookie.
 * PARTNERs attempting /partners are redirected to /dashboard.
 *
 * IMPORTANT: Imports from jwt.EDGE.ts (jose), NOT jwt.util.ts (jsonwebtoken).
 * jsonwebtoken uses Node.js crypto APIs that do NOT exist in Edge Runtime.
 * jose uses Web Crypto APIs and works in both Edge and Node runtimes.
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyTokenEdge } from "@/utils/jwt.edge";

// Routes that require authentication
const PROTECTED_ROUTES = ["/dashboard", "/partners"];

// Routes that require ADMIN role
const ADMIN_ROUTES = ["/partners"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Check if this route requires protection
  const isProtected = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  if (!isProtected) return NextResponse.next();

  // Read and verify JWT from HTTP-only cookie
  const token = req.cookies.get("token")?.value;
  const payload = token ? await verifyTokenEdge(token) : null;

  if (!payload) {
    // Not authenticated — redirect to login
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check admin-only routes
  const isAdminRoute = ADMIN_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  if (isAdminRoute && payload.role !== "ADMIN") {
    // PARTNER trying to access admin area — redirect to dashboard
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/partners/:path*"],
};
