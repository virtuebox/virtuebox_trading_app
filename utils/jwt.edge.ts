/**
 * utils/jwt.edge.ts
 * JWT verification using 'jose' — EDGE RUNTIME ONLY.
 *
 * WHY TWO JWT FILES?
 * - `jsonwebtoken` (used in jwt.util.ts) uses Node.js crypto APIs that are
 *   NOT available in Next.js Middleware's Edge Runtime.
 * - `jose` is a pure Web Crypto API library that works in BOTH Edge and Node.
 * - This file is imported ONLY by middleware.ts.
 * - jwt.util.ts is imported by API routes (Node.js runtime) only.
 *
 * DO NOT import jsonwebtoken here. DO NOT import this file in API routes.
 */

import { jwtVerify, JWTPayload } from "jose";

export interface EdgeTokenPayload extends JWTPayload {
  userId: string;
  email: string;
  role: string;
  name: string;
  partnerId?: string; // Only present for PARTNER role users
}

/**
 * Verify a JWT token in the Edge Runtime.
 * Returns the decoded payload, or null if the token is invalid/expired/missing-secret.
 *
 * NOTE: JWT_SECRET MUST be set as an environment variable in Vercel (or any deployment).
 * jose requires a secret of at least 32 characters for HS256.
 * If JWT_SECRET is missing, ALL requests to protected routes will fail.
 */
export async function verifyTokenEdge(
  token: string
): Promise<EdgeTokenPayload | null> {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret || jwtSecret.length < 32) {
    console.error(
      "[jwt.edge] JWT_SECRET is missing or too short (must be ≥32 chars). " +
      "Add JWT_SECRET to your Vercel Environment Variables and redeploy."
    );
    return null;
  }

  try {
    const secret = new TextEncoder().encode(jwtSecret);
    const { payload } = await jwtVerify(token, secret);
    return payload as EdgeTokenPayload;
  } catch {
    return null;
  }
}
