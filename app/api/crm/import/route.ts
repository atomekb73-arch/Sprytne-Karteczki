import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { CRM_SYSTEM_LABELS, normalizeColorLegend } from "@/lib/constants";
import { getOrganizationUnit } from "@/lib/organizations";
import { isSupabasePublicConfigured } from "@/lib/supabase/env";
import { createServiceClient } from "@/lib/supabase/server";

function timingSafeKeyEquals(provided: string, expected: string): boolean {
  const hashA = crypto.createHash("sha256").update(provided, "utf8").digest();
  const hashB = crypto.createHash("sha256").update(expected, "utf8").digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

export async function GET(request: Request) {
  const expectedKey = (process.env.WSKZ_CRM_API_KEY ?? "").trim();
  if (!expectedKey) {
    return NextResponse.json(
      { error: "Endpoint /api/crm/import wymaga ustawienia zmiennej WSKZ_CRM_API_KEY." },
      { status: 503 }
    );
  }

  const providedKey = (request.headers.get("x-wskz-api-key") ?? "").trim();
  if (!providedKey || !timingSafeKeyEquals(providedKey, expectedKey)) {
    return NextResponse.json(
      { error: "Nieautoryzowany dostęp: nieprawidłowy nagłówek x-wskz-api-key." },
      { status: 401 }
    );
  }

  if (!isSupabasePublicConfigured()) {
    return NextResponse.json(
      { error: "Konfiguracja Supabase nie jest jeszcze uzupełniona." },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const rawTenantParam = (searchParams.get("tenant_id") ?? "").trim();
  if (!rawTenantParam) {
    return NextResponse.json(
      { error: "Parametr zapytania tenant_id jest wymagany." },
      { status: 400 }
    );
  }
  const canonicalUnit = getOrganizationUnit(rawTenantParam);
  const tenantId = canonicalUnit?.slug ?? rawTenantParam;

  const minUpvotesRaw = searchParams.get("min_upvotes");
  const minUpvotes = minUpvotesRaw ? Number.parseInt(minUpvotesRaw, 10) : 0;
  if (Number.isNaN(minUpvotes) || minUpvotes < 0) {
    return NextResponse.json(
      { error: "Parametr min_upvotes musi być liczbą całkowitą >= 0." },
      { status: 400 }
    );
  }

  const limitRaw = searchParams.get("limit");
  const limit = limitRaw ? Math.min(Math.max(Number.parseInt(limitRaw, 10) || 200, 1), 500) : 200;

  const boardId = (searchParams.get("board_id") ?? "").trim() || null;
  const accessSlug = (searchParams.get("access_slug") ?? "").trim() || null;
  const includeSent = (searchParams.get("include_sent") ?? "true").toLowerCase() !== "false";

  const serviceClient = createServiceClient();

  const { data: organization, error: orgError } = await serviceClient
    .from("organizations")
    .select("*")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  if (orgError || !organization) {
    return NextResponse.json(
      { error: `Nie znaleziono organizacji o tenant_id="${tenantId}".` },
      { status: 404 }
    );
  }

  let boardsQuery = serviceClient
    .from("boards")
    .select("id, title, access_slug, color_legend, is_locked")
    .eq("tenant_id", tenantId);

  if (boardId) {
    boardsQuery = boardsQuery.eq("id", boardId);
  }
  if (accessSlug) {
    boardsQuery = boardsQuery.eq("access_slug", accessSlug);
  }

  const { data: boards, error: boardsError } = await boardsQuery;
  if (boardsError) {
    return NextResponse.json({ error: boardsError.message }, { status: 500 });
  }

  if (!boards || boards.length === 0) {
    return NextResponse.json(
      {
        organization: {
          ...organization,
          crm_system_label: CRM_SYSTEM_LABELS[organization.crm_system],
        },
        organization_unit: getOrganizationUnit(organization.tenant_id),
        filters: { tenant_id: tenantId, min_upvotes: minUpvotes, board_id: boardId, access_slug: accessSlug, include_sent: includeSent },
        count: 0,
        items: [],
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  const boardMap = new Map(boards.map((b) => [b.id, b]));
  const matchingBoardIds = boards.map((b) => b.id);

  let notesQuery = serviceClient
    .from("sticky_notes")
    .select("*")
    .eq("tenant_id", tenantId)
    .in("board_id", matchingBoardIds)
    .gte("upvotes", minUpvotes)
    .order("is_pinned", { ascending: false })
    .order("upvotes", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!includeSent) {
    notesQuery = notesQuery.eq("sent_to_crm", false);
  }

  const { data: notes, error: notesError } = await notesQuery;
  if (notesError) {
    return NextResponse.json({ error: notesError.message }, { status: 500 });
  }

  const items = (notes ?? []).map((note) => {
    const board = boardMap.get(note.board_id);
    const legend = normalizeColorLegend(board?.color_legend);
    return {
      id: note.id,
      tenant_id: note.tenant_id,
      board_id: note.board_id,
      board_title: board?.title ?? "",
      board_access_slug: board?.access_slug ?? "",
      content: note.content,
      author_name: note.author_name,
      color: note.color,
      category: legend[note.color],
      upvotes: note.upvotes,
      is_pinned: note.is_pinned,
      sent_to_crm: note.sent_to_crm,
      sent_to_crm_at: note.sent_to_crm_at,
      created_at: note.created_at,
    };
  });

  return NextResponse.json(
    {
      organization: {
        ...organization,
        crm_system_label: CRM_SYSTEM_LABELS[organization.crm_system],
      },
      organization_unit: getOrganizationUnit(organization.tenant_id),
      filters: {
        tenant_id: tenantId,
        min_upvotes: minUpvotes,
        board_id: boardId,
        access_slug: accessSlug,
        include_sent: includeSent,
      },
      count: items.length,
      items,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
