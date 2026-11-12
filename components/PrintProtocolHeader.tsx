"use client";

import {
  CRM_SYSTEM_LABELS,
  NOTE_COLORS,
  NOTE_COLOR_THEMES,
} from "@/lib/constants";
import { OrganizationIcon } from "@/lib/icons";
import { resolveOrganizationMeta } from "@/lib/organizations";
import type { BoardRecord, OrganizationRecord, StickyNoteRecord } from "@/types/board";

interface PrintProtocolHeaderProps {
  board: BoardRecord;
  organization: OrganizationRecord;
  notes: StickyNoteRecord[];
  pinnedCount: number;
  crmCount: number;
  generatedAtLabel: string;
}

export function PrintProtocolHeader({
  board,
  organization,
  notes,
  pinnedCount,
  crmCount,
  generatedAtLabel,
}: PrintProtocolHeaderProps) {
  const orgMeta = resolveOrganizationMeta(organization);

  return (
    <header className="print-only mb-6 hidden border-b-2 border-stone-900 pb-4 text-stone-900">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div
            style={{
              backgroundColor: orgMeta.light_bg_hex,
              borderColor: orgMeta.primary_hex,
              color: orgMeta.primary_hex,
            }}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border"
          >
            <OrganizationIcon
              iconName={orgMeta.icon_name}
              className="h-6 w-6"
            />
          </div>
          <div>
            <p className="text-[10px] font-bold tracking-widest text-stone-600 uppercase">
              Wyższa Szkoła Kształcenia Zawodowego — Załącznik do protokołu z posiedzenia
            </p>
            <h1 className="text-xl font-bold text-stone-950">{board.title}</h1>
            <p className="text-sm font-semibold text-stone-800">
              <span aria-hidden="true" className="mr-1">
                {orgMeta.emoji}
              </span>
              {orgMeta.list_name}
              {orgMeta.name !== orgMeta.list_name ? ` — ${orgMeta.name}` : ""}{" "}
              <span
                style={{
                  backgroundColor: orgMeta.light_bg_hex,
                  borderColor: `${orgMeta.primary_hex}55`,
                  color: "#1C1917",
                }}
                className="mr-1 inline-block rounded border px-1.5 py-0.2 font-mono text-[10px] font-bold"
              >
                {orgMeta.badge_code}
              </span>
              <span className="font-mono text-xs font-normal text-stone-600">
                ({organization.tenant_id})
              </span>
            </p>
            {orgMeta.email ? (
              <p className="text-[11px] text-stone-600">
                Kontakt jednostki: {orgMeta.email}
              </p>
            ) : null}
          </div>
        </div>

        <div className="text-right text-xs text-stone-700">
          <p>
            <span className="font-semibold">Data wygenerowania:</span>{" "}
            {generatedAtLabel}
          </p>
          <p>
            <span className="font-semibold">System docelowy:</span>{" "}
            {CRM_SYSTEM_LABELS[organization.crm_system]}
          </p>
          <p className="mt-1 font-medium">
            Łącznie karteczek: {notes.length} · Przypięte: {pinnedCount} · W CRM:{" "}
            {crmCount}
          </p>
        </div>
      </div>

      {board.description ? (
        <p className="mt-2 text-xs text-stone-700">{board.description}</p>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-3 border-t border-stone-300 pt-2.5">
        {NOTE_COLORS.map((color) => {
          const theme = NOTE_COLOR_THEMES[color];
          return (
            <div key={color} className="inline-flex items-center gap-1.5 text-[11px]">
              <span
                className="inline-block h-3 w-3 rounded-xs border"
                style={{
                  backgroundColor: theme.printBg,
                  borderColor: theme.printBorder,
                }}
                aria-hidden="true"
              />
              <span className="font-medium text-stone-800">
                {board.color_legend[color]}
              </span>
            </div>
          );
        })}
      </div>
    </header>
  );
}
