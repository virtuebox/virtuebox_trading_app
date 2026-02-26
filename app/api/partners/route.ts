/**
 * app/api/partners/route.ts
 * GET  /api/partners — list all partners (admin only)
 * POST /api/partners — create a new partner (admin only)
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, requireAuth } from "@/lib/auth.middleware";
import { createPartner, getPartners, getPartnerById } from "@/services/partner.service";

export async function GET(req: NextRequest) {
  const result = requireAuth(req);
  if ("error" in result) return result.error;

  try {
    const role = result.payload.role;
    let partners;
    
    if (role === "ADMIN") {
      partners = await getPartners();
    } else {
      const partnerData = await getPartnerById(result.payload.userId);
      partners = partnerData ? [partnerData] : [];
    }
    
    return NextResponse.json({ success: true, partners, role }, { status: 200 });
  } catch (error) {
    console.error("[GET /api/partners]", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch partners" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const result = await requireAdmin(req);
  if ("error" in result) return result.error;

  try {
    const body = await req.json();
    const {
      name, email, password, mobile, isActive,
      deposit, sharePercent, feePercent,
      startDate, endDate, icMarketAccount, tradingAgreement,
    } = body;

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
      deposit,
      sharePercent,
      feePercent,
      startDate,
      endDate,
      icMarketAccount,
      tradingAgreement,
    });

    return NextResponse.json(
      { success: true, message: "Partner created successfully", partner },
      { status: 201 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create partner";
    console.error("[POST /api/partners]", error);
    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}
