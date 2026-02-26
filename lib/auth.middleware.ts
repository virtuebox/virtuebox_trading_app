/**
 * lib/auth.middleware.ts
 * Centralized helper to validate JWT from HTTP-only cookies on API routes.
 * Use requireAuth() for any authenticated user.
 * Use requireAdmin() for admin-only endpoints.
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyToken, TokenPayload } from "@/utils/jwt.util";

export type AuthenticatedRequest = NextRequest & { user?: TokenPayload };

/**
 * Extract and verify the JWT token from the request cookie.
 * Returns the decoded payload or a 401 NextResponse.
 */
export function getTokenFromRequest(
  req: NextRequest
): { payload: TokenPayload } | { error: NextResponse } {
  const token = req.cookies.get("token")?.value;

  if (!token) {
    return {
      error: NextResponse.json(
        { success: false, message: "Unauthorized: No token provided" },
        { status: 401 }
      ),
    };
  }

  const payload = verifyToken(token);
  if (!payload) {
    return {
      error: NextResponse.json(
        { success: false, message: "Unauthorized: Invalid or expired token" },
        { status: 401 }
      ),
    };
  }

  return { payload };
}

/**
 * Require any authenticated user. Returns payload or a 401 NextResponse.
 */
export function requireAuth(
  req: NextRequest
): { payload: TokenPayload } | { error: NextResponse } {
  return getTokenFromRequest(req);
}

/**
 * Require ADMIN role. Returns payload or a 401/403 NextResponse.
 */
export function requireAdmin(
  req: NextRequest
): { payload: TokenPayload } | { error: NextResponse } {
  const result = getTokenFromRequest(req);
  if ("error" in result) return result;

  if (result.payload.role !== "ADMIN") {
    return {
      error: NextResponse.json(
        { success: false, message: "Forbidden: Admin access required" },
        { status: 403 }
      ),
    };
  }

  return result;
}
