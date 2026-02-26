/**
 * services/partner.service.ts
 * Business logic for Partner management.
 * Called from API route handlers only.
 */

import { connectDB } from "@/lib/db";
import User, { IUser, IMonthly } from "@/models/user.model";
import { hashPassword } from "@/utils/password.util";

export interface CreatePartnerInput {
  name: string;
  email: string;
  password: string;
  mobile?: string;
  isActive?: boolean;
  createdBy: string;
  deposit?: number;
  sharePercent?: number;
  feePercent?: number;
  startDate?: string;
  endDate?: string;
  icMarketAccount?: string;
  tradingAgreement?: string;
}

export interface UpdatePartnerInput {
  name?: string;
  email?: string;
  password?: string;
  mobile?: string;
  isActive?: boolean;
  deposit?: number;
  sharePercent?: number;
  feePercent?: number;
  startDate?: string | null;
  endDate?: string | null;
  totalWithdrawals?: number;
  capitalDue?: number;
  roi?: number;
  currentMonthUSD?: number;
  currentMonthINR?: number;
  backupBalance?: number;
  icMarketAccount?: string;
  tradingAgreement?: string;
  monthly?: Partial<IMonthly>;
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
    deposit: input.deposit ?? 0,
    sharePercent: input.sharePercent ?? 0,
    feePercent: input.feePercent,
    startDate: input.startDate ? new Date(input.startDate) : undefined,
    endDate: input.endDate ? new Date(input.endDate) : undefined,
    icMarketAccount: input.icMarketAccount,
    tradingAgreement: input.tradingAgreement,
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
    .sort({ createdAt: 1 })
    .lean();

  return partners as unknown as IUser[];
}

/**
 * Get a single partner by MongoDB _id.
 */
export async function getPartnerById(id: string): Promise<IUser | null> {
  await connectDB();
  return User.findOne({ _id: id, role: "PARTNER" })
    .select("-password")
    .lean() as unknown as IUser | null;
}

/**
 * Update partner details.
 * Only updates fields that are explicitly provided.
 */
export async function updatePartner(
  id: string,
  input: UpdatePartnerInput
): Promise<IUser | null> {
  await connectDB();

  // Build update object — only include provided fields
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const update: Record<string, any> = {};

  const simpleFields: (keyof UpdatePartnerInput)[] = [
    "name", "mobile", "isActive",
    "deposit", "sharePercent", "feePercent",
    "totalWithdrawals", "capitalDue", "roi",
    "currentMonthUSD", "currentMonthINR", "backupBalance",
    "icMarketAccount", "tradingAgreement",
  ];

  for (const field of simpleFields) {
    if (input[field] !== undefined) {
      update[field] = input[field];
    }
  }

  // Handle date fields
  if (input.startDate !== undefined) {
    update.startDate = input.startDate ? new Date(input.startDate) : null;
  }
  if (input.endDate !== undefined) {
    update.endDate = input.endDate ? new Date(input.endDate) : null;
  }

  // Handle monthly sub-document fields
  if (input.monthly) {
    for (const [month, val] of Object.entries(input.monthly)) {
      update[`monthly.${month}`] = val;
    }
  }

  // Handle email change — check uniqueness
  if (input.email) {
    const existing = await User.findOne({
      email: input.email.toLowerCase(),
      _id: { $ne: id },
    });
    if (existing) throw new Error("A user with this email already exists");
    update.email = input.email.toLowerCase();
  }

  // Handle password change
  if (input.password) {
    update.password = await hashPassword(input.password);
  }

  const updated = await User.findOneAndUpdate(
    { _id: id, role: "PARTNER" },
    { $set: update },
    { new: true, runValidators: true }
  ).select("-password");

  return updated as unknown as IUser | null;
}

/**
 * Toggle a partner's isActive status (soft delete / restore).
 */
export async function togglePartnerActive(
  id: string
): Promise<IUser | null> {
  await connectDB();

  const partner = await User.findOne({ _id: id, role: "PARTNER" });
  if (!partner) return null;

  partner.isActive = !partner.isActive;
  await partner.save();

  return partner;
}
