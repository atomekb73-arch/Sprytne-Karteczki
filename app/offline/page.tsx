"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import { ArrowLeft, Pin, WifiOff } from "lucide-react";
import { NOTE_COLOR_THEMES, OFFLINE_BOARD_INDEX_KEY } from "@/lib/constants";
import { OrganizationIcon } from "@/lib/icons";
import {
  loadOfflineBoardSnapshot,
  type OfflineBoardIndexEntry,
} from "@/lib/offline-cache";

function subscribeOfflineIndex(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getOfflineIndexSnapshot(): string {
  try {
    return window.localStorage.getItem(OFFLINE_BOARD_INDEX_KEY) ?? "[]";
  } catch {
    return "[]";
  }
}

export default function OfflinePage() {
  const indexRaw = useSyncExternalStore(
    subscribeOfflineIndex,
    getOfflineIndexSnapshot,
    () => "[]"
  );

  const entries = useMemo(() => {
    try {
      const parsed = JSON.parse(indexRaw);
      return Array.isArray(parsed) ? (parsed as OfflineBoardIndexEntry[]) : [];
    } catch {
      return [];
    }
  }, [indexRaw]);

  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const activeSlug = selectedSlug ?? entries[0]?.access_slug ?? null;

  const activeSnapshot = useMemo(() => {
    if (!activeSlug || typeof window === "undefined") {
      return null;
    }
    return loadOfflineBoardSnapshot(activeSlug);
  }, [activeSlug]);

  return (
    <div className="min-h-screen bg-cork-dots">
      <header className="border-b border-stone-200 bg-white/90 px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-700 hover:text-stone-950"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Wróć na stronę główną</span>
          </Link>

          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-950">
            <WifiOff className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Archiwum offline (tylko odczyt)</span>
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
        <section className="rounded-2xl border border-stone-200 bg-white/95 p-5 shadow-xs">
          <h1 className="text-lg font-extrabold text-stone-950">
            Zapisane tablice do odczytu offline
          </h1>
          <p className="mt-1 text-xs text-stone-600">
            Każda odwiedzona wcześniej tablica jest automatycznie buforowana lokalnie na tym urządzeniu.
          </p>

          {entries.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-stone-300 p-6 text-center text-sm text-stone-600">
              Brak zapisanych tablic na tym urządzeniu. Otwórz wybraną tablicę przy aktywnym internecie, aby zapisała się do odczytu offline.
            </p>
          ) : (
            <div className="mt-4 flex flex-wrap gap-2">
              {entries.map((entry) => {
                const isSelected = activeSnapshot?.access_slug === entry.access_slug;
                return (
                  <button
                    key={entry.access_slug}
                    type="button"
                    onClick={() => setSelectedSlug(entry.access_slug)}
                    className={`rounded-xl border px-3.5 py-2 text-left text-xs transition ${
                      isSelected
                        ? "border-stone-900 bg-stone-900 text-white"
                        : "border-stone-300 bg-stone-50 text-stone-800 hover:bg-stone-100"
                    }`}
                  >
                    <p className="font-bold">{entry.board_title}</p>
                    <p className="mt-0.5 opacity-80">
                      {entry.organization_name} · {entry.note_count} karteczek
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {activeSnapshot ? (
          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-stone-200 bg-white/90 px-4 py-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-stone-200 bg-stone-50">
                  <OrganizationIcon
                    iconName={activeSnapshot.organization.icon_name}
                    className="h-5 w-5 text-stone-900"
                  />
                </span>
                <div>
                  <h2 className="text-sm font-bold text-stone-950">
                    {activeSnapshot.board.title}
                  </h2>
                  <p className="text-xs text-stone-600">
                    {activeSnapshot.organization.name} · migawka z{" "}
                    {new Date(activeSnapshot.saved_at).toLocaleString("pl-PL")}
                  </p>
                </div>
              </div>

              <Link
                href={`/b/${activeSnapshot.board.access_slug}`}
                className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-800 hover:bg-stone-50"
              >
                Otwórz w widoku tablicy
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {activeSnapshot.notes.map((note) => {
                const theme = NOTE_COLOR_THEMES[note.color];
                return (
                  <article
                    key={note.id}
                    style={{
                      backgroundColor: theme.hex,
                      transform: `rotate(${note.rotation_deg}deg)`,
                    }}
                    className={`sticky-note-paper rounded-sm border p-4 text-stone-900 ${theme.borderClass}`}
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="rounded border border-black/15 bg-black/5 px-1.5 py-0.5 text-[10px] font-semibold">
                        {activeSnapshot.board.color_legend[note.color]}
                      </span>
                      {note.is_pinned ? (
                        <Pin className="h-3.5 w-3.5 text-stone-900" aria-label="Przypięta" />
                      ) : null}
                    </div>
                    <p className="text-sm leading-relaxed font-medium whitespace-pre-wrap break-words">
                      {note.content}
                    </p>
                    <div className="mt-3 flex items-center justify-between border-t border-black/10 pt-2 text-xs font-semibold">
                      <span>{note.author_name}</span>
                      <span>+1 ({note.upvotes})</span>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}
