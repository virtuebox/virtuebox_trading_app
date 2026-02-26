/**
 * models/user.model.ts
 * Unified User schema for ADMIN and PARTNER roles.
 * Uses Mongoose with timestamps and indexed fields.
 *
 * Financial fields (deposit, sharePercent, etc.) are only meaningful for PARTNERs.
 * Calculated fields (roi, currentMonthUSD, etc.) use 0 as default; logic added later.
 */

import mongoose, { Document, Model, Schema } from "mongoose";

export type UserRole = "ADMIN" | "PARTNER";

export interface IMonthly {
  jan: number;
  feb: number;
  mar: number;
  apr: number;
  may: number;
  jun: number;
  jul: number;
  aug: number;
  sep: number;
  oct: number;
  nov: number;
  dec: number;
}

export interface IUser extends Document {
  // Core identity
  name: string;
  email: string;
  password: string;
  mobile?: string;
  role: UserRole;
  partnerId?: string;      // e.g. VBP10001 — auto-generated for PARTNERs
  isActive: boolean;
  createdBy?: string;

  // Financial fields (PARTNER only — defaults to 0)
  deposit: number;         // Deposit's ($)
  sharePercent: number;    // Share %
  feePercent?: number;     // Fee % (optional)
  startDate?: Date;        // Contract start date
  endDate?: Date;          // Contract end date
  totalWithdrawals: number; // Total Withdrawals ($) — calculated later
  capitalDue: number;      // Capital Due ($) — calculated later
  roi: number;             // ROI % — calculated later
  currentMonthUSD: number; // Current Month ($) — calculated later
  currentMonthINR: number; // Current Month (₹) — calculated later
  backupBalance: number;   // Backup A/C Balance — system-level, shown per partner later
  icMarketAccount?: string; // IC Market Accounts string
  tradingAgreement?: string; // Trading Agreement text/URL

  // Monthly breakdown (calendar year, USD)
  monthly: IMonthly;

  createdAt: Date;
  updatedAt: Date;
}

const MonthlySchema = new Schema<IMonthly>(
  {
    jan: { type: Number, default: 0 },
    feb: { type: Number, default: 0 },
    mar: { type: Number, default: 0 },
    apr: { type: Number, default: 0 },
    may: { type: Number, default: 0 },
    jun: { type: Number, default: 0 },
    jul: { type: Number, default: 0 },
    aug: { type: Number, default: 0 },
    sep: { type: Number, default: 0 },
    oct: { type: Number, default: 0 },
    nov: { type: Number, default: 0 },
    dec: { type: Number, default: 0 },
  },
  { _id: false }
);

const UserSchema: Schema<IUser> = new Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      select: false,
    },
    mobile: { type: String, trim: true },
    role: {
      type: String,
      enum: ["ADMIN", "PARTNER"],
      default: "PARTNER",
    },
    partnerId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    isActive: { type: Boolean, default: true },
    createdBy: { type: String },

    // Financial fields
    deposit: { type: Number, default: 0 },
    sharePercent: { type: Number, default: 0 },
    feePercent: { type: Number },
    startDate: { type: Date },
    endDate: { type: Date },
    totalWithdrawals: { type: Number, default: 0 },
    capitalDue: { type: Number, default: 0 },
    roi: { type: Number, default: 0 },
    currentMonthUSD: { type: Number, default: 0 },
    currentMonthINR: { type: Number, default: 0 },
    backupBalance: { type: Number, default: 0 },
    icMarketAccount: { type: String, trim: true },
    tradingAgreement: { type: String, trim: true },

    // Monthly breakdown
    monthly: { type: MonthlySchema, default: () => ({}) },
  },
  {
    timestamps: true,
  }
);

const User: Model<IUser> =
  mongoose.models.User ?? mongoose.model<IUser>("User", UserSchema);

export default User;
