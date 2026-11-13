"use client";

import { motion } from "framer-motion";
import { Check, GitMerge, Pencil, Pin, PinOff, Send, ThumbsUp, Trash2 } from "lucide-react";
import { useId, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import {
  MAX_AUTHOR_LENGTH,
  MAX_NOTE_CONTENT_LENGTH,
  NOTE_COLORS,
  NOTE_COLOR_THEMES,
  type ColorLegend,
  type NoteColor,
} from "@/lib/constants";
import type { StickyNoteRecord } from "@/types/board";

interface StickyNoteCardProps {
  note: StickyNoteRecord;
  colorLegend: ColorLegend;
  hasUpvoted: boolean;
  isLocked: boolean;
  isOffline: boolean;
  canAdmin: boolean;
  isOwner: boolean;
  isSelected: boolean;
  canPinMore: boolean;
  belowFold?: boolean;
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

function formatShortDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("pl-PL", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

export function StickyNoteCard({
  note,
  colorLegend,
  hasUpvoted,
  isLocked,
  isOffline,
  canAdmin,
  isOwner,
  isSelected,
  canPinMore,
  belowFold = false,
  onUpvote,
  onToggleSelect,
  onTogglePin,
  onSendToCrm,
  onDeleteNote,
  onRequestMerge,
  onOwnerEditNote,
  onOwnerDeleteNote,
}: StickyNoteCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(note.content);
  const [editAuthor, setEditAuthor] = useState(note.author_name);
  const [editColor, setEditColor] = useState<NoteColor>(note.color);
  const [editError, setEditError] = useState<string | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeletingOwn, setIsDeletingOwn] = useState(false);

  const editTextareaRef = useRef<HTMLTextAreaElement>(null);
  const editColorGroupName = useId();
  const editContentId = useId();
  const editAuthorId = useId();
  const editErrorId = useId();

  const displayedColor = isEditing ? editColor : note.color;
  const theme = NOTE_COLOR_THEMES[displayedColor];
  const categoryLabel = colorLegend[displayedColor];
  const ownerActionsBlocked = isLocked || isOffline;

  const startEditing = () => {
    if (!isOwner || ownerActionsBlocked) return;
    setEditContent(note.content);
    setEditAuthor(note.author_name);
    setEditColor(note.color);
    setEditError(null);
    setIsConfirmingDelete(false);
    setIsEditing(true);
    window.requestAnimationFrame(() => {
      editTextareaRef.current?.focus();
    });
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditError(null);
  };

  const submitEdit = async () => {
    const trimmed = editContent.trim();
    if (!trimmed) {
      setEditError("Treść karteczki nie może być pusta.");
      editTextareaRef.current?.focus();
      return;
    }
    if (trimmed.length > MAX_NOTE_CONTENT_LENGTH) {
      setEditError(`Treść nie może przekraczać ${MAX_NOTE_CONTENT_LENGTH} znaków.`);
      editTextareaRef.current?.focus();
      return;
    }

    setIsSavingEdit(true);
    try {
      const ok = await onOwnerEditNote(note.id, {
        content: trimmed,
        authorName: editAuthor.trim() || "Anonimowy Student",
        color: editColor,
      });
      if (ok) {
        setIsEditing(false);
        setEditError(null);
      }
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleEditFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await submitEdit();
  };

  const handleEditTextareaKeyDown = async (
    event: KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (
      !event.nativeEvent.isComposing &&
      event.keyCode !== 229 &&
      event.key === "Enter" &&
      (event.ctrlKey || event.metaKey)
    ) {
      event.preventDefault();
      await submitEdit();
    } else if (event.key === "Escape") {
      event.preventDefault();
      cancelEditing();
    }
  };

  const handleConfirmOwnerDelete = async () => {
    if (!isOwner || ownerActionsBlocked) return;
    setIsDeletingOwn(true);
    try {
      const deleted = await onOwnerDeleteNote(note.id);
      if (deleted) {
        setIsConfirmingDelete(false);
      }
    } finally {
      setIsDeletingOwn(false);
    }
  };

  return (
    <motion.article
      layout="position"
      initial={{ opacity: 0, y: -12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className={belowFold ? "note-deferred h-full min-w-0" : "h-full min-w-0"}
    >
      <div
        style={{
          transform: `rotate(${isEditing ? 0 : note.rotation_deg}deg)`,
          backgroundColor: theme.hex,
        }}
        className={`sticky-note-paper sticky-note-curl group relative flex h-full min-h-[215px] flex-col justify-between rounded-sm border p-4 pt-5 text-stone-900 shadow-md transition-all hover:shadow-lg ${
          theme.borderClass
        } ${isSelected ? "ring-2 ring-stone-950 ring-offset-2 ring-offset-stone-100" : ""}`}
      >
        {/* Pasek kleju / półprzezroczysta taśma u góry karteczki */}
        <span
          aria-hidden="true"
          className={`no-print pointer-events-none absolute -top-2 left-1/2 h-4 w-20 -translate-x-1/2 rounded-xs ${theme.tapeClass} backdrop-blur-[1px]`}
        />

        <div>
          {/* Górny pasek: kategoria, przypięcie, status własny i checkbox wyboru (Admin) */}
          <div className="mb-2.5 flex items-start justify-between gap-2">
            <span
              className={`inline-block max-w-[78%] rounded-md border px-2 py-0.5 text-[11px] leading-tight font-semibold ${theme.chipClass}`}
            >
              {categoryLabel}
            </span>

            <div className="no-print flex shrink-0 items-center gap-1">
              {isOwner ? (
                <span
                  title="Karteczka utworzona w tej przeglądarce — możesz ją edytować lub usunąć"
                  className="inline-flex items-center rounded-full border border-stone-900/20 bg-white/75 px-1.5 py-0.5 text-[10px] font-bold text-stone-900"
                >
                  Twoja
                </span>
              ) : null}

              {note.is_pinned ? (
                <span
                  title="Przypięta przez Zarząd"
                  className="inline-flex items-center gap-0.5 rounded-full bg-stone-900 px-1.5 py-0.5 text-[10px] font-bold text-white"
                >
                  <Pin className="h-2.5 w-2.5" aria-hidden="true" />
                  <span>ZARZĄD</span>
                </span>
              ) : null}

              {canAdmin ? (
                <label className="inline-flex cursor-pointer items-center justify-center rounded p-0.5 hover:bg-black/10">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggleSelect(note.id)}
                    aria-label={`Zaznacz karteczkę autora ${note.author_name}`}
                    className="h-4 w-4 rounded border-stone-700 accent-stone-900"
                  />
                </label>
              ) : null}
            </div>
          </div>

          {/* Wyraźny zielony stempel CRM */}
          {note.sent_to_crm ? (
            <div className="mb-2">
              <span className="inline-flex items-center gap-1 rounded-sm border-2 border-emerald-800/80 bg-emerald-100/90 px-2 py-0.5 text-[10px] font-black tracking-wider text-emerald-900 uppercase shadow-2xs">
                <Check className="h-3 w-3 stroke-[2.75]" aria-hidden="true" />
                <span>W REALIZACJI (CRM)</span>
              </span>
            </div>
          ) : null}

          {isEditing ? (
            <form onSubmit={handleEditFormSubmit} noValidate className="no-print space-y-2.5">
              <fieldset disabled={isSavingEdit} className="space-y-1">
                <legend className="text-[11px] font-semibold text-stone-800">
                  Kolor kategorii
                </legend>
                <div className="flex flex-wrap items-center gap-1.5">
                  {NOTE_COLORS.map((color) => {
                    const optionTheme = NOTE_COLOR_THEMES[color];
                    const selected = editColor === color;
                    return (
                      <label
                        key={color}
                        title={colorLegend[color]}
                        className={`relative flex h-6 w-6 cursor-pointer items-center justify-center rounded-full border transition ${
                          optionTheme.bgClass
                        } ${
                          selected
                            ? "scale-110 border-stone-900 ring-2 ring-stone-900/25"
                            : "border-stone-500/70 hover:scale-105"
                        }`}
                      >
                        <input
                          type="radio"
                          name={editColorGroupName}
                          value={color}
                          checked={selected}
                          onChange={() => setEditColor(color)}
                          aria-label={colorLegend[color]}
                          className="sr-only"
                        />
                        {selected ? (
                          <Check className="h-3 w-3 stroke-[2.5] text-stone-900" aria-hidden="true" />
                        ) : null}
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              <div>
                <div className="mb-1 flex items-center justify-between gap-2">
                  <label
                    htmlFor={editContentId}
                    className="text-[11px] font-semibold text-stone-800"
                  >
                    Treść karteczki
                  </label>
                  <span className="font-mono text-[10px] font-semibold text-stone-700 tabular-nums">
                    {editContent.length}/{MAX_NOTE_CONTENT_LENGTH}
                  </span>
                </div>
                <textarea
                  ref={editTextareaRef}
                  id={editContentId}
                  name="content"
                  rows={4}
                  maxLength={MAX_NOTE_CONTENT_LENGTH}
                  required
                  value={editContent}
                  onChange={(event) => {
                    const next = event.target.value.slice(0, MAX_NOTE_CONTENT_LENGTH);
                    setEditContent(next);
                    if (editError && next.trim().length > 0) {
                      setEditError(null);
                    }
                  }}
                  onKeyDown={handleEditTextareaKeyDown}
                  aria-invalid={editError !== null}
                  aria-describedby={editError ? editErrorId : undefined}
                  className="w-full resize-y rounded-lg border border-black/25 bg-white/85 px-2.5 py-2 text-xs leading-relaxed font-medium text-stone-900 focus:border-stone-900 focus:outline-none"
                />
                {editError ? (
                  <p
                    id={editErrorId}
                    role="alert"
                    className="mt-1 text-[11px] font-semibold text-rose-800"
                  >
                    {editError}
                  </p>
                ) : null}
              </div>

              <div>
                <label
                  htmlFor={editAuthorId}
                  className="mb-1 block text-[11px] font-semibold text-stone-800"
                >
                  Podpis / Imię
                </label>
                <input
                  id={editAuthorId}
                  name="authorName"
                  type="text"
                  maxLength={MAX_AUTHOR_LENGTH}
                  autoComplete="name"
                  value={editAuthor}
                  onChange={(event) =>
                    setEditAuthor(event.target.value.slice(0, MAX_AUTHOR_LENGTH))
                  }
                  className="w-full rounded-lg border border-black/25 bg-white/85 px-2.5 py-1.5 text-xs font-medium text-stone-900 focus:border-stone-900 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={cancelEditing}
                  disabled={isSavingEdit}
                  className="rounded-md border border-black/20 bg-white/80 px-2.5 py-1 text-[11px] font-semibold text-stone-800 transition hover:bg-white disabled:opacity-50"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="rounded-md bg-stone-900 px-3 py-1 text-[11px] font-semibold text-white transition hover:bg-stone-800 disabled:opacity-50"
                >
                  {isSavingEdit ? "Zapisywanie..." : "Zapisz zmiany"}
                </button>
              </div>
            </form>
          ) : (
            <p className="text-sm leading-relaxed font-medium whitespace-pre-wrap break-words text-stone-900">
              {note.content}
            </p>
          )}
        </div>

        {/* Stopka: autor, data, +1 Popieram, akcje twórcy oraz narzędzia Zarządu */}
        <footer className="mt-4 space-y-2 border-t border-black/10 pt-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-stone-900">
                {note.author_name}
              </p>
              <time
                dateTime={note.created_at}
                className="block text-[11px] font-medium text-stone-700"
              >
                {formatShortDate(note.created_at)}
              </time>
            </div>

            <button
              type="button"
              onClick={() => onUpvote(note.id)}
              disabled={hasUpvoted || isLocked || isOffline || isEditing}
              aria-pressed={hasUpvoted}
              title={
                hasUpvoted
                  ? "Już poparłeś/aś tę karteczkę"
                  : isLocked
                    ? "Tablica zablokowana"
                    : "Poprzyj pomysł (+1)"
              }
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold tabular-nums transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900 ${
                hasUpvoted
                  ? "border-stone-900 bg-stone-900 text-white"
                  : "border-black/20 bg-white/70 text-stone-900 hover:bg-white"
              } disabled:cursor-not-allowed disabled:opacity-75`}
            >
              <ThumbsUp className="h-3 w-3 shrink-0" aria-hidden="true" />
              <span>+1</span>
              <span className="sr-only">Popieram</span>
              <span>({note.upvotes})</span>
            </button>
          </div>

          {isOwner && !isEditing ? (
            <div className="no-print border-t border-black/10 pt-2">
              {isConfirmingDelete ? (
                <div
                  role="region"
                  aria-label="Potwierdzenie usunięcia własnej karteczki"
                  className="flex flex-wrap items-center justify-between gap-1.5 rounded-md border border-rose-900/25 bg-rose-50/95 px-2 py-1.5"
                >
                  <span className="text-[11px] font-semibold text-rose-950">
                    Usunąć Twoją karteczkę?
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setIsConfirmingDelete(false)}
                      disabled={isDeletingOwn}
                      className="rounded border border-stone-300 bg-white px-2 py-0.5 text-[11px] font-semibold text-stone-800 hover:bg-stone-50"
                    >
                      Anuluj
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleConfirmOwnerDelete()}
                      disabled={isDeletingOwn}
                      className="rounded bg-rose-700 px-2 py-0.5 text-[11px] font-semibold text-white hover:bg-rose-800 disabled:opacity-60"
                    >
                      {isDeletingOwn ? "Usuwanie..." : "Potwierdź"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={startEditing}
                    disabled={ownerActionsBlocked}
                    aria-label="Edytuj własną karteczkę"
                    title={
                      ownerActionsBlocked
                        ? "Edycja niedostępna (tablica zablokowana lub offline)"
                        : "Popraw treść, kolor lub podpis własnej karteczki"
                    }
                    className="inline-flex items-center gap-1 rounded-md border border-black/15 bg-white/75 px-2 py-1 text-[11px] font-semibold text-stone-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    <Pencil className="h-3 w-3" aria-hidden="true" />
                    <span>Edytuj</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsConfirmingDelete(true)}
                    disabled={ownerActionsBlocked}
                    aria-label="Usuń własną karteczkę"
                    title={
                      ownerActionsBlocked
                        ? "Usuwanie niedostępne (tablica zablokowana lub offline)"
                        : "Usuń własną karteczkę"
                    }
                    className="inline-flex items-center gap-1 rounded-md border border-rose-900/20 bg-rose-50/90 px-2 py-1 text-[11px] font-semibold text-rose-900 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    <Trash2 className="h-3 w-3" aria-hidden="true" />
                    <span>Usuń</span>
                  </button>
                </div>
              )}
            </div>
          ) : null}

          {canAdmin ? (
            <div className="no-print flex flex-wrap items-center justify-between gap-1.5 border-t border-black/10 pt-2">
              <button
                type="button"
                onClick={() => onTogglePin(note)}
                disabled={!note.is_pinned && !canPinMore}
                title={
                  note.is_pinned
                    ? "Odepnij karteczkę ze strefy Zarządu"
                    : canPinMore
                      ? "Przypnij do strefy Zarządu (maks. 4)"
                      : "Osiągnięto limit 4 przypiętych karteczek"
                }
                className="inline-flex items-center gap-1 rounded-md border border-black/15 bg-white/65 px-2 py-1 text-[11px] font-semibold text-stone-900 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-45"
              >
                {note.is_pinned ? (
                  <>
                    <PinOff className="h-3 w-3" aria-hidden="true" />
                    <span>Odepnij</span>
                  </>
                ) : (
                  <>
                    <Pin className="h-3 w-3" aria-hidden="true" />
                    <span>Przypnij</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-1">
                {onRequestMerge ? (
                  <button
                    type="button"
                    onClick={() => onRequestMerge(note)}
                    aria-label="Scal duplikat z inną karteczką"
                    title="Scal tę karteczkę z inną (połącz głosy i autorów)"
                    className="inline-flex items-center gap-1 rounded-md border border-stone-300 bg-white/90 px-2 py-1 text-[11px] font-semibold text-stone-800 transition hover:bg-stone-100"
                  >
                    <GitMerge className="h-3 w-3 text-stone-700" aria-hidden="true" />
                    <span>Scal</span>
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={() => onSendToCrm(note.id)}
                  title={
                    note.sent_to_crm
                      ? "Wyślij aktualizację ponownie do CRM"
                      : "Wyślij do CRM"
                  }
                  className="inline-flex items-center gap-1 rounded-md border border-emerald-900/25 bg-emerald-50/90 px-2 py-1 text-[11px] font-semibold text-emerald-950 transition hover:bg-emerald-100"
                >
                  <Send className="h-3 w-3" aria-hidden="true" />
                  <span>{note.sent_to_crm ? "Ponów CRM" : "Wyślij do CRM"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onDeleteNote(note.id)}
                  aria-label="Usuń karteczkę jako administrator"
                  title="Usuń karteczkę jako Zarząd (np. duplikat)"
                  className="inline-flex items-center justify-center rounded-md border border-rose-900/20 bg-rose-50/90 p-1 text-rose-900 transition hover:bg-rose-100"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          ) : null}
        </footer>
      </div>
    </motion.article>
  );
}
