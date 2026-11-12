"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Lock, Mail, Search, X } from "lucide-react";
import { CRM_SYSTEM_LABELS } from "@/lib/constants";
import { OrganizationIcon } from "@/lib/icons";
import {
  ALL_VIEWS_UNIT,
  WSKZ_ORGANIZATIONS_CATALOG,
  resolveOrganizationMeta,
} from "@/lib/organizations";
import type { BoardRecord, OrganizationRecord } from "@/types/board";

interface EcosystemDirectoryProps {
  organizations: OrganizationRecord[];
  boards: Pick<
    BoardRecord,
    "id" | "tenant_id" | "title" | "access_slug" | "is_locked" | "description"
  >[];
}

function normalizeFilterId(tenantId: string): string {
  return tenantId === "wszystkie" ? ALL_VIEWS_UNIT.tenant_id : tenantId;
}

export function EcosystemDirectory({
  organizations,
  boards,
}: EcosystemDirectoryProps) {
  const [unitTypeFilter, setUnitTypeFilter] = useState<"all" | "admin" | "club">(
    "all"
  );
  const [selectedTenantId, setSelectedTenantId] = useState<string>(
    ALL_VIEWS_UNIT.tenant_id
  );
  const [searchQuery, setSearchQuery] = useState("");

  const { orgByTenant, orderedUnits, adminCount, clubCount } = useMemo(() => {
    const map = new Map<string, OrganizationRecord>();
    for (const org of organizations) {
      map.set(org.tenant_id, org);
    }

    const seenTenants = new Set<string>(organizations.map((o) => o.tenant_id));
    const combinedOrgs: OrganizationRecord[] = [...organizations];

    for (const catalogUnit of WSKZ_ORGANIZATIONS_CATALOG) {
      if (
        !seenTenants.has(catalogUnit.tenant_id) &&
        boards.some((b) => b.tenant_id === catalogUnit.tenant_id)
      ) {
        seenTenants.add(catalogUnit.tenant_id);
        combinedOrgs.push({
          id: `catalog-${catalogUnit.tenant_id}`,
          tenant_id: catalogUnit.tenant_id,
          form_unit_id: catalogUnit.form_unit_id,
          unit_type: catalogUnit.unit_type,
          club_number: catalogUnit.club_number,
          name: catalogUnit.name,
          full_name: catalogUnit.name,
          list_name: catalogUnit.list_name,
          short_name: catalogUnit.short_name,
          badge_code: catalogUnit.badge_code,
          email: catalogUnit.email,
          icon_name: catalogUnit.icon_name,
          emoji: catalogUnit.emoji,
          primary_hex: catalogUnit.primary_hex,
          light_bg_hex: catalogUnit.light_bg_hex,
          tailwind_accent: catalogUnit.tailwind_accent,
          crm_system: catalogUnit.crm_system,
          sort_order: catalogUnit.sort_order,
          created_at: "",
        });
      }
    }

    const units = combinedOrgs
      .map((org) => ({
        org,
        meta: resolveOrganizationMeta(org),
      }))
      .sort((a, b) => {
        const orderDiff = a.meta.sort_order - b.meta.sort_order;
        if (orderDiff !== 0) return orderDiff;
        return a.meta.list_name.localeCompare(b.meta.list_name, "pl");
      });

    return {
      orgByTenant: map,
      orderedUnits: units,
      adminCount: units.filter((u) => u.meta.unit_type === "admin").length,
      clubCount: units.filter((u) => u.meta.unit_type === "club").length,
    };
  }, [organizations, boards]);

  const visibleUnitPills = useMemo(() => {
    if (unitTypeFilter === "all") return orderedUnits;
    return orderedUnits.filter((u) => u.meta.unit_type === unitTypeFilter);
  }, [orderedUnits, unitTypeFilter]);

  const boardCountsByTenant = useMemo(() => {
    const counts = new Map<string, number>();
    for (const board of boards) {
      counts.set(board.tenant_id, (counts.get(board.tenant_id) ?? 0) + 1);
    }
    return counts;
  }, [boards]);

  const normalizedQuery = searchQuery.trim().toLocaleLowerCase("pl");

  const filteredBoards = useMemo(() => {
    const activeFilter = normalizeFilterId(selectedTenantId);

    return boards
      .filter((board) => {
        const org = orgByTenant.get(board.tenant_id);
        const meta = resolveOrganizationMeta(
          org ?? { tenant_id: board.tenant_id }
        );

        if (unitTypeFilter !== "all" && meta.unit_type !== unitTypeFilter) {
          return false;
        }

        if (
          activeFilter !== ALL_VIEWS_UNIT.tenant_id &&
          board.tenant_id !== activeFilter
        ) {
          return false;
        }

        if (!normalizedQuery) return true;

        const haystack = [
          board.title,
          board.description ?? "",
          board.access_slug,
          board.tenant_id,
          meta.form_unit_id,
          meta.name,
          meta.list_name,
          meta.short_name,
          meta.badge_code,
          meta.email ?? "",
          meta.club_number !== null ? String(meta.club_number) : "",
        ]
          .join(" ")
          .toLocaleLowerCase("pl");

        return haystack.includes(normalizedQuery);
      })
      .sort((a, b) => {
        const metaA = resolveOrganizationMeta(
          orgByTenant.get(a.tenant_id) ?? { tenant_id: a.tenant_id }
        );
        const metaB = resolveOrganizationMeta(
          orgByTenant.get(b.tenant_id) ?? { tenant_id: b.tenant_id }
        );
        const orderDiff = metaA.sort_order - metaB.sort_order;
        if (orderDiff !== 0) return orderDiff;
        return a.title.localeCompare(b.title, "pl");
      });
  }, [boards, normalizedQuery, orgByTenant, selectedTenantId, unitTypeFilter]);

  const activeAll = normalizeFilterId(selectedTenantId) === ALL_VIEWS_UNIT.tenant_id;

  const handleSelectUnitType = (nextType: "all" | "admin" | "club") => {
    setUnitTypeFilter(nextType);
    if (selectedTenantId !== ALL_VIEWS_UNIT.tenant_id && nextType !== "all") {
      const selectedMeta = resolveOrganizationMeta(
        orgByTenant.get(selectedTenantId) ?? { tenant_id: selectedTenantId }
      );
      if (selectedMeta.unit_type !== nextType) {
        setSelectedTenantId(ALL_VIEWS_UNIT.tenant_id);
      }
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-stone-900">
            Aktywne tablice jednostek wydziałowych, Samorządu i Kół Naukowych WSKZ
          </h2>
          <p className="text-xs font-medium text-stone-600">
            Spójny słownik {orderedUnits.length} jednostek z Generatora Formularzy i CRM — wybierz jednostkę lub otwórz tablicę bez logowania
          </p>
        </div>

        <search className="relative w-full sm:w-80">
          <label htmlFor="ecosystem-directory-search" className="sr-only">
            Szukaj jednostki, kodu lub adresu e-mail
          </label>
          <Search
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-stone-400"
            aria-hidden="true"
          />
          <input
            id="ecosystem-directory-search"
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Szukaj koła, kodu, e-maila lub sluga..."
            className="w-full rounded-xl border border-stone-300 bg-white py-2 pr-8 pl-9 text-xs text-stone-900 shadow-2xs placeholder:text-stone-400 focus:border-stone-900 focus:outline-none"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label="Wyczyść wyszukiwanie"
              className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1 text-stone-500 hover:bg-stone-100 hover:text-stone-900"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          ) : null}
        </search>
      </div>

      {/* Przełącznik grup ekosystemu: Wszystkie / Jednostki administracyjne / Koła Naukowe SKN 01-14 */}
      <div className="flex flex-wrap items-center gap-2">
        <div
          role="group"
          aria-label="Typ jednostki"
          className="inline-flex flex-wrap rounded-xl border border-stone-200 bg-white/90 p-1 shadow-2xs"
        >
          {[
            {
              id: "all" as const,
              label: `Wszystkie jednostki (${orderedUnits.length})`,
            },
            {
              id: "admin" as const,
              label: `Administracja i Samorząd (${adminCount})`,
            },
            {
              id: "club" as const,
              label: `Koła Naukowe SKN 01–14 (${clubCount})`,
            },
          ].map((tab) => {
            const active = unitTypeFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleSelectUnitType(tab.id)}
                aria-pressed={active}
                className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                  active
                    ? "bg-stone-900 text-white shadow-2xs"
                    : "text-stone-700 hover:bg-stone-100"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Pasek jednostek WSKZ */}
      <div
        role="region"
        aria-label="Filtruj tablice według jednostki WSKZ"
        className="flex flex-wrap gap-2"
      >
        <button
          type="button"
          onClick={() => {
            setUnitTypeFilter("all");
            setSelectedTenantId(ALL_VIEWS_UNIT.tenant_id);
          }}
          aria-pressed={activeAll && unitTypeFilter === "all"}
          style={{
            backgroundColor:
              activeAll && unitTypeFilter === "all"
                ? ALL_VIEWS_UNIT.primary_hex
                : ALL_VIEWS_UNIT.light_bg_hex,
            borderColor:
              activeAll && unitTypeFilter === "all"
                ? ALL_VIEWS_UNIT.primary_hex
                : "#CBD5E1",
            color:
              activeAll && unitTypeFilter === "all" ? "#FFFFFF" : "#0F172A",
          }}
          className="inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold shadow-2xs transition hover:brightness-97 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900"
        >
          <span aria-hidden="true">{ALL_VIEWS_UNIT.emoji}</span>
          <OrganizationIcon
            iconName={ALL_VIEWS_UNIT.icon_name}
            className="h-3.5 w-3.5 shrink-0"
          />
          <span>{ALL_VIEWS_UNIT.short_name}</span>
          <span
            className="rounded-md px-1.5 py-0.5 font-mono text-[10px] font-bold"
            style={{
              backgroundColor:
                activeAll && unitTypeFilter === "all"
                  ? "rgba(255,255,255,0.18)"
                  : "#FFFFFF",
              color:
                activeAll && unitTypeFilter === "all"
                  ? "#FFFFFF"
                  : ALL_VIEWS_UNIT.primary_hex,
            }}
          >
            {ALL_VIEWS_UNIT.badge_code} ({boards.length})
          </span>
        </button>

        {visibleUnitPills.map(({ org, meta }) => {
          const isSelected = selectedTenantId === org.tenant_id;
          const boardCount = boardCountsByTenant.get(org.tenant_id) ?? 0;

          return (
            <button
              key={org.tenant_id}
              type="button"
              onClick={() =>
                setSelectedTenantId((prev) =>
                  prev === org.tenant_id ? ALL_VIEWS_UNIT.tenant_id : org.tenant_id
                )
              }
              aria-pressed={isSelected}
              title={meta.email ? `${meta.name} (${meta.email})` : meta.name}
              style={{
                backgroundColor: meta.light_bg_hex,
                borderColor: isSelected ? meta.primary_hex : `${meta.primary_hex}3D`,
                boxShadow: isSelected
                  ? `0 0 0 2px ${meta.primary_hex}33`
                  : undefined,
                color: "#1C1917",
              }}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs shadow-2xs transition hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900 ${
                isSelected ? "font-bold" : "font-medium"
              }`}
            >
              <span aria-hidden="true">{meta.emoji}</span>
              <span style={{ color: meta.primary_hex }} className="shrink-0">
                <OrganizationIcon iconName={meta.icon_name} className="h-3.5 w-3.5" />
              </span>
              {meta.club_number !== null &&
              !meta.short_name.startsWith(String(meta.club_number).padStart(2, "0")) ? (
                <span className="font-mono text-[10px] font-bold text-stone-600">
                  {String(meta.club_number).padStart(2, "0")}
                </span>
              ) : null}
              <span>{meta.short_name}</span>
              <span
                className="rounded-md border px-1.5 py-0.5 font-mono text-[10px] font-bold"
                style={{
                  backgroundColor: "#FFFFFF",
                  borderColor: `${meta.primary_hex}45`,
                  color: "#1C1917",
                }}
              >
                {meta.badge_code}
                {boardCount > 1 ? ` · ${boardCount}` : ""}
              </span>
            </button>
          );
        })}
      </div>

      {filteredBoards.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white/85 p-8 text-center text-sm text-stone-600">
          {boards.length === 0 ? (
            <>
              Brak tablic w bazie danych. Uruchom{" "}
              <code className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-xs">
                supabase/seed.sql
              </code>{" "}
              lub zaloguj się jako Zarząd, aby utworzyć pierwszą tablicę.
            </>
          ) : (
            <div className="space-y-3">
              <p>Nie znaleziono tablic pasujących do wybranego filtra.</p>
              <button
                type="button"
                onClick={() => {
                  setUnitTypeFilter("all");
                  setSelectedTenantId(ALL_VIEWS_UNIT.tenant_id);
                  setSearchQuery("");
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-4 py-2 text-xs font-semibold text-stone-900 transition hover:bg-stone-100"
              >
                Pokaż wszystkie jednostki WSKZ
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filteredBoards.map((board) => {
            const org = orgByTenant.get(board.tenant_id);
            const meta = resolveOrganizationMeta(
              org ?? { tenant_id: board.tenant_id }
            );

            return (
              <Link
                key={board.id}
                href={`/b/${board.access_slug}`}
                style={{
                  borderTopWidth: "3px",
                  borderTopColor: meta.primary_hex,
                }}
                className="group flex flex-col justify-between rounded-2xl border border-stone-200 bg-white/95 p-5 shadow-xs transition hover:-translate-y-0.5 hover:border-stone-400 hover:shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span
                        style={{
                          backgroundColor: meta.light_bg_hex,
                          borderColor: `${meta.primary_hex}45`,
                          color: meta.primary_hex,
                        }}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border shadow-2xs"
                      >
                        <OrganizationIcon
                          iconName={meta.icon_name}
                          className="h-4.5 w-4.5"
                        />
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span aria-hidden="true" className="text-xs">
                            {meta.emoji}
                          </span>
                          <p className="truncate text-xs font-bold text-stone-800">
                            {meta.list_name}
                          </p>
                          <span
                            style={{
                              backgroundColor: meta.light_bg_hex,
                              borderColor: `${meta.primary_hex}45`,
                              color: "#1C1917",
                            }}
                            className="rounded-md border px-1.5 py-0.5 font-mono text-[10px] font-bold"
                          >
                            {meta.badge_code}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-[11px] text-stone-500">
                          {meta.name}
                          {org ? ` · ${CRM_SYSTEM_LABELS[org.crm_system]}` : ""}
                        </p>
                      </div>
                    </div>

                    {board.is_locked ? (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-900">
                        <Lock className="h-3 w-3" aria-hidden="true" />
                        <span>Tylko odczyt</span>
                      </span>
                    ) : null}
                  </div>

                  <h3 className="mt-3 text-base font-bold text-stone-950 group-hover:underline">
                    {board.title}
                  </h3>
                  {board.description ? (
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-stone-600">
                      {board.description}
                    </p>
                  ) : null}
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 pt-3 text-xs">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <code className="rounded bg-stone-100 px-2 py-0.5 font-mono text-[11px] text-stone-700">
                      /b/{board.access_slug}
                    </code>
                    {meta.email ? (
                      <span className="inline-flex items-center gap-1 truncate text-[11px] text-stone-500">
                        <Mail className="h-3 w-3 shrink-0" aria-hidden="true" />
                        <span>{meta.email}</span>
                      </span>
                    ) : null}
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1 font-semibold text-stone-900">
                    <span>Otwórz</span>
                    <ArrowRight
                      className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
