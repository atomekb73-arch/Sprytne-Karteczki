import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { DEFAULT_COLOR_LEGEND } from "@/lib/constants";
import { getOrganizationUnit } from "@/lib/organizations";
import { isSupabasePublicConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

interface CreateBoardBody {
  tenantId?: unknown;
  title?: unknown;
  description?: unknown;
  adminToken?: unknown;
}

function buildAccessSlug(tenantId: string): string {
  const base = tenantId
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "wskz-board";
  const suffix = crypto.randomBytes(2).toString("hex");
  return `${base}-${suffix}`;
}

export async function POST(request: Request) {
  if (!isSupabasePublicConfigured()) {
    return NextResponse.json(
      { error: "Konfiguracja Supabase nie jest uzupełniona." },
      { status: 503 }
    );
  }

  let body: CreateBoardBody;
  try {
    body = (await request.json()) as CreateBoardBody;
  } catch {
    return NextResponse.json({ error: "Nieprawidłowy JSON." }, { status: 400 });
  }

  const rawTenantId = typeof body.tenantId === "string" ? body.tenantId.trim() : "";
  const tenantId = getOrganizationUnit(rawTenantId)?.slug ?? rawTenantId;
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const adminToken = typeof body.adminToken === "string" ? body.adminToken.trim() : "";

  if (!tenantId || title.length < 2) {
    return NextResponse.json(
      { error: "Wybierz organizację oraz wpisz tytuł tablicy (min. 2 znaki)." },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = typeof claimsData?.claims?.sub === "string" ? claimsData.claims.sub : null;

  if (!userId) {
    return NextResponse.json({ error: "Wymagane logowanie członka Zarządu." }, { status: 401 });
  }

  const { data: permission } = await supabase
    .from("admin_permissions")
    .select("id")
    .eq("user_id", userId)
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (!permission) {
    return NextResponse.json(
      { error: "Brak uprawnień Zarządu dla wybranej organizacji." },
      { status: 403 }
    );
  }

  const accessSlug = buildAccessSlug(tenantId);

  const { data: board, error: insertError } = await supabase
    .from("boards")
    .insert({
      tenant_id: tenantId,
      title,
      description,
      access_slug: accessSlug,
      color_legend: { ...DEFAULT_COLOR_LEGEND },
    })
    .select("*")
    .single();

  if (insertError || !board) {
    return NextResponse.json(
      { error: insertError?.message ?? "Nie udało się utworzyć tablicy." },
      { status: 400 }
    );
  }

  if (adminToken.length >= 8) {
    await supabase.rpc("rotate_board_admin_token", {
      p_board_id: board.id,
      p_new_token: adminToken,
    });
  }

  return NextResponse.json({ ok: true, board }, { status: 201 });
}
