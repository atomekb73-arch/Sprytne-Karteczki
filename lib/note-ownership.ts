import { OWNED_NOTES_STORAGE_KEY } from "@/lib/constants";

const OWNED_NOTES_EVENT = "wskz-owned-notes-storage";

/**
 * Generuje kryptograficznie losowy żeton właściciela przypisany wyłącznie do jednej karteczki.
 */
export function generateOwnerToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function parseOwnedNotesSnapshot(raw: string): Record<string, string> {
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }
    const clean: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === "string" && value.length >= 16) {
        clean[key] = value;
      }
    }
    return clean;
  } catch {
    return {};
  }
}

export function subscribeOwnedNotesStore(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(OWNED_NOTES_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(OWNED_NOTES_EVENT, callback);
  };
}

export function getOwnedNotesSnapshot(): string {
  try {
    return window.localStorage.getItem(OWNED_NOTES_STORAGE_KEY) ?? "{}";
  } catch {
    return "{}";
  }
}

export function saveOwnedNoteToken(noteId: string, token: string): void {
  try {
    const current = parseOwnedNotesSnapshot(getOwnedNotesSnapshot());
    current[noteId] = token;
    window.localStorage.setItem(OWNED_NOTES_STORAGE_KEY, JSON.stringify(current));
    window.dispatchEvent(new Event(OWNED_NOTES_EVENT));
  } catch {
    // Ignoruj błędy localStorage (np. tryb prywatny)
  }
}

export function removeOwnedNoteToken(noteId: string): void {
  try {
    const current = parseOwnedNotesSnapshot(getOwnedNotesSnapshot());
    if (!(noteId in current)) return;
    delete current[noteId];
    window.localStorage.setItem(OWNED_NOTES_STORAGE_KEY, JSON.stringify(current));
    window.dispatchEvent(new Event(OWNED_NOTES_EVENT));
  } catch {
    // Ignoruj błędy localStorage
  }
}
