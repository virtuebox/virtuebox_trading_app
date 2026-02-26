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
}

/**
 * Verify a JWT token in the Edge Runtime.
 * Returns the decoded payload, or null if the token is invalid/expired.
 */
export async function verifyTokenEdge(
  token: string
): Promise<EdgeTokenPayload | null> {
  try {
    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET ?? ""
    );
    const { payload } = await jwtVerify(token, secret);
    return payload as EdgeTokenPayload;
  } catch {
    return null;
  }
}
