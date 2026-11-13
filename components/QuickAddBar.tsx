"use client";

import { useId, useRef, useState, useSyncExternalStore, type FormEvent, type KeyboardEvent } from "react";
import { AlertCircle, Check, Info, Lock, PlusCircle, ShieldAlert, ThumbsUp } from "lucide-react";
import {
  AUTHOR_STORAGE_KEY,
  MAX_AUTHOR_LENGTH,
  MAX_NOTE_CONTENT_LENGTH,
  NOTE_COLORS,
  NOTE_COLOR_THEMES,
  RODO_CLAUSE,
  type ColorLegend,
  type NoteColor,
} from "@/lib/constants";
import { findSimilarItem } from "@/lib/duplicate-detector";
import type { StickyNoteRecord } from "@/types/board";

interface QuickAddBarProps {
  colorLegend: ColorLegend;
  isLocked: boolean;
  isOffline: boolean;
  existingNotes?: StickyNoteRecord[];
  onUpvoteNote?: (noteId: string) => void;
  onAddNote: (payload: {
    content: string;
    authorName: string;
    color: NoteColor;
  }) => Promise<boolean>;
}

const AUTHOR_EVENT = "wskz-author-storage";

function subscribeAuthorStore(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(AUTHOR_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(AUTHOR_EVENT, callback);
  };
}

function getAuthorSnapshot(): string {
  try {
    return (window.localStorage.getItem(AUTHOR_STORAGE_KEY) ?? "").slice(
      0,
      MAX_AUTHOR_LENGTH
    );
  } catch {
    return "";
  }
}

export function QuickAddBar({
  colorLegend,
  isLocked,
  isOffline,
  existingNotes = [],
  onUpvoteNote,
  onAddNote,
}: QuickAddBarProps) {
  const [selectedColor, setSelectedColor] = useState<NoteColor>("yellow");
  const [content, setContent] = useState("");
  const storedAuthor = useSyncExternalStore(
    subscribeAuthorStore,
    getAuthorSnapshot,
    () => ""
  );
  const [draftAuthor, setDraftAuthor] = useState<string | null>(null);
  const authorName = draftAuthor ?? storedAuthor;

  const [touchedContent, setTouchedContent] = useState(false);
  const [contentError, setContentError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Ochrona przed podwójnym wysłaniem (Anti-Double-Submit)
  const lastSubmissionRef = useRef<{
    contentNormalized: string;
    authorNormalized: string;
    timestamp: number;
  } | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const authorInputRef = useRef<HTMLInputElement>(null);
  const colorGroupName = useId();
  const contentId = useId();
  const authorId = useId();
  const errorId = useId();

  // Wykrywanie podobnej karteczki na żywo
  const similarMatch = findSimilarItem(content, existingNotes);

  const handleAuthorChange = (nextValue: string) => {
    const trimmedMax = nextValue.slice(0, MAX_AUTHOR_LENGTH);
    setDraftAuthor(trimmedMax);
    try {
      window.localStorage.setItem(AUTHOR_STORAGE_KEY, trimmedMax);
      window.dispatchEvent(new Event(AUTHOR_EVENT));
    } catch {
      // Brak dostepu do localStorage
    }
  };

  const validateContent = (raw: string): string | null => {
    const trimmed = raw.trim();
    if (!trimmed) {
      return "Wpisz treść pomysłu przed przyklejeniem karteczki.";
    }
    if (trimmed.length > MAX_NOTE_CONTENT_LENGTH) {
      return `Treść nie może przekraczać ${MAX_NOTE_CONTENT_LENGTH} znaków.`;
    }
    return null;
  };

  const handleContentChange = (nextValue: string) => {
    const capped = nextValue.slice(0, MAX_NOTE_CONTENT_LENGTH);
    setContent(capped);
    if (contentError && validateContent(capped) === null) {
      setContentError(null);
    }
    if (submitError) {
      setSubmitError(null);
    }
  };

  const submitForm = async () => {
    if (isSubmitting) return;

    if (isLocked) {
      setSubmitError("Tablica jest obecnie w trybie tylko do odczytu.");
      return;
    }
    if (isOffline) {
      setSubmitError("Jesteś offline — dodawanie karteczek wymaga połączenia z siecią.");
      return;
    }

    const validationMessage = validateContent(content);
    if (validationMessage) {
      setTouchedContent(true);
      setContentError(validationMessage);
      textareaRef.current?.focus();
      return;
    }

    const cleanAuthor = authorName.trim() || "Anonimowy Student";
    const cleanContent = content.trim();

    // Blokada ponownego wysłania identycznego tekstu przez tego samego autora w ciągu 60 sekund
    const now = Date.now();
    if (
      lastSubmissionRef.current &&
      lastSubmissionRef.current.contentNormalized === cleanContent.toLowerCase() &&
      lastSubmissionRef.current.authorNormalized === cleanAuthor.toLowerCase() &&
      now - lastSubmissionRef.current.timestamp < 60000
    ) {
      setSubmitError(
        "Identyczna karteczka została już dodana przed chwilą. Odczekaj 60 sekund przed powtórzeniem."
      );
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      try {
        if (authorName.trim()) {
          window.localStorage.setItem(AUTHOR_STORAGE_KEY, authorName.trim());
        }
      } catch {
        // Ignoruj bledy localStorage
      }

      const ok = await onAddNote({
        content: cleanContent,
        authorName: cleanAuthor,
        color: selectedColor,
      });

      if (ok) {
        lastSubmissionRef.current = {
          contentNormalized: cleanContent.toLowerCase(),
          authorNormalized: cleanAuthor.toLowerCase(),
          timestamp: Date.now(),
        };
        setContent("");
        setTouchedContent(false);
        setContentError(null);
        textareaRef.current?.focus();
      }
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Nie udało się dodać karteczki."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await submitForm();
  };

  const handleTextareaKeyDown = async (event: KeyboardEvent<HTMLTextAreaElement>) => {
    // IME-safe shortcut submit (Ctrl+Enter / Cmd+Enter)
    if (
      !event.nativeEvent.isComposing &&
      event.keyCode !== 229 &&
      event.key === "Enter" &&
      (event.ctrlKey || event.metaKey)
    ) {
      event.preventDefault();
      await submitForm();
    }
  };

  const remainingChars = MAX_NOTE_CONTENT_LENGTH - content.length;
  const activeTheme = NOTE_COLOR_THEMES[selectedColor];

  return (
    <section
      aria-label="Pasek szybkiego dodawania karteczki"
      className="no-print relative z-20 rounded-2xl border border-stone-300/90 bg-white/95 p-3.5 shadow-md backdrop-blur-md sm:p-5 md:sticky md:top-3 lg:p-6"
    >
      {isLocked ? (
        <div
          role="status"
          className="mb-2.5 flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-950 sm:mb-3"
        >
          <Lock className="h-4 w-4 shrink-0 text-amber-700" aria-hidden="true" />
          <span>
            Tablica jest obecnie zamknięta przez Zarząd (tryb tylko do odczytu). Nowe karteczki są wstrzymane.
          </span>
        </div>
      ) : null}

      <form onSubmit={handleFormSubmit} noValidate className="space-y-2.5 sm:space-y-3 lg:space-y-4">
        <div className="flex flex-col gap-2.5 sm:gap-3 lg:flex-row lg:items-start lg:gap-4">
          {/* Kolumna 1: Kolory + kategoria z legendy + autor (na mobile w jednym wierszu flex-row, na lg: flex-col) */}
          <div className="flex flex-row items-start justify-between gap-2.5 sm:gap-4 lg:w-80 lg:shrink-0 lg:flex-col lg:gap-2.5">
            {/* Lewa strona: Kolor i pigułka kategorii */}
            <fieldset disabled={isLocked || isSubmitting} className="min-w-0 flex-1 space-y-1 sm:space-y-1.5 lg:w-full">
              <legend className="text-xs font-semibold text-stone-700">
                <span className="sm:hidden">1. Kolor</span>
                <span className="hidden sm:inline">1. Wybierz kolor</span>
                <span className="hidden lg:inline"> (kategoria z legendy)</span>
              </legend>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                {NOTE_COLORS.map((color) => {
                  const theme = NOTE_COLOR_THEMES[color];
                  const isSelected = selectedColor === color;
                  const label = colorLegend[color];
                  return (
                    <label
                      key={color}
                      title={label}
                      className={`relative flex h-7 w-7 sm:h-8 sm:h-8 lg:h-9 lg:w-9 cursor-pointer items-center justify-center rounded-full border-2 transition-transform ${
                        theme.bgClass
                      } ${
                        isSelected
                          ? "scale-105 border-stone-900 shadow-sm ring-2 ring-stone-900/20"
                          : "border-stone-400/70 hover:scale-105"
                      }`}
                    >
                      <input
                        type="radio"
                        name={colorGroupName}
                        value={color}
                        checked={isSelected}
                        onChange={() => setSelectedColor(color)}
                        aria-label={label}
                        className="sr-only"
                      />
                      {isSelected ? (
                        <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 stroke-[2.5] text-stone-900" aria-hidden="true" />
                      ) : null}
                    </label>
                  );
                })}
              </div>
              <p
                aria-live="polite"
                className={`inline-flex max-w-full items-center gap-1.5 truncate rounded-lg border px-2 py-0.5 sm:px-2.5 sm:py-1 text-[11px] sm:text-xs font-medium text-stone-900 ${activeTheme.bgClass} ${activeTheme.borderClass}`}
              >
                <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 shrink-0 rounded-full bg-stone-900/60" aria-hidden="true" />
                <span className="truncate">{colorLegend[selectedColor]}</span>
              </p>
            </fieldset>

            {/* Prawa strona na mobile / dół na lg: Podpis / Imię */}
            <div className="shrink-0 lg:w-full">
              <label
                htmlFor={authorId}
                className="mb-1 block text-xs font-semibold text-stone-700"
              >
                <span className="lg:hidden">Podpis / Imię</span>
                <span className="hidden lg:inline">Twój podpis / Imię</span>
              </label>
              <input
                ref={authorInputRef}
                id={authorId}
                type="text"
                value={authorName}
                onChange={(e) => handleAuthorChange(e.target.value)}
                disabled={isLocked || isSubmitting}
                maxLength={MAX_AUTHOR_LENGTH}
                placeholder="np. Anna K."
                autoComplete="name"
                className="h-8 w-32 rounded-xl border border-stone-300 bg-stone-50/70 px-2.5 py-1 text-xs text-stone-900 placeholder:text-stone-400 focus:border-stone-900 focus:bg-white focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 sm:h-9 sm:w-48 sm:px-3 sm:py-1.5 sm:text-sm md:w-56 lg:h-auto lg:w-full lg:px-3 lg:py-2"
              />
            </div>
          </div>

          {/* Kolumna 2: Tresc karteczki (limit 400) + przycisk */}
          <div className="flex flex-1 flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor={contentId} className="text-xs font-semibold text-stone-700">
                2. Treść pomysłu lub uwagi (LIFO — nowa pojawi się pierwsza u góry)
              </label>
              <span
                className={`text-xs font-semibold tabular-nums ${
                  remainingChars <= 30 ? "text-rose-700" : "text-stone-500"
                }`}
              >
                {content.length}/{MAX_NOTE_CONTENT_LENGTH}
              </span>
            </div>

            <div className="flex flex-col gap-2.5 sm:flex-row sm:items-stretch">
              <div className="flex-1">
                <textarea
                  ref={textareaRef}
                  id={contentId}
                  rows={3}
                  maxLength={MAX_NOTE_CONTENT_LENGTH}
                  value={content}
                  disabled={isLocked || isSubmitting}
                  onChange={(e) => handleContentChange(e.target.value)}
                  onBlur={() => {
                    if (content.length > 0 || touchedContent) {
                      setTouchedContent(true);
                      setContentError(validateContent(content));
                    }
                  }}
                  onKeyDown={handleTextareaKeyDown}
                  aria-invalid={Boolean(contentError)}
                  aria-describedby={contentError ? errorId : undefined}
                  placeholder="Wpisz pomysł, propozycję badania, wydarzenia lub ważną kwestię organizacyjną... (Ctrl+Enter wysyła)"
                  className={`h-full min-h-[86px] w-full resize-none rounded-xl border px-3.5 py-2.5 text-sm leading-relaxed text-stone-900 placeholder:text-stone-400 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 ${
                    contentError
                      ? "border-rose-500 bg-rose-50/40 focus:border-rose-600"
                      : "border-stone-300 bg-stone-50/70 focus:border-stone-900 focus:bg-white"
                  }`}
                />
              </div>

              <button
                type="submit"
                disabled={isLocked || isSubmitting || isOffline}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-stone-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-stone-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-600 sm:min-w-[180px]"
              >
                <PlusCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{isSubmitting ? "Przyklejanie..." : "Przyklej karteczkę"}</span>
              </button>
            </div>

            {contentError || submitError ? (
              <p
                id={errorId}
                role="alert"
                className="flex items-center gap-1.5 text-xs font-medium text-rose-700"
              >
                <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>{contentError ?? submitError}</span>
              </p>
            ) : null}

            {/* Boks podpowiedzi podobnej karteczki na żywo */}
            {similarMatch && !contentError && !submitError ? (
              <div
                role="region"
                aria-label="Podpowiedź podobnej karteczki"
                className="flex flex-col gap-2 rounded-xl border border-amber-300 bg-amber-50/90 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-start gap-2">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" aria-hidden="true" />
                  <div className="text-xs text-amber-950">
                    <p className="font-semibold">
                      Podobny pomysł jest już na tablicy:
                    </p>
                    <p className="line-clamp-2 text-stone-700">
                      „{similarMatch.item.content}”{" "}
                      <span className="font-semibold text-stone-900">
                        ({similarMatch.item.upvotes} {similarMatch.item.upvotes === 1 ? "głos" : "głosów"})
                      </span>
                    </p>
                  </div>
                </div>

                {onUpvoteNote ? (
                  <button
                    type="button"
                    onClick={() => {
                      onUpvoteNote(similarMatch.item.id);
                      setContent("");
                      setTouchedContent(false);
                      setContentError(null);
                    }}
                    className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-amber-400 bg-white px-3 py-1.5 text-xs font-bold text-amber-950 shadow-2xs transition hover:bg-amber-100 focus:outline-none"
                  >
                    <ThumbsUp className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>+1 Popieram ten pomysł</span>
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        {/* Klauzula RODO bezposrednio pod formularzem */}
        <p className="flex items-start gap-1.5 border-t border-stone-200/80 pt-2.5 text-[11px] leading-relaxed text-stone-600">
          <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-stone-500" aria-hidden="true" />
          <span>{RODO_CLAUSE}</span>
        </p>
      </form>
    </section>
  );
}
