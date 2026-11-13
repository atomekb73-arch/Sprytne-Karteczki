"use client";

import { AnimatePresence } from "framer-motion";
import { Pin } from "lucide-react";
import { StickyNoteCard } from "@/components/StickyNoteCard";
import { MAX_PINNED_NOTES, type ColorLegend, type NoteColor } from "@/lib/constants";
import type { StickyNoteRecord } from "@/types/board";

interface PinnedSectionProps {
  pinnedNotes: StickyNoteRecord[];
  totalPinnedOnBoard: number;
  colorLegend: ColorLegend;
  upvotedIds: Set<string>;
  ownedNoteIds: Set<string>;
  isLocked: boolean;
  isOffline: boolean;
  canAdmin: boolean;
  selectedNoteIds: Set<string>;
  onUpvote: (noteId: string) => void;
  onToggleSelect: (noteId: string) => void;
  onTogglePin: (note: StickyNoteRecord) => void;
  onSendToCrm: (noteId: string) => void;
  onDeleteNote: (noteId: string) => void;
  onRequestMerge?: (sourceNote: StickyNoteRecord) => void;
  onOwnerEditNote: (
    noteId: string,
    payload: { content: string; authorName: string; color: NoteColor }
  ) => Promise<boolean>;
  onOwnerDeleteNote: (noteId: string) => Promise<boolean>;
}

export function PinnedSection({
  pinnedNotes,
  totalPinnedOnBoard,
  colorLegend,
  upvotedIds,
  ownedNoteIds,
  isLocked,
  isOffline,
  canAdmin,
  selectedNoteIds,
  onUpvote,
  onToggleSelect,
  onTogglePin,
  onSendToCrm,
  onDeleteNote,
  onRequestMerge,
  onOwnerEditNote,
  onOwnerDeleteNote,
}: PinnedSectionProps) {
  if (pinnedNotes.length === 0 && !canAdmin) {
    return null;
  }

  const canPinMore = totalPinnedOnBoard < MAX_PINNED_NOTES;

  return (
    <section
      aria-label="Przypięte przez Zarząd"
      className="rounded-2xl border border-stone-300/80 bg-stone-50/75 p-4 shadow-2xs"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-stone-200/90 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-stone-900 text-white">
            <Pin className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
          <h2 className="text-sm font-bold tracking-tight text-stone-900">
            Przypięte przez Zarząd
          </h2>
          <span className="rounded-full bg-stone-200/80 px-2 py-0.5 text-[11px] font-semibold text-stone-700 tabular-nums">
            {totalPinnedOnBoard} / {MAX_PINNED_NOTES}
          </span>
        </div>
        <p className="text-xs text-stone-600">
          Kluczowe tematy i komunikaty odporne na przesuwanie nowych karteczek w dół.
        </p>
      </div>

      {pinnedNotes.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <AnimatePresence mode="popLayout">
            {pinnedNotes.map((note) => (
              <StickyNoteCard
                key={note.id}
                note={note}
                colorLegend={colorLegend}
                hasUpvoted={upvotedIds.has(note.id)}
                isOwner={ownedNoteIds.has(note.id)}
                isLocked={isLocked}
                isOffline={isOffline}
                canAdmin={canAdmin}
                isSelected={selectedNoteIds.has(note.id)}
                canPinMore={canPinMore}
                onUpvote={onUpvote}
                onToggleSelect={onToggleSelect}
                onTogglePin={onTogglePin}
                onSendToCrm={onSendToCrm}
                onDeleteNote={onDeleteNote}
                onRequestMerge={onRequestMerge}
                onOwnerEditNote={onOwnerEditNote}
                onOwnerDeleteNote={onOwnerDeleteNote}
              />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-stone-300 px-4 py-4 text-center text-xs text-stone-600">
          Brak przypiętych karteczek. Kliknij „Przypnij” na wybranej karteczce poniżej (maks. 4).
        </p>
      )}
    </section>
  );
}
