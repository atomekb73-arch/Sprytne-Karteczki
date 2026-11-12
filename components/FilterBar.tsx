"use client";

import { useRef, useState, type FormEvent } from "react";
import {
  ArrowDownWideNarrow,
  CheckSquare,
  Clock,
  FileSpreadsheet,
  KeyRound,
  Lock,
  Printer,
  RefreshCw,
  Search,
  Send,
  Settings2,
  Trash2,
  Unlock,
  X,
} from "lucide-react";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import {
  DEFAULT_COLOR_LEGEND,
  NOTE_COLORS,
  NOTE_COLOR_THEMES,
  type ColorLegend,
  type NoteColor,
} from "@/lib/constants";
import type { BoardRecord, SortMode } from "@/types/board";

interface FilterBarProps {
  board: BoardRecord;
  totalNotesCount: number;
  visibleNotesCount: number;
  colorCounts: Record<NoteColor, number>;
  selectedColor: NoteColor | "all";
  onSelectColor: (color: NoteColor | "all") => void;
  uniqueAuthors: string[];
  selectedAuthor: string;
  onSelectAuthor: (author: string) => void;
  sortMode: SortMode;
  onChangeSortMode: (mode: SortMode) => void;
  searchQuery: string;
  onChangeSearchQuery: (query: string) => void;
  onResetFilters: () => void;
  memberShareUrl: string;
  onExportXlsx: () => void;
  onPrintProtocol: () => void;
  canAdmin: boolean;
  adminSource: "auth" | "token" | null;
  selectedNoteIds: string[];
  onSelectAllVisible: () => void;
  onClearSelection: () => void;
  onBulkSendToCrm: () => void;
  onBulkDelete: () => void;
  onToggleBoardLock: () => Promise<void>;
  onUpdateBoardSettings: (payload: {
    title: string;
    description: string;
    color_legend: ColorLegend;
  }) => Promise<boolean>;
  onRegenerateSlug: () => Promise<void>;
  onForgetEmergencyToken?: () => void;
  isBusyAdminAction: boolean;
}

export function FilterBar({
  board,
  totalNotesCount,
  visibleNotesCount,
  colorCounts,
  selectedColor,
  onSelectColor,
  uniqueAuthors,
  selectedAuthor,
  onSelectAuthor,
  sortMode,
  onChangeSortMode,
  searchQuery,
  onChangeSearchQuery,
  onResetFilters,
  memberShareUrl,
  onExportXlsx,
  onPrintProtocol,
  canAdmin,
  adminSource,
  selectedNoteIds,
  onSelectAllVisible,
  onClearSelection,
  onBulkSendToCrm,
  onBulkDelete,
  onToggleBoardLock,
  onUpdateBoardSettings,
  onRegenerateSlug,
  onForgetEmergencyToken,
  isBusyAdminAction,
}: FilterBarProps) {
  const settingsDialogRef = useRef<HTMLDialogElement>(null);
  const [draftTitle, setDraftTitle] = useState(board.title);
  const [draftDescription, setDraftDescription] = useState(board.description);
  const [draftLegend, setDraftLegend] = useState<ColorLegend>(board.color_legend);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const hasActiveFilters =
    selectedColor !== "all" ||
    selectedAuthor !== "all" ||
    searchQuery.trim().length > 0;

  const openSettingsDialog = () => {
    setDraftTitle(board.title);
    setDraftDescription(board.description);
    setDraftLegend({ ...board.color_legend });
    settingsDialogRef.current?.showModal();
  };

  const handleSaveSettings = async (event: FormEvent) => {
    event.preventDefault();
    setIsSavingSettings(true);
    try {
      const ok = await onUpdateBoardSettings({
        title: draftTitle.trim() || board.title,
        description: draftDescription.trim(),
        color_legend: draftLegend,
      });
      if (ok) {
        settingsDialogRef.current?.close("saved");
      }
    } finally {
      setIsSavingSettings(false);
    }
  };

  return (
    <section
      aria-label="Legenda kolorów, filtry oraz narzędzia eksportu"
      className="no-print space-y-3 rounded-2xl border border-stone-200/90 bg-white/90 p-3.5 shadow-xs backdrop-blur-xs"
    >
      {/* Interaktywna legenda kolorów — kliknięcie filtruje tablicę */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onSelectColor("all")}
          aria-pressed={selectedColor === "all"}
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition ${
            selectedColor === "all"
              ? "border-stone-900 bg-stone-900 text-white"
              : "border-stone-300 bg-stone-50 text-stone-700 hover:bg-stone-100"
          }`}
        >
          <span>Wszystkie</span>
          <span className="tabular-nums opacity-80">({totalNotesCount})</span>
        </button>

        {NOTE_COLORS.map((color) => {
          const theme = NOTE_COLOR_THEMES[color];
          const isActive = selectedColor === color;
          return (
            <button
              key={color}
              type="button"
              onClick={() => onSelectColor(isActive ? "all" : color)}
              aria-pressed={isActive}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium text-stone-900 transition ${
                isActive
                  ? `${theme.bgClass} border-stone-900 font-semibold ring-2 ring-stone-900/15`
                  : `${theme.bgClass} ${theme.borderClass} opacity-90 hover:opacity-100`
              }`}
            >
              <span
                className="h-2.5 w-2.5 rounded-full border border-black/20"
                style={{ backgroundColor: theme.hex }}
                aria-hidden="true"
              />
              <span>{board.color_legend[color]}</span>
              <span className="tabular-nums text-stone-700">({colorCounts[color]})</span>
            </button>
          );
        })}
      </div>

      {/* Pasek wyszukiwania, filtra autora, sortowania oraz akcji eksportu */}
      <div className="flex flex-col gap-2.5 border-t border-stone-100 pt-3 lg:flex-row lg:items-center lg:justify-between">
        <search className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative min-w-[210px] flex-1 sm:max-w-xs">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-stone-400"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => onChangeSearchQuery(e.target.value)}
              placeholder="Szukaj w treści lub autorze..."
              aria-label="Szukaj karteczek"
              className="w-full rounded-lg border border-stone-300 bg-stone-50/70 py-1.5 pr-8 pl-8 text-xs text-stone-900 placeholder:text-stone-400 focus:border-stone-900 focus:bg-white focus:outline-none"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => onChangeSearchQuery("")}
                aria-label="Wyczyść frazę wyszukiwania"
                className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-0.5 text-stone-400 hover:text-stone-800"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            ) : null}
          </div>

          <select
            value={selectedAuthor}
            onChange={(e) => onSelectAuthor(e.target.value)}
            aria-label="Filtruj po autorze"
            className="rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-xs font-medium text-stone-800 focus:border-stone-900 focus:outline-none"
          >
            <option value="all">Wszyscy autorzy ({uniqueAuthors.length})</option>
            {uniqueAuthors.map((author) => (
              <option key={author} value={author}>
                {author}
              </option>
            ))}
          </select>

          <div
            role="group"
            aria-label="Kolejność karteczek"
            className="inline-flex rounded-lg border border-stone-300 bg-stone-50 p-0.5"
          >
            <button
              type="button"
              onClick={() => onChangeSortMode("lifo")}
              aria-pressed={sortMode === "lifo"}
              className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                sortMode === "lifo"
                  ? "bg-white text-stone-900 shadow-2xs"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Najnowsze LIFO</span>
            </button>
            <button
              type="button"
              onClick={() => onChangeSortMode("upvotes")}
              aria-pressed={sortMode === "upvotes"}
              className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                sortMode === "upvotes"
                  ? "bg-white text-stone-900 shadow-2xs"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              <ArrowDownWideNarrow className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Najwyżej oceniane</span>
            </button>
          </div>

          {hasActiveFilters ? (
            <button
              type="button"
              onClick={onResetFilters}
              className="text-xs font-semibold text-stone-600 underline decoration-stone-300 underline-offset-2 hover:text-stone-900"
            >
              Resetuj filtry ({visibleNotesCount}/{totalNotesCount})
            </button>
          ) : null}
        </search>

        {/* Akcje eksportu, linku członków oraz druku A4 */}
        <div className="flex flex-wrap items-center gap-2">
          <CopyLinkButton value={memberShareUrl} label="Link dla członków" />

          <button
            type="button"
            onClick={onExportXlsx}
            className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-800 shadow-2xs transition hover:border-stone-400 hover:bg-stone-50"
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-700" aria-hidden="true" />
            <span>Eksport .xlsx</span>
          </button>

          <button
            type="button"
            onClick={onPrintProtocol}
            className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-800 shadow-2xs transition hover:border-stone-400 hover:bg-stone-50"
          >
            <Printer className="h-3.5 w-3.5 text-stone-700" aria-hidden="true" />
            <span>Drukuj / Protokół PDF</span>
          </button>
        </div>
      </div>

      {/* Pasek narzędzi Administratora Zarządu */}
      {canAdmin ? (
        <div className="flex flex-col gap-2 rounded-xl border border-stone-300 bg-stone-900/5 px-3 py-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-stone-900 px-2 py-1 text-[11px] font-bold text-white">
              <KeyRound className="h-3 w-3" aria-hidden="true" />
              <span>
                Tryb Zarządu (
                {adminSource === "token" ? "Klucz awaryjny" : "Konto Zarządu"})
              </span>
            </span>

            <button
              type="button"
              onClick={onToggleBoardLock}
              disabled={isBusyAdminAction}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition ${
                board.is_locked
                  ? "border-amber-400 bg-amber-100 text-amber-950 hover:bg-amber-200"
                  : "border-stone-300 bg-white text-stone-800 hover:bg-stone-50"
              }`}
            >
              {board.is_locked ? (
                <>
                  <Unlock className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Odblokuj tablicę</span>
                </>
              ) : (
                <>
                  <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Tryb tylko do odczytu</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={openSettingsDialog}
              disabled={isBusyAdminAction}
              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-2.5 py-1 text-xs font-semibold text-stone-800 transition hover:bg-stone-50"
            >
              <Settings2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Edytuj legendę i link</span>
            </button>

            {adminSource === "token" && onForgetEmergencyToken ? (
              <button
                type="button"
                onClick={onForgetEmergencyToken}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-stone-600 transition hover:bg-stone-200 hover:text-stone-900"
              >
                Zakończ sesję klucza
              </button>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {selectedNoteIds.length > 0 ? (
              <>
                <button
                  type="button"
                  onClick={onBulkSendToCrm}
                  disabled={isBusyAdminAction}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-700 px-3 py-1 text-xs font-semibold text-white shadow-xs transition hover:bg-emerald-800 disabled:opacity-60"
                >
                  <Send className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Wyślij do CRM ({selectedNoteIds.length})</span>
                </button>
                <button
                  type="button"
                  onClick={onBulkDelete}
                  disabled={isBusyAdminAction}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-rose-700 px-3 py-1 text-xs font-semibold text-white shadow-xs transition hover:bg-rose-800 disabled:opacity-60"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Usuń zaznaczone ({selectedNoteIds.length})</span>
                </button>
                <button
                  type="button"
                  onClick={onClearSelection}
                  className="rounded-lg border border-stone-300 bg-white px-2.5 py-1 text-xs font-medium text-stone-700 hover:bg-stone-100"
                >
                  Odznacz
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onSelectAllVisible}
                disabled={visibleNotesCount === 0}
                className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-2.5 py-1 text-xs font-medium text-stone-700 transition hover:bg-stone-50 disabled:opacity-50"
              >
                <CheckSquare className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Zaznacz widoczne</span>
              </button>
            )}
          </div>
        </div>
      ) : null}

      {/* Natywne okno modalne ustawien legendy kolorow oraz linku tablicy */}
      <dialog
        ref={settingsDialogRef}
        onClose={() => {
          if (settingsDialogRef.current) {
            settingsDialogRef.current.returnValue = "";
          }
        }}
        aria-labelledby="board-settings-dialog-title"
        className="m-auto w-full max-w-lg rounded-2xl border border-stone-200 bg-white p-0 text-stone-900 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
          <h2 id="board-settings-dialog-title" className="text-base font-bold">
            Ustawienia tablicy i legendy kolorów
          </h2>
          <form method="dialog">
            <button
              type="submit"
              value="cancel"
              aria-label="Zamknij okno ustawień"
              className="rounded-lg p-1 text-stone-500 transition hover:bg-stone-100 hover:text-stone-900"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </form>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-4 px-5 py-4">
          <div>
            <label
              htmlFor="settings-board-title"
              className="mb-1 block text-xs font-semibold text-stone-700"
            >
              Tytuł tablicy
            </label>
            <input
              id="settings-board-title"
              type="text"
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              minLength={2}
              maxLength={180}
              required
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:border-stone-900 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="settings-board-desc"
              className="mb-1 block text-xs font-semibold text-stone-700"
            >
              Opis tablicy
            </label>
            <textarea
              id="settings-board-desc"
              rows={2}
              value={draftDescription}
              onChange={(e) => setDraftDescription(e.target.value)}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:border-stone-900 focus:outline-none"
            />
          </div>

          <fieldset className="space-y-2.5 rounded-xl border border-stone-200 bg-stone-50/70 p-3">
            <legend className="px-1 text-xs font-bold text-stone-800">
              Etykiety 5 kolorów karteczek
            </legend>
            {NOTE_COLORS.map((color) => {
              const theme = NOTE_COLOR_THEMES[color];
              return (
                <div key={color} className="flex items-center gap-2.5">
                  <span
                    className={`h-6 w-6 shrink-0 rounded-md border ${theme.bgClass} ${theme.borderClass}`}
                    aria-hidden="true"
                  />
                  <input
                    type="text"
                    value={draftLegend[color]}
                    onChange={(e) =>
                      setDraftLegend((prev) => ({
                        ...prev,
                        [color]: e.target.value,
                      }))
                    }
                    placeholder={DEFAULT_COLOR_LEGEND[color]}
                    maxLength={80}
                    required
                    aria-label={`Opis koloru ${color}`}
                    className="w-full rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-xs text-stone-900 focus:border-stone-900 focus:outline-none"
                  />
                </div>
              );
            })}
          </fieldset>

          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2.5">
            <div>
              <p className="text-xs font-semibold text-stone-800">
                Link dostępowy dla członków
              </p>
              <p className="font-mono text-[11px] text-stone-600">
                /b/{board.access_slug}
              </p>
            </div>
            <button
              type="button"
              onClick={async () => {
                await onRegenerateSlug();
                settingsDialogRef.current?.close("slug-rotated");
              }}
              disabled={isBusyAdminAction}
              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-stone-800 transition hover:bg-stone-100"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Wygeneruj nowy link</span>
            </button>
          </div>

          <div className="flex justify-end gap-2 border-t border-stone-100 pt-3">
            <button
              type="button"
              onClick={() => settingsDialogRef.current?.close("cancel")}
              className="rounded-lg border border-stone-300 bg-white px-3.5 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50"
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={isSavingSettings}
              className="rounded-lg bg-stone-900 px-4 py-2 text-xs font-semibold text-white hover:bg-stone-800 disabled:opacity-60"
            >
              {isSavingSettings ? "Zapisywanie..." : "Zapisz ustawienia"}
            </button>
          </div>
        </form>
      </dialog>
    </section>
  );
}
