/**
 * app/api/partners/[id]/route.ts
 * GET    /api/partners/:id  — get a single partner (admin only)
 * PUT    /api/partners/:id  — update partner details (admin only)
 * PATCH  /api/partners/:id  — toggle isActive / soft-delete (admin only)
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth.middleware";
import {
  getPartnerById,
  updatePartner,
  togglePartnerActive,
} from "@/services/partner.service";

type Params = { params: Promise<{ id: string }> };

// GET /api/partners/:id
export async function GET(req: NextRequest, { params }: Params) {
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth.error;

  const { id } = await params;

  try {
    const partner = await getPartnerById(id);
    if (!partner) {
      return NextResponse.json(
        { success: false, message: "Partner not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, partner }, { status: 200 });
  } catch (error) {
    console.error("[GET /api/partners/:id]", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/partners/:id — full update
export async function PUT(req: NextRequest, { params }: Params) {
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth.error;

  const { id } = await params;

  try {
    const body = await req.json();
    const updated = await updatePartner(id, body);

    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Partner not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Partner updated successfully", partner: updated },
      { status: 200 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update partner";
    console.error("[PUT /api/partners/:id]", error);
    return NextResponse.json({ success: false, message }, { status: 400 });
  }
}

// PATCH /api/partners/:id — toggle isActive (soft delete / restore)
export async function PATCH(req: NextRequest, { params }: Params) {
  const auth = await requireAdmin(req);
  if ("error" in auth) return auth.error;

  const { id } = await params;

  try {
    const updated = await togglePartnerActive(id);

    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Partner not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: `Partner ${updated.isActive ? "activated" : "deactivated"} successfully`,
        partner: updated,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[PATCH /api/partners/:id]", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
