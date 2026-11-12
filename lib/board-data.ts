import { normalizeColorLegend } from "@/lib/constants";
import {
  DEMO_BOARDS,
  DEMO_ORGANIZATIONS,
  findDemoBoardBundleBySlug,
} from "@/lib/demo-data";
import { resolveOrganizationMeta } from "@/lib/organizations";
import { isSupabasePublicConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type {
  AdminTenantSummary,
  BoardPageBundle,
  BoardRecord,
  OrganizationRecord,
  StickyNoteRecord,
} from "@/types/board";

export async function fetchAdminTenantsForCurrentUser(): Promise<{
  userId: string | null;
  userEmail: string | null;
  tenants: AdminTenantSummary[];
}> {
  if (!isSupabasePublicConfigured()) {
    return { userId: null, userEmail: null, tenants: [] };
  }

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;
  const userId = typeof claims?.sub === "string" ? claims.sub : null;

  if (!userId) {
    return { userId: null, userEmail: null, tenants: [] };
  }

  const userEmail = typeof claims?.email === "string" ? claims.email : null;

  const { data: permissions, error: permError } = await supabase
    .from("admin_permissions")
    .select("tenant_id, role")
    .eq("user_id", userId);

  if (permError || !permissions || permissions.length === 0) {
    return { userId, userEmail, tenants: [] };
  }

  const tenantIds = Array.from(new Set(permissions.map((p) => p.tenant_id)));

  const [{ data: orgs }, { data: boards }] = await Promise.all([
    supabase
      .from("organizations")
      .select("*")
      .in("tenant_id", tenantIds)
      .order("name", { ascending: true }),
    supabase
      .from("boards")
      .select("id, tenant_id, title, access_slug, is_locked, updated_at")
      .in("tenant_id", tenantIds)
      .order("updated_at", { ascending: false }),
  ]);

  const orgMap = new Map((orgs ?? []).map((org) => [org.tenant_id, org as OrganizationRecord]));
  const boardsByTenant = new Map<
    string,
    Pick<BoardRecord, "id" | "title" | "access_slug" | "is_locked" | "updated_at">[]
  >();

  for (const board of boards ?? []) {
    const list = boardsByTenant.get(board.tenant_id) ?? [];
    list.push({
      id: board.id,
      title: board.title,
      access_slug: board.access_slug,
      is_locked: board.is_locked,
      updated_at: board.updated_at,
    });
    boardsByTenant.set(board.tenant_id, list);
  }

  const roleMap = new Map(permissions.map((p) => [p.tenant_id, p.role]));

  const tenants: AdminTenantSummary[] = [];
  for (const tenantId of tenantIds) {
    const org = orgMap.get(tenantId);
    if (!org) continue;
    tenants.push({
      tenant_id: tenantId,
      role: roleMap.get(tenantId) ?? "board_admin",
      organization: org,
      boards: boardsByTenant.get(tenantId) ?? [],
    });
  }

  tenants.sort((a, b) => {
    const orderDiff =
      resolveOrganizationMeta(a.organization).sort_order -
      resolveOrganizationMeta(b.organization).sort_order;
    if (orderDiff !== 0) return orderDiff;
    return a.organization.name.localeCompare(b.organization.name, "pl");
  });

  return { userId, userEmail, tenants };
}

export async function fetchBoardBundleBySlug(
  accessSlug: string
): Promise<BoardPageBundle | null> {
  if (!isSupabasePublicConfigured()) {
    return findDemoBoardBundleBySlug(accessSlug);
  }

  const supabase = await createClient();

  const { data: boardRow, error: boardError } = await supabase
    .from("boards")
    .select("*")
    .eq("access_slug", accessSlug)
    .maybeSingle();

  if (boardError || !boardRow) {
    return null;
  }

  const [{ data: orgRow }, { data: noteRows }, adminState] = await Promise.all([
    supabase
      .from("organizations")
      .select("*")
      .eq("tenant_id", boardRow.tenant_id)
      .maybeSingle(),
    supabase
      .from("sticky_notes")
      .select("*")
      .eq("board_id", boardRow.id)
      .order("created_at", { ascending: false }),
    fetchAdminTenantsForCurrentUser(),
  ]);

  if (!orgRow) {
    return null;
  }

  const board: BoardRecord = {
    ...boardRow,
    color_legend: normalizeColorLegend(boardRow.color_legend),
  };

  const isAuthenticatedAdmin = adminState.tenants.some(
    (t) => t.tenant_id === board.tenant_id
  );

  return {
    board,
    organization: orgRow as OrganizationRecord,
    notes: (noteRows ?? []) as StickyNoteRecord[],
    isAuthenticatedAdmin,
    userEmail: adminState.userEmail,
    adminTenants: adminState.tenants,
  };
}

export async function fetchPublicEcosystemOverview(): Promise<{
  organizations: OrganizationRecord[];
  boards: Pick<BoardRecord, "id" | "tenant_id" | "title" | "access_slug" | "is_locked" | "description">[];
  isDemoMode: boolean;
}> {
  if (!isSupabasePublicConfigured()) {
    return {
      organizations: DEMO_ORGANIZATIONS,
      boards: DEMO_BOARDS,
      isDemoMode: true,
    };
  }

  const supabase = await createClient();

  const [{ data: orgs }, { data: boards }] = await Promise.all([
    supabase.from("organizations").select("*").order("name", { ascending: true }),
    supabase
      .from("boards")
      .select("id, tenant_id, title, access_slug, is_locked, description")
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  const sortedOrganizations = [...((orgs ?? []) as OrganizationRecord[])].sort(
    (a, b) => {
      const orderDiff =
        resolveOrganizationMeta(a).sort_order -
        resolveOrganizationMeta(b).sort_order;
      if (orderDiff !== 0) return orderDiff;
      return a.name.localeCompare(b.name, "pl");
    }
  );

  return {
    organizations: sortedOrganizations,
    boards: boards ?? [],
    isDemoMode: false,
  };
}
