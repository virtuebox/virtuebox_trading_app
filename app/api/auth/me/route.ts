/**
 * app/api/auth/me/route.ts
 * GET /api/auth/me
 * Returns the currently authenticated user's info from the JWT cookie.
 * Used by client components to restore auth state.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth.middleware";

export async function GET(req: NextRequest) {
  const result = await requireAuth(req);

  if ("error" in result) {
    return result.error;
  }

  const { userId, name, email, role, partnerId } = result.payload;

  return NextResponse.json(
    {
      success: true,
      user: {
        id: userId,
        name,
        email,
        role,
        // Only include partnerId if it exists in the token (PARTNER users only)
        ...(partnerId ? { partnerId } : {}),
      },
    },
    { status: 200 }
  );
}
