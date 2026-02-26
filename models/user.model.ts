/**
 * models/user.model.ts
 * Unified User schema for ADMIN and PARTNER roles.
 * Uses Mongoose with timestamps and indexed fields.
 */

import mongoose, { Document, Model, Schema } from "mongoose";

export type UserRole = "ADMIN" | "PARTNER";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  mobile?: string;
  role: UserRole;
  partnerId?: string; // e.g. VBP10001 — auto-generated for PARTNERs
  isActive: boolean;
  createdBy?: string; // Admin user ID or name who created this partner
  createdAt: Date;
  updatedAt: Date;
}

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
      select: false, // Never returned in queries unless explicitly selected
    },
    mobile: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ["ADMIN", "PARTNER"],
      default: "PARTNER",
    },
    partnerId: {
      type: String,
      unique: true,
      sparse: true, // Allow null/undefined (only PARTNERs have this)
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: String, // Admin's ID or name
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

// Prevent model re-compilation in Next.js serverless/hot-reload environment
const User: Model<IUser> =
  mongoose.models.User ?? mongoose.model<IUser>("User", UserSchema);

export default User;
