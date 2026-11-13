"use client";

import { AnimatePresence, MotionConfig } from "framer-motion";
import { StickyNote } from "lucide-react";
import { PinnedSection } from "@/components/PinnedSection";
import { StickyNoteCard } from "@/components/StickyNoteCard";
import { MAX_PINNED_NOTES, type ColorLegend, type NoteColor } from "@/lib/constants";
import type { StickyNoteRecord } from "@/types/board";

interface BoardGridProps {
  pinnedNotes: StickyNoteRecord[];
  streamNotes: StickyNoteRecord[];
  totalNotesCount: number;
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
  onResetFilters: () => void;
}

export function BoardGrid({
  pinnedNotes,
  streamNotes,
  totalNotesCount,
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
  onResetFilters,
}: BoardGridProps) {
  const canPinMore = totalPinnedOnBoard < MAX_PINNED_NOTES;

  return (
    <MotionConfig reducedMotion="user">
      <div className="space-y-6">
        <PinnedSection
          pinnedNotes={pinnedNotes}
          totalPinnedOnBoard={totalPinnedOnBoard}
          colorLegend={colorLegend}
          upvotedIds={upvotedIds}
          ownedNoteIds={ownedNoteIds}
          isLocked={isLocked}
          isOffline={isOffline}
          canAdmin={canAdmin}
          selectedNoteIds={selectedNoteIds}
          onUpvote={onUpvote}
          onToggleSelect={onToggleSelect}
          onTogglePin={onTogglePin}
          onSendToCrm={onSendToCrm}
          onDeleteNote={onDeleteNote}
          onRequestMerge={onRequestMerge}
          onOwnerEditNote={onOwnerEditNote}
          onOwnerDeleteNote={onOwnerDeleteNote}
        />

        <section aria-label="Główny strumień karteczek (LIFO)">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-bold tracking-tight text-stone-900">
              Strumień pomysłów
            </h2>
            <p className="text-xs text-stone-600 tabular-nums">
              Wyświetlane karteczki: {streamNotes.length}
            </p>
          </div>

          {streamNotes.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <AnimatePresence mode="popLayout">
                {streamNotes.map((note, index) => (
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
                    belowFold={index >= 12}
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
            <div className="rounded-2xl border border-dashed border-stone-300 bg-white/70 px-6 py-12 text-center">
              <StickyNote className="mx-auto mb-3 h-8 w-8 text-stone-400" aria-hidden="true" />
              {totalNotesCount === 0 ? (
                <>
                  <p className="text-sm font-semibold text-stone-800">
                    Tablica czeka na pierwszy pomysł!
                  </p>
                  <p className="mt-1 text-xs text-stone-600">
                    Wpisz treść w pasku powyżej — pierwsza karteczka pojawi się w lewym górnym rogu.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold text-stone-800">
                    Brak karteczek spełniających wybrane filtry.
                  </p>
                  <button
                    type="button"
                    onClick={onResetFilters}
                    className="mt-3 rounded-lg border border-stone-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-stone-800 hover:bg-stone-50"
                  >
                    Pokaż wszystkie karteczki
                  </button>
                </>
              )}
            </div>
          )}
        </section>
      </div>
    </MotionConfig>
  );
}
