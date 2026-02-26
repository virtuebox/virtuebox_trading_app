/**
 * utils/password.util.ts
 * bcrypt password hashing and comparison utilities.
 */

import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

/**
 * Hash a plain-text password using bcrypt.
 */
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

/**
 * Compare a plain-text password to a bcrypt hash.
 */
export async function comparePassword(
  plain: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
