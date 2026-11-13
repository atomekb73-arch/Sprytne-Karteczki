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
  isSuperadmin: boolean;
}> {
  if (!isSupabasePublicConfigured()) {
    return { userId: null, userEmail: null, tenants: [], isSuperadmin: false };
  }

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;
  const userId = typeof claims?.sub === "string" ? claims.sub : null;
  const userEmail = typeof claims?.email === "string" ? claims.email : null;

  if (!userId && !userEmail) {
    return { userId: null, userEmail: null, tenants: [], isSuperadmin: false };
  }

  // Pobierz uprawnienia wg user_id lub lower(user_email)
  const permQuery = supabase.from("admin_permissions").select("tenant_id, role, user_email, user_id");
  let permissions: { tenant_id: string; role: string; user_email?: string | null; user_id?: string | null }[] = [];

  if (userId && userEmail) {
    const { data, error } = await permQuery.or(`user_id.eq.${userId},user_email.ilike.${userEmail}`);
    if (!error && data) permissions = data;
  } else if (userId) {
    const { data, error } = await permQuery.eq("user_id", userId);
    if (!error && data) permissions = data;
  } else if (userEmail) {
    const { data, error } = await permQuery.ilike("user_email", userEmail);
    if (!error && data) permissions = data;
  }

  const isSuperadmin = permissions.some((p) => p.role === "superadmin" || p.role === "owner");

  // Jeśli użytkownik jest superadminem, ma dostęp do WSZYSTKICH organizacji
  let tenantIds: string[] = [];
  if (isSuperadmin) {
    const { data: allOrgs } = await supabase.from("organizations").select("tenant_id");
    tenantIds = Array.from(new Set((allOrgs ?? []).map((o) => o.tenant_id)));
  } else {
    tenantIds = Array.from(new Set(permissions.map((p) => p.tenant_id)));
  }

  if (tenantIds.length === 0) {
    return { userId, userEmail, tenants: [], isSuperadmin: false };
  }

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
      role: (isSuperadmin ? "superadmin" : roleMap.get(tenantId) ?? "board_admin") as AdminTenantSummary["role"],
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

  return { userId, userEmail, tenants, isSuperadmin };
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

  const isAuthenticatedAdmin =
    adminState.isSuperadmin ||
    adminState.tenants.some((t) => t.tenant_id === board.tenant_id);

  return {
    board,
    organization: orgRow as OrganizationRecord,
    notes: (noteRows ?? []) as StickyNoteRecord[],
    isAuthenticatedAdmin,
    userEmail: adminState.userEmail,
    adminTenants: adminState.tenants,
    isSuperadmin: adminState.isSuperadmin,
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
