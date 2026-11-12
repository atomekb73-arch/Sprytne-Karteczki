import {
  OFFLINE_BOARD_CACHE_PREFIX,
  OFFLINE_BOARD_INDEX_KEY,
} from "@/lib/constants";
import type { BoardRecord, OrganizationRecord, StickyNoteRecord } from "@/types/board";

export interface OfflineBoardSnapshot {
  access_slug: string;
  saved_at: string;
  board: BoardRecord;
  organization: OrganizationRecord;
  notes: StickyNoteRecord[];
}

export interface OfflineBoardIndexEntry {
  access_slug: string;
  board_title: string;
  organization_name: string;
  note_count: number;
  saved_at: string;
}

export function saveOfflineBoardSnapshot(snapshot: Omit<OfflineBoardSnapshot, "saved_at">): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const fullSnapshot: OfflineBoardSnapshot = {
      ...snapshot,
      saved_at: new Date().toISOString(),
    };
    window.localStorage.setItem(
      `${OFFLINE_BOARD_CACHE_PREFIX}${snapshot.board.access_slug}`,
      JSON.stringify(fullSnapshot)
    );

    const existing = listOfflineBoards();
    const updatedEntry: OfflineBoardIndexEntry = {
      access_slug: snapshot.board.access_slug,
      board_title: snapshot.board.title,
      organization_name: snapshot.organization.name,
      note_count: snapshot.notes.length,
      saved_at: fullSnapshot.saved_at,
    };

    const nextIndex = [
      updatedEntry,
      ...existing.filter((item) => item.access_slug !== updatedEntry.access_slug),
    ].slice(0, 12);

    window.localStorage.setItem(OFFLINE_BOARD_INDEX_KEY, JSON.stringify(nextIndex));
  } catch {
    // Ignorujemy bledy limitu storage w trybie prywatnym przegladarki
  }
}

export function loadOfflineBoardSnapshot(accessSlug: string): OfflineBoardSnapshot | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(`${OFFLINE_BOARD_CACHE_PREFIX}${accessSlug}`);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as OfflineBoardSnapshot;
  } catch {
    return null;
  }
}

export function listOfflineBoards(): OfflineBoardIndexEntry[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(OFFLINE_BOARD_INDEX_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as OfflineBoardIndexEntry[]) : [];
  } catch {
    return [];
  }
}
