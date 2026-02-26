/**
 * app/api/partners/route.ts
 * GET  /api/partners — list all partners (admin only)
 * POST /api/partners — create a new partner (admin only)
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth.middleware";
import { createPartner, getPartners } from "@/services/partner.service";

export async function GET(req: NextRequest) {
  const result = requireAdmin(req);
  if ("error" in result) return result.error;

  try {
    const partners = await getPartners();
    return NextResponse.json({ success: true, partners }, { status: 200 });
  } catch (error) {
    console.error("[GET /api/partners]", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch partners" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const result = requireAdmin(req);
  if ("error" in result) return result.error;

  try {
    const body = await req.json();
    const { name, email, password, mobile, isActive } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, message: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    const partner = await createPartner({
      name,
      email,
      password,
      mobile,
      isActive: isActive ?? true,
      createdBy: result.payload.name,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Partner created successfully",
        partner: {
          id: partner._id.toString(),
          name: partner.name,
          email: partner.email,
          mobile: partner.mobile,
          partnerId: partner.partnerId,
          isActive: partner.isActive,
          role: partner.role,
          createdBy: partner.createdBy,
          createdAt: partner.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create partner";
    console.error("[POST /api/partners]", error);
    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}
