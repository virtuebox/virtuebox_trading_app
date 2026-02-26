/**
 * services/partner.service.ts
 * Business logic for Partner management.
 * Called from API route handlers.
 */

import { connectDB } from "@/lib/db";
import User, { IUser } from "@/models/user.model";
import { hashPassword } from "@/utils/password.util";

interface CreatePartnerInput {
  name: string;
  email: string;
  password: string;
  mobile?: string;
  isActive?: boolean;
  createdBy: string; // Admin's name or ID
}

/**
 * Generate the next partnerId in VBP10001 format.
 */
async function generatePartnerId(): Promise<string> {
  const lastPartner = await User.findOne({ role: "PARTNER" })
    .sort({ createdAt: -1 })
    .select("partnerId")
    .lean();

  if (!lastPartner || !lastPartner.partnerId) {
    return "VBP10001";
  }

  const lastNum = parseInt(lastPartner.partnerId.replace("VBP", ""), 10);
  return `VBP${String(lastNum + 1).padStart(5, "0")}`;
}

/**
 * Create a new PARTNER user.
 */
export async function createPartner(
  input: CreatePartnerInput
): Promise<IUser> {
  await connectDB();

  const existingUser = await User.findOne({ email: input.email.toLowerCase() });
  if (existingUser) {
    throw new Error("A user with this email already exists");
  }

  const hashedPassword = await hashPassword(input.password);
  const partnerId = await generatePartnerId();

  const partner = await User.create({
    name: input.name,
    email: input.email.toLowerCase(),
    password: hashedPassword,
    mobile: input.mobile,
    role: "PARTNER",
    partnerId,
    isActive: input.isActive ?? true,
    createdBy: input.createdBy,
  });

  return partner;
}

/**
 * Retrieve all PARTNER users (excluding password field).
 */
export async function getPartners(): Promise<IUser[]> {
  await connectDB();

  const partners = await User.find({ role: "PARTNER" })
    .select("-password")
    .sort({ createdAt: -1 })
    .lean();

  return partners as unknown as IUser[];
}
