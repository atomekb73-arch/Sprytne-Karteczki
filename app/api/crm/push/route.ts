import { NextResponse } from "next/server";
import { CRM_SYSTEM_LABELS, normalizeColorLegend } from "@/lib/constants";
import { getOrganizationUnit } from "@/lib/organizations";
import { isSupabasePublicConfigured } from "@/lib/supabase/env";
import { createClient, createServiceClient } from "@/lib/supabase/server";

interface PushRequestBody {
  boardId?: unknown;
  noteIds?: unknown;
  adminToken?: unknown;
}

function resolveWebhookUrl(crmSystem: "samorzad_kancelaria" | "crm_kola_naukowe"): string {
  const raw =
    crmSystem === "samorzad_kancelaria"
      ? process.env.CRM_SAMORZAD_WEBHOOK_URL
      : process.env.CRM_KOLA_NAUKOWE_WEBHOOK_URL;
  return (raw ?? "").trim();
}

function isExamplePlaceholderUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname.endsWith(".example") ||
      parsed.hostname === "example.com" ||
      parsed.hostname.endsWith(".example.com")
    );
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  try {
    if (!isSupabasePublicConfigured()) {
      return NextResponse.json(
        { error: "Konfiguracja Supabase nie jest jeszcze uzupełniona." },
        { status: 503 }
      );
    }

    let body: PushRequestBody;
    try {
      body = (await request.json()) as PushRequestBody;
    } catch {
      return NextResponse.json(
        { error: "Nieprawidłowe ciało żądania JSON." },
        { status: 400 }
      );
    }

    const boardId = typeof body.boardId === "string" ? body.boardId.trim() : "";
    const adminToken = typeof body.adminToken === "string" ? body.adminToken.trim() : "";
    const noteIds = Array.isArray(body.noteIds)
      ? Array.from(
          new Set(
            body.noteIds.filter(
              (id): id is string => typeof id === "string" && id.trim().length > 0
            )
          )
        )
      : [];

    if (!boardId || noteIds.length === 0) {
      return NextResponse.json(
        { error: "Wymagane pola: boardId oraz niepusta tablica noteIds." },
        { status: 400 }
      );
    }

    const serviceClient = createServiceClient();

    const { data: board, error: boardError } = await serviceClient
      .from("boards")
      .select("id, tenant_id, title, access_slug, color_legend")
      .eq("id", boardId)
      .maybeSingle();

    if (boardError || !board) {
      return NextResponse.json(
        { error: "Nie znaleziono wskazanej tablicy." },
        { status: 404 }
      );
    }

    // Weryfikacja uprawnien Zarzadu (sesja Supabase Auth LUB awaryjny token tablicy)
    let authorized = false;

    const ssrClient = await createClient();
    const { data: claimsData } = await ssrClient.auth.getClaims();
    const userId = typeof claimsData?.claims?.sub === "string" ? claimsData.claims.sub : null;

    if (userId) {
      const { data: permission } = await serviceClient
        .from("admin_permissions")
        .select("id")
        .eq("user_id", userId)
        .eq("tenant_id", board.tenant_id)
        .maybeSingle();

      if (permission) {
        authorized = true;
      }
    }

    if (!authorized && adminToken) {
      const { data: tokenValid } = await serviceClient.rpc("verify_admin_token", {
        p_board_id: board.id,
        p_token: adminToken,
      });
      if (tokenValid === true) {
        authorized = true;
      }
    }

    if (!authorized) {
      return NextResponse.json(
        { error: "Brak uprawnień Zarządu do wysyłki karteczek tej organizacji do CRM." },
        { status: 403 }
      );
    }

    const [{ data: org }, { data: notes, error: notesError }] = await Promise.all([
      serviceClient
        .from("organizations")
        .select("id, tenant_id, name, icon_name, crm_system")
        .eq("tenant_id", board.tenant_id)
        .maybeSingle(),
      serviceClient
        .from("sticky_notes")
        .select("*")
        .eq("board_id", board.id)
        .in("id", noteIds),
    ]);

    if (!org) {
      return NextResponse.json(
        { error: "Nie znaleziono organizacji powiązanej z tą tablicą." },
        { status: 404 }
      );
    }

    if (notesError || !notes || notes.length === 0) {
      return NextResponse.json(
        { error: "Nie znaleziono wskazanych karteczek na tej tablicy." },
        { status: 404 }
      );
    }

    const legend = normalizeColorLegend(board.color_legend);
    const webhookUrl = resolveWebhookUrl(org.crm_system);
    const allowDryRun = (process.env.CRM_ALLOW_DRY_RUN ?? "").trim().toLowerCase() === "true";

    const payload = {
      source: "sprytne-karteczki-wskz",
      crm_system: org.crm_system,
      crm_system_label: CRM_SYSTEM_LABELS[org.crm_system],
      tenant_id: org.tenant_id,
      organization_name: org.name,
      organization_unit: getOrganizationUnit(org.tenant_id),
      board: {
        id: board.id,
        title: board.title,
        access_slug: board.access_slug,
      },
      exported_at: new Date().toISOString(),
      items: notes.map((note) => ({
        note_id: note.id,
        tenant_id: note.tenant_id,
        content: note.content,
        author_name: note.author_name,
        color: note.color,
        category: legend[note.color],
        upvotes: note.upvotes,
        is_pinned: note.is_pinned,
        created_at: note.created_at,
      })),
    };

    let mode: "live" | "dry_run" = "live";

    const useDryRun =
      allowDryRun && (!webhookUrl || isExamplePlaceholderUrl(webhookUrl));

    if (useDryRun) {
      mode = "dry_run";
    } else if (!webhookUrl) {
      return NextResponse.json(
        {
          error: `Brak skonfigurowanego adresu webhooka dla systemu ${org.crm_system}. Ustaw zmienną środowiskową lub włącz CRM_ALLOW_DRY_RUN=true.`,
        },
        { status: 503 }
      );
    } else {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "x-wskz-tenant-id": org.tenant_id,
        "x-wskz-crm-system": org.crm_system,
      };
      const webhookSecret = (process.env.CRM_WEBHOOK_SECRET ?? "").trim();
      if (webhookSecret) {
        headers["x-wskz-webhook-secret"] = webhookSecret;
      }

      const webhookResponse = await fetch(webhookUrl, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000),
      });

      if (!webhookResponse.ok) {
        const bodyPreview = await webhookResponse.text().catch(() => "");
        return NextResponse.json(
          {
            error: `Docelowy system CRM (${CRM_SYSTEM_LABELS[org.crm_system]}) odrzucił żądanie (HTTP ${webhookResponse.status}).`,
            details: bodyPreview.slice(0, 240),
          },
          { status: 502 }
        );
      }
    }

    const pushedIds = notes.map((note) => note.id);
    const nowIso = new Date().toISOString();

    const { data: updatedNotes, error: updateError } = await serviceClient
      .from("sticky_notes")
      .update({
        sent_to_crm: true,
        sent_to_crm_at: nowIso,
      })
      .eq("board_id", board.id)
      .in("id", pushedIds)
      .select("*");

    if (updateError) {
      return NextResponse.json(
        {
          error: "Karteczki wysłano do CRM, ale nie udało się zaktualizować statusu w bazie.",
          details: updateError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      mode,
      crmSystem: org.crm_system,
      crmSystemLabel: CRM_SYSTEM_LABELS[org.crm_system],
      count: updatedNotes?.length ?? pushedIds.length,
      updatedNotes: updatedNotes ?? [],
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Nieoczekiwany błąd podczas wysyłki do CRM.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
