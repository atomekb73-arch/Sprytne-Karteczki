import type { OrganizationRecord, StickyNoteRecord } from "@/types/board";
import { normalizeColorLegend, type ColorLegend } from "@/lib/constants";

function formatLocalDateStamp(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatNoteStatus(note: StickyNoteRecord): string {
  const parts: string[] = [];
  if (note.is_pinned) {
    parts.push("Przypięta");
  }
  if (note.sent_to_crm) {
    parts.push("W realizacji CRM");
  }
  return parts.length > 0 ? parts.join(" / ") : "Aktywna";
}

function formatPolishDateTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat("pl-PL", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function sanitizeFileSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "") || "wskz";
}

export async function exportStickyNotesToXlsx({
  notes,
  organization,
  colorLegend,
  boardTitle,
}: {
  notes: StickyNoteRecord[];
  organization: OrganizationRecord;
  colorLegend: ColorLegend;
  boardTitle: string;
}): Promise<string> {
  const XLSX = await import("xlsx");
  const legend = normalizeColorLegend(colorLegend);

  const rows = notes.map((note) => ({
    Kategoria: legend[note.color],
    "Treść": note.content,
    Autor: note.author_name,
    "Liczba głosów": note.upvotes,
    Status: formatNoteStatus(note),
    "Data dodania": formatPolishDateTime(note.created_at),
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet["!cols"] = [
    { wch: 34 },
    { wch: 64 },
    { wch: 24 },
    { wch: 16 },
    { wch: 26 },
    { wch: 20 },
  ];

  const workbook = XLSX.utils.book_new();
  const safeSheetName = boardTitle.slice(0, 28) || "Karteczki WSKZ";
  XLSX.utils.book_append_sheet(workbook, worksheet, safeSheetName);

  const tenantSegment = sanitizeFileSegment(organization.tenant_id);
  const dateStamp = formatLocalDateStamp();
  const fileName = `Karteczki_${tenantSegment}_${dateStamp}.xlsx`;

  XLSX.writeFile(workbook, fileName);
  return fileName;
}
