/**
 * utils/jwt.util.ts
 * JWT sign and verify utilities.
 * Uses the JWT_SECRET and JWT_EXPIRES_IN from environment variables.
 */

import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = (process.env.JWT_EXPIRES_IN ?? "7d") as SignOptions["expiresIn"];

if (!JWT_SECRET) {
  throw new Error("Please define JWT_SECRET in your .env.local file");
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  name: string;
  partnerId?: string; // Only present for PARTNER role users
}

/**
 * Sign a JWT token with the given payload.
 */
export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

/**
 * Verify and decode a JWT token.
 * Returns null if the token is invalid or expired.
 */
export function verifyToken(token: string): (JwtPayload & TokenPayload) | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload & TokenPayload;
  } catch {
    return null;
  }
}
