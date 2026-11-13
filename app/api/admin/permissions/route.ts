import { NextResponse } from "next/server";
import { isSupabasePublicConfigured } from "@/lib/supabase/env";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  if (!isSupabasePublicConfigured()) {
    return NextResponse.json({
      permissions: [
        {
          id: "demo-1",
          user_email: "atomekb73@gmail.com",
          tenant_id: "all",
          role: "superadmin",
          created_at: new Date().toISOString(),
        },
      ],
      isSuperadmin: true,
    });
  }

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const email = typeof claimsData?.claims?.email === "string" ? claimsData.claims.email.toLowerCase() : null;
  const uid = typeof claimsData?.claims?.sub === "string" ? claimsData.claims.sub : null;

  if (!email && !uid) {
    return NextResponse.json({ error: "Wymagane logowanie." }, { status: 401 });
  }

  const service = createServiceClient();

  // Pobierz uprawnienia z bazy danych
  const { data: allPerms, error } = await service
    .from("admin_permissions")
    .select("id, user_id, tenant_id, role, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Powiąż user_id z adresami e-mail z auth.users
  let emailMap = new Map<string, string>();
  try {
    const { data: authUsers } = await service.auth.admin.listUsers({ perPage: 1000 });
    if (authUsers?.users) {
      emailMap = new Map(authUsers.users.map((u) => [u.id, (u.email ?? "").toLowerCase()]));
    }
  } catch {
    // Ignoruj błąd pobierania
  }

  const isSuperadmin =
    email === "atomekb73@gmail.com" ||
    (allPerms ?? []).some(
      (p) =>
        (p.role === "superadmin" || p.role === "owner") &&
        uid &&
        p.user_id === uid
    );

  // Grupuj w celu czytelnej prezentacji (użytkownicy z uprawnieniami do wszystkich kół jako 1 wpis)
  type PermRow = NonNullable<typeof allPerms>[number];
  const permsByUser = new Map<string, PermRow[]>();
  for (const p of allPerms ?? []) {
    if (!p.user_id) continue;
    const list = permsByUser.get(p.user_id) ?? [];
    list.push(p);
    permsByUser.set(p.user_id, list);
  }

  const enrichedPerms: Array<{
    id: string;
    user_id: string;
    user_email: string;
    tenant_id: string;
    role: string;
    created_at: string;
  }> = [];

  for (const [userId, userRows] of permsByUser.entries()) {
    const userEmail = emailMap.get(userId) ?? "Użytkownik bez adresu";
    const isFullAdmin =
      userRows.length >= 17 ||
      userRows.some((r) => r.tenant_id === "all") ||
      (userRows.length > 1 && userRows.every((r) => r.role === "owner" || r.role === "superadmin"));

    if (isFullAdmin) {
      enrichedPerms.push({
        id: userRows[0].id,
        user_id: userId,
        user_email: userEmail,
        tenant_id: "all",
        role: "superadmin",
        created_at: userRows[0].created_at,
      });
    } else {
      for (const r of userRows) {
        enrichedPerms.push({
          id: r.id,
          user_id: userId,
          user_email: userEmail,
          tenant_id: r.tenant_id,
          role: r.role,
          created_at: r.created_at,
        });
      }
    }
  }

  return NextResponse.json({
    permissions: enrichedPerms,
    isSuperadmin,
  });
}

export async function POST(request: Request) {
  if (!isSupabasePublicConfigured()) {
    return NextResponse.json({ success: true, mode: "demo" });
  }

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const callerEmail = typeof claimsData?.claims?.email === "string" ? claimsData.claims.email.toLowerCase() : null;
  const callerUid = typeof claimsData?.claims?.sub === "string" ? claimsData.claims.sub : null;

  if (!callerEmail && !callerUid) {
    return NextResponse.json({ error: "Wymagane logowanie Zarządu." }, { status: 401 });
  }

  let body: { email?: string; tenantId?: string; role?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Nieprawidłowy format zapytania." }, { status: 400 });
  }

  const targetEmail = (body.email ?? "").trim().toLowerCase();
  const tenantId = (body.tenantId ?? "").trim();
  const requestedRole = body.role === "superadmin" ? "owner" : "board_admin";

  if (!targetEmail || !targetEmail.includes("@")) {
    return NextResponse.json({ error: "Wpisz poprawny adres e-mail." }, { status: 400 });
  }

  if (!tenantId) {
    return NextResponse.json({ error: "Wybierz jednostkę lub 'all'." }, { status: 400 });
  }

  const service = createServiceClient();

  // Weryfikacja uprawnień osoby zlecającej
  const isOwnerEmail = callerEmail === "atomekb73@gmail.com";

  const { data: callerPerms } = await service
    .from("admin_permissions")
    .select("tenant_id, role, user_id");

  const isCallerSuperadmin =
    isOwnerEmail ||
    (callerPerms ?? []).some(
      (p) =>
        (p.role === "superadmin" || p.role === "owner") &&
        callerUid &&
        p.user_id === callerUid
    );

  const isCallerTenantAdmin =
    isCallerSuperadmin ||
    (callerPerms ?? []).some(
      (p) =>
        p.tenant_id === tenantId &&
        callerUid &&
        p.user_id === callerUid
    );

  if (!isCallerSuperadmin && !isCallerTenantAdmin) {
    return NextResponse.json(
      { error: "Brak uprawnień do nadawania roli w tej jednostce." },
      { status: 403 }
    );
  }

  if (tenantId === "all" && !isCallerSuperadmin) {
    return NextResponse.json(
      { error: "Tylko Główny Administrator może nadawać uprawnienia do wszystkich kół." },
      { status: 403 }
    );
  }

  // Ustal lub utwórz konto użytkownika w Supabase Auth po adresie e-mail (dowolna domena: Gmail, Onet, WP itp.)
  let targetUserId: string | null = null;
  try {
    const { data: authUsers } = await service.auth.admin.listUsers({ perPage: 1000 });
    const existing = authUsers?.users?.find((u) => u.email?.toLowerCase() === targetEmail);

    if (existing) {
      targetUserId = existing.id;
    } else {
      const { data: newUser, error: createErr } = await service.auth.admin.createUser({
        email: targetEmail,
        email_confirm: true,
      });

      if (createErr || !newUser?.user) {
        return NextResponse.json(
          { error: `Nie udało się zarejestrować adresu e-mail: ${createErr?.message ?? "nieznany błąd"}` },
          { status: 500 }
        );
      }
      targetUserId = newUser.user.id;
    }
  } catch (authErr) {
    return NextResponse.json(
      { error: `Błąd komunikacji z modułem autoryzacji: ${authErr instanceof Error ? authErr.message : "nieznany błąd"}` },
      { status: 500 }
    );
  }

  if (!targetUserId) {
    return NextResponse.json({ error: "Nie udało się ustalić identyfikatora użytkownika." }, { status: 500 });
  }

  // Nadaj uprawnienia w tabeli admin_permissions (onConflict: user_id,tenant_id)
  if (tenantId === "all") {
    const { data: allOrgs } = await service.from("organizations").select("tenant_id");
    const rows = (allOrgs ?? []).map((o) => ({
      user_id: targetUserId,
      tenant_id: o.tenant_id,
      role: "owner" as const,
    }));

    const { error: insertError } = await service
      .from("admin_permissions")
      .upsert(rows, { onConflict: "user_id,tenant_id" });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
  } else {
    const { error: insertError } = await service
      .from("admin_permissions")
      .upsert(
        {
          user_id: targetUserId,
          tenant_id: tenantId,
          role: requestedRole,
        },
        { onConflict: "user_id,tenant_id" }
      );

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true, email: targetEmail });
}

export async function DELETE(request: Request) {
  if (!isSupabasePublicConfigured()) {
    return NextResponse.json({ success: true, mode: "demo" });
  }

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const callerEmail = typeof claimsData?.claims?.email === "string" ? claimsData.claims.email.toLowerCase() : null;
  const callerUid = typeof claimsData?.claims?.sub === "string" ? claimsData.claims.sub : null;

  if (!callerEmail && !callerUid) {
    return NextResponse.json({ error: "Wymagane logowanie Zarządu." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const permissionId = searchParams.get("id");
  const targetEmail = searchParams.get("email")?.toLowerCase();

  const service = createServiceClient();

  const isOwnerEmail = callerEmail === "atomekb73@gmail.com";

  const { data: callerPerms } = await service
    .from("admin_permissions")
    .select("tenant_id, role, user_id");

  const isCallerSuperadmin =
    isOwnerEmail ||
    (callerPerms ?? []).some(
      (p) =>
        (p.role === "superadmin" || p.role === "owner") &&
        callerUid &&
        p.user_id === callerUid
    );

  if (!isCallerSuperadmin) {
    return NextResponse.json({ error: "Tylko Główny Administrator może odbierać uprawnienia." }, { status: 403 });
  }

  if (permissionId) {
    const { data: permRow } = await service
      .from("admin_permissions")
      .select("user_id")
      .eq("id", permissionId)
      .maybeSingle();

    if (permRow?.user_id) {
      const { error } = await service.from("admin_permissions").delete().eq("user_id", permRow.user_id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      const { error } = await service.from("admin_permissions").delete().eq("id", permissionId);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } else if (targetEmail) {
    const { data: authUsers } = await service.auth.admin.listUsers({ perPage: 1000 });
    const targetUser = authUsers?.users?.find((u) => u.email?.toLowerCase() === targetEmail);
    if (targetUser) {
      const { error } = await service.from("admin_permissions").delete().eq("user_id", targetUser.id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } else {
    return NextResponse.json({ error: "Brak parametru id lub email." }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
