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

  // Sprawdź czy jest superadminem
  const { data: userPerms } = await supabase
    .from("admin_permissions")
    .select("tenant_id, role, user_email, user_id");

  const isSuperadmin = (userPerms ?? []).some(
    (p) =>
      p.role === "superadmin" &&
      ((p.user_email && p.user_email.toLowerCase() === email) || (uid && p.user_id === uid))
  );

  // Pobierz listę uprawnień (serviceClient, by widzieć listę dla panelu zarządzania)
  const service = createServiceClient();
  const { data: allPerms, error } = await service
    .from("admin_permissions")
    .select("id, user_email, tenant_id, role, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    permissions: allPerms ?? [],
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
    return NextResponse.json({ error: "Nieprawidłowy JSON." }, { status: 400 });
  }

  const targetEmail = (body.email ?? "").trim().toLowerCase();
  const tenantId = (body.tenantId ?? "").trim();
  const requestedRole = body.role === "superadmin" ? "superadmin" : "board_admin";

  if (!targetEmail || !targetEmail.includes("@")) {
    return NextResponse.json({ error: "Wpisz poprawny adres e-mail." }, { status: 400 });
  }

  if (!tenantId) {
    return NextResponse.json({ error: "Wybierz jednostkę lub 'all'." }, { status: 400 });
  }

  const service = createServiceClient();

  // Sprawdź uprawnienia wywołującego
  const { data: callerPerms } = await service
    .from("admin_permissions")
    .select("tenant_id, role, user_email, user_id");

  const isCallerSuperadmin = (callerPerms ?? []).some(
    (p) =>
      p.role === "superadmin" &&
      ((p.user_email && p.user_email.toLowerCase() === callerEmail) || (callerUid && p.user_id === callerUid))
  );

  const isCallerTenantAdmin = (callerPerms ?? []).some(
    (p) =>
      (p.tenant_id === tenantId || p.role === "superadmin") &&
      ((p.user_email && p.user_email.toLowerCase() === callerEmail) || (callerUid && p.user_id === callerUid))
  );

  if (!isCallerSuperadmin && !isCallerTenantAdmin) {
    return NextResponse.json({ error: "Brak uprawnień do nadawania roli w tej jednostce." }, { status: 403 });
  }

  if (tenantId === "all" && !isCallerSuperadmin) {
    return NextResponse.json({ error: "Tylko Superadmin może nadawać uprawnienia do wszystkich kół." }, { status: 403 });
  }

  // Nadaj uprawnienia
  if (tenantId === "all") {
    const { data: allOrgs } = await service.from("organizations").select("tenant_id");
    const rows = (allOrgs ?? []).map((o) => ({
      user_email: targetEmail,
      tenant_id: o.tenant_id,
      role: "superadmin" as const,
    }));

    const { error: insertError } = await service
      .from("admin_permissions")
      .upsert(rows, { onConflict: "user_email,tenant_id" });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
  } else {
    const { error: insertError } = await service
      .from("admin_permissions")
      .upsert(
        {
          user_email: targetEmail,
          tenant_id: tenantId,
          role: requestedRole as "superadmin" | "board_admin",
        },
        { onConflict: "user_email,tenant_id" }
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

  // Sprawdź czy caller to superadmin
  const { data: callerPerms } = await service
    .from("admin_permissions")
    .select("tenant_id, role, user_email, user_id");

  const isCallerSuperadmin = (callerPerms ?? []).some(
    (p) =>
      p.role === "superadmin" &&
      ((p.user_email && p.user_email.toLowerCase() === callerEmail) || (callerUid && p.user_id === callerUid))
  );

  if (!isCallerSuperadmin) {
    return NextResponse.json({ error: "Tylko Superadmin może odbierać uprawnienia." }, { status: 403 });
  }

  if (permissionId) {
    const { error } = await service.from("admin_permissions").delete().eq("id", permissionId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else if (targetEmail) {
    const { error } = await service.from("admin_permissions").delete().ilike("user_email", targetEmail);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    return NextResponse.json({ error: "Brak parametru id lub email." }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
