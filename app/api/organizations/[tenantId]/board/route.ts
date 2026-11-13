import { NextResponse } from "next/server";
import { DEFAULT_COLOR_LEGEND } from "@/lib/constants";
import { getOrganizationUnit } from "@/lib/organizations";
import { isSupabasePublicConfigured } from "@/lib/supabase/env";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params;
  if (!tenantId) {
    return NextResponse.json({ error: "Brak identyfikatora organizacji." }, { status: 400 });
  }

  // W trybie demo fallback
  if (!isSupabasePublicConfigured()) {
    return NextResponse.json({ slug: `${tenantId}-start` });
  }

  const supabase = await createClient();

  // Sprawdź czy organizacja istnieje
  const { data: org } = await supabase
    .from("organizations")
    .select("tenant_id, name")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (!org) {
    // Sprawdź w słowniku statycznym
    const unit = getOrganizationUnit(tenantId);
    if (!unit) {
      return NextResponse.json({ error: "Nie znaleziono jednostki." }, { status: 404 });
    }
  }

  // 1. Sprawdź czy tablica już istnieje
  const { data: existingBoard } = await supabase
    .from("boards")
    .select("id, access_slug")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingBoard?.access_slug) {
    return NextResponse.json({ slug: existingBoard.access_slug });
  }

  // 2. Jeśli tablicy nie ma, utwórz domyślną automatycznie (używając service client, by nie blokowało niezalogowanych)
  try {
    const serviceClient = createServiceClient();
    const unit = getOrganizationUnit(tenantId);
    const orgName = org?.name ?? unit?.fullName ?? unit?.name ?? tenantId;
    const accessSlug = `${tenantId.toLowerCase().replace(/[^a-z0-9-]+/g, "-")}-start`;

    const { data: newBoard, error: insertError } = await serviceClient
      .from("boards")
      .insert({
        tenant_id: tenantId,
        title: `Tablica pomysłów — ${orgName}`,
        description: `Wirtualna tablica pomysłów i burzy mózgów dla jednostki ${orgName}.`,
        access_slug: accessSlug,
        color_legend: { ...DEFAULT_COLOR_LEGEND },
        pin_code: "123456",
      })
      .select("access_slug")
      .single();

    if (insertError || !newBoard) {
      // Jeśli już istnieje pod tym access_slug
      const { data: fallback } = await serviceClient
        .from("boards")
        .select("access_slug")
        .eq("tenant_id", tenantId)
        .maybeSingle();
      if (fallback?.access_slug) {
        return NextResponse.json({ slug: fallback.access_slug });
      }
      return NextResponse.json({ error: insertError?.message ?? "Błąd tworzenia tablicy" }, { status: 500 });
    }

    return NextResponse.json({ slug: newBoard.access_slug });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Błąd serwera" },
      { status: 500 }
    );
  }
}
