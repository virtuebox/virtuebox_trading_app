/**
 * app/api/auth/me/route.ts
 * GET /api/auth/me
 * Returns the currently authenticated user's info from the JWT cookie.
 * Used by client components to restore auth state.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth.middleware";

export async function GET(req: NextRequest) {
  const result = requireAuth(req);

  if ("error" in result) {
    return result.error;
  }

  return NextResponse.json(
    {
      success: true,
      user: {
        id: result.payload.userId,
        name: result.payload.name,
        email: result.payload.email,
        role: result.payload.role,
      },
    },
    { status: 200 }
  );
}
