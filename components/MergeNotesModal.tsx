"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, ArrowRight, GitMerge, X } from "lucide-react";
import { NOTE_COLOR_THEMES, type ColorLegend } from "@/lib/constants";
import type { StickyNoteRecord } from "@/types/board";

interface MergeNotesModalProps {
  sourceNote: StickyNoteRecord | null;
  availableNotes: StickyNoteRecord[];
  colorLegend: ColorLegend;
  isOpen: boolean;
  onClose: () => void;
  onConfirmMerge: (sourceNoteId: string, targetNoteId: string) => Promise<boolean>;
}

export function MergeNotesModal({
  sourceNote,
  availableNotes,
  colorLegend,
  isOpen,
  onClose,
  onConfirmMerge,
}: MergeNotesModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [selectedTargetId, setSelectedTargetId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      setSelectedTargetId("");
      setError(null);
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isOpen]);

  if (!sourceNote) return null;

  const targetCandidates = availableNotes.filter((n) => n.id !== sourceNote.id);
  const selectedTarget = targetCandidates.find((n) => n.id === selectedTargetId);

  const handleMerge = async () => {
    if (!selectedTargetId) {
      setError("Wybierz karteczkę docelową, do której chcesz scalić ten duplikat.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const success = await onConfirmMerge(sourceNote.id, selectedTargetId);
      if (success) {
        onClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wystąpił błąd podczas scalania karteczek.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const sourceTheme = NOTE_COLOR_THEMES[sourceNote.color];

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="m-auto w-full max-w-lg rounded-2xl border border-stone-300 bg-white p-0 shadow-2xl backdrop:bg-stone-950/40 backdrop:backdrop-blur-xs"
    >
      <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-900 text-white">
            <GitMerge className="h-4 w-4" aria-hidden="true" />
          </span>
          <h2 className="text-base font-bold text-stone-900">
            Scal duplikat z inną karteczką
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Zamknij okno"
          className="rounded-lg p-1 text-stone-500 hover:bg-stone-100 hover:text-stone-900"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <div className="max-h-[75vh] space-y-4 overflow-y-auto p-5">
        <p className="text-xs leading-relaxed text-stone-600">
          Głosy (+1) oraz autor z usuwanej karteczki źródłowej zostaną dodane do wybranej karteczki docelowej.
        </p>

        {/* Karta źródłowa */}
        <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
          <span className="text-[11px] font-bold text-stone-500 uppercase">
            Karteczka źródłowa (zostanie usunięta):
          </span>
          <div
            className={`mt-2 rounded-lg border p-3 ${sourceTheme.bgClass} ${sourceTheme.borderClass}`}
          >
            <p className="text-xs font-semibold text-stone-900">
              „{sourceNote.content}”
            </p>
            <div className="mt-2 flex items-center justify-between text-[11px] text-stone-700">
              <span>Autor: {sourceNote.author_name}</span>
              <span className="font-bold">+{sourceNote.upvotes} głosów</span>
            </div>
          </div>
        </div>

        {/* Wybór docelowej */}
        <div className="space-y-2">
          <label
            htmlFor="target-note-select"
            className="block text-xs font-bold text-stone-800"
          >
            Wybierz karteczkę docelową (która zachowa treść i zsumuje głosy):
          </label>

          {targetCandidates.length === 0 ? (
            <p className="rounded-lg border border-dashed border-stone-300 p-4 text-center text-xs text-stone-500">
              Brak innych karteczek na tej tablicy do scalenia.
            </p>
          ) : (
            <div className="max-h-56 space-y-2 overflow-y-auto rounded-xl border border-stone-200 p-2">
              {targetCandidates.map((candidate) => {
                const theme = NOTE_COLOR_THEMES[candidate.color];
                const isSelected = candidate.id === selectedTargetId;
                return (
                  <button
                    key={candidate.id}
                    type="button"
                    onClick={() => setSelectedTargetId(candidate.id)}
                    className={`flex w-full cursor-pointer flex-col rounded-lg border p-2.5 text-left transition ${
                      theme.bgClass
                    } ${
                      isSelected
                        ? "border-stone-900 ring-2 ring-stone-900/30"
                        : `${theme.borderClass} opacity-85 hover:opacity-100`
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="line-clamp-2 text-xs font-semibold text-stone-900">
                        {candidate.content}
                      </span>
                      <span className="shrink-0 text-xs font-bold text-stone-900">
                        +{candidate.upvotes}
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-center justify-between text-[10px] text-stone-700">
                      <span>{candidate.author_name}</span>
                      <span className="font-medium">{colorLegend[candidate.color]}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Podsumowanie scalenia */}
        {selectedTarget ? (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50/80 p-3 text-xs text-emerald-950">
            <ArrowRight className="h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" />
            <span>
              Po scaleniu: suma głosów wyniesie{" "}
              <strong>{selectedTarget.upvotes + sourceNote.upvotes}</strong>, a autorzy:{" "}
              <strong>
                {selectedTarget.author_name === sourceNote.author_name
                  ? selectedTarget.author_name
                  : `${selectedTarget.author_name}, ${sourceNote.author_name}`}
              </strong>.
            </span>
          </div>
        ) : null}

        {error ? (
          <p
            role="alert"
            className="flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-800"
          >
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </p>
        ) : null}
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-stone-200 bg-stone-50 px-5 py-3">
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="rounded-xl border border-stone-300 bg-white px-4 py-2 text-xs font-semibold text-stone-800 hover:bg-stone-50"
        >
          Anuluj
        </button>
        <button
          type="button"
          onClick={() => void handleMerge()}
          disabled={!selectedTargetId || isSubmitting}
          className="inline-flex items-center gap-1.5 rounded-xl bg-stone-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-stone-800 disabled:opacity-50"
        >
          <GitMerge className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{isSubmitting ? "Scalanie..." : "Potwierdź scalenie"}</span>
        </button>
      </div>
    </dialog>
  );
}
