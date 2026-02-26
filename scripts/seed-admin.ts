/**
 * scripts/seed-admin.ts
 * One-time script to seed the initial ADMIN user.
 *
 * Usage:
 *   npx ts-node --project tsconfig.json scripts/seed-admin.ts
 *
 * Or if ts-node isn't available:
 *   npx tsx scripts/seed-admin.ts
 *
 * Set MONGODB_URI in .env.local before running.
 */

import mongoose from "mongoose";
import * as dotenv from "dotenv";
import path from "path";

// Load env variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is not defined in .env.local");
}

import bcrypt from "bcryptjs";

const UserSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true, lowercase: true },
    password: String,
    mobile: String,
    role: { type: String, enum: ["ADMIN", "PARTNER"], default: "PARTNER" },
    partnerId: { type: String, sparse: true },
    isActive: { type: Boolean, default: true },
    createdBy: String,
  },
  { timestamps: true }
);

const User =
  mongoose.models?.User ?? mongoose.model("User", UserSchema);

async function seedAdmin() {
  await mongoose.connect(MONGODB_URI!);
  console.log("✅ Connected to MongoDB");

  const existing = await User.findOne({ email: "admin@virtuebox.com" });
  if (existing) {
    console.log("ℹ️  Admin already exists:", existing.email);
    await mongoose.disconnect();
    return;
  }

  const hashedPassword = await bcrypt.hash("Admin@123", 12);

  await User.create({
    name: "Super Admin",
    email: "admin@virtuebox.com",
    password: hashedPassword,
    role: "ADMIN",
    isActive: true,
  });

  console.log("🎉 Admin user created successfully!");
  console.log("   Email:    admin@virtuebox.com");
  console.log("   Password: Admin@123");
  console.log("   ⚠️  Change this password after first login.");

  await mongoose.disconnect();
}

seedAdmin().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
