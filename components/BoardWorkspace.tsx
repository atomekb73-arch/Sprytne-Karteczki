"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOffline } from "next/offline";
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  ArrowLeft,
  Radio,
  Sparkles,
} from "lucide-react";
import { BoardGrid } from "@/components/BoardGrid";
import { FilterBar } from "@/components/FilterBar";
import { MergeNotesModal } from "@/components/MergeNotesModal";
import { PrintProtocolHeader } from "@/components/PrintProtocolHeader";
import { QuickAddBar } from "@/components/QuickAddBar";
import { TenantSwitcher } from "@/components/TenantSwitcher";
import { useToast } from "@/components/ToastProvider";
import {
  ADMIN_TOKEN_SESSION_PREFIX,
  CRM_SYSTEM_LABELS,
  MAX_PINNED_NOTES,
  UPVOTED_NOTES_STORAGE_KEY,
  generateStableRotationDeg,
  normalizeColorLegend,
  type ColorLegend,
  type NoteColor,
} from "@/lib/constants";
import { DEMO_EMERGENCY_ADMIN_TOKEN } from "@/lib/demo-data";
import { exportStickyNotesToXlsx } from "@/lib/export-xlsx";
import { OrganizationIcon } from "@/lib/icons";
import { PinRotationWidget } from "@/components/PinRotationWidget";
import {
  generateOwnerToken,
  getOwnedNotesSnapshot,
  parseOwnedNotesSnapshot,
  removeOwnedNoteToken,
  saveOwnedNoteToken,
  subscribeOwnedNotesStore,
} from "@/lib/note-ownership";
import { resolveOrganizationMeta } from "@/lib/organizations";
import { saveOfflineBoardSnapshot } from "@/lib/offline-cache";
import { createClient } from "@/lib/supabase/client";
import { isSupabasePublicConfigured } from "@/lib/supabase/env";
import type {
  BoardPageBundle,
  BoardRecord,
  SortMode,
  StickyNoteRecord,
} from "@/types/board";

interface BoardWorkspaceProps {
  initialBundle: BoardPageBundle;
  isEmbed: boolean;
}

const UPVOTES_EVENT = "wskz-upvotes-storage";

function subscribeNoop() {
  return () => {};
}

function subscribeUpvotesStore(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(UPVOTES_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(UPVOTES_EVENT, callback);
  };
}

function getUpvotesSnapshot(): string {
  try {
    return window.localStorage.getItem(UPVOTED_NOTES_STORAGE_KEY) ?? "[]";
  } catch {
    return "[]";
  }
}

export function BoardWorkspace({
  initialBundle,
  isEmbed,
}: BoardWorkspaceProps) {
  const router = useRouter();
  const isOffline = useOffline();
  const { showToast } = useToast();

  const [board, setBoard] = useState<BoardRecord>(initialBundle.board);
  const [notes, setNotes] = useState<StickyNoteRecord[]>(initialBundle.notes);
  const organization = initialBundle.organization;

  const [selectedColor, setSelectedColor] = useState<NoteColor | "all">("all");
  const [selectedAuthor, setSelectedAuthor] = useState<string>("all");
  const [sortMode, setSortMode] = useState<SortMode>("lifo");
  const [searchQuery, setSearchQuery] = useState("");

  const upvotedRaw = useSyncExternalStore(
    subscribeUpvotesStore,
    getUpvotesSnapshot,
    () => "[]"
  );
  const upvotedIds = useMemo(() => {
    try {
      const parsed = JSON.parse(upvotedRaw);
      if (Array.isArray(parsed)) {
        return new Set(parsed.filter((id): id is string => typeof id === "string"));
      }
    } catch {
      // Ignoruj niepoprawny JSON
    }
    return new Set<string>();
  }, [upvotedRaw]);

  const ownedNotesRaw = useSyncExternalStore(
    subscribeOwnedNotesStore,
    getOwnedNotesSnapshot,
    () => "{}"
  );
  const ownedNotesMap = useMemo(
    () => parseOwnedNotesSnapshot(ownedNotesRaw),
    [ownedNotesRaw]
  );
  const ownedNoteIds = useMemo(
    () => new Set(Object.keys(ownedNotesMap)),
    [ownedNotesMap]
  );

  const [selectedNoteIds, setSelectedNoteIds] = useState<Set<string>>(() => new Set());
  const [mergeSourceNote, setMergeSourceNote] = useState<StickyNoteRecord | null>(null);

  const [emergencyToken, setEmergencyToken] = useState<string | null>(null);
  const [realtimeSubscribed, setRealtimeSubscribed] = useState(false);
  const [isBusyAdminAction, setIsBusyAdminAction] = useState(false);

  const shareOrigin = useSyncExternalStore(
    subscribeNoop,
    () => window.location.origin,
    () => ""
  );
  const [printTimestamp, setPrintTimestamp] = useState("");

  const canAdmin = initialBundle.isAuthenticatedAdmin || emergencyToken !== null;
  const adminSource: "auth" | "token" | null = initialBundle.isAuthenticatedAdmin
    ? "auth"
    : emergencyToken !== null
      ? "token"
      : null;

  const supabaseConfigured = isSupabasePublicConfigured();
  const isDemoMode = Boolean(initialBundle.isDemoMode) || !supabaseConfigured;
  const isRealtimeLive = !isDemoMode && supabaseConfigured && !isOffline && realtimeSubscribed;

  // Zapis migawki do trybu offline dla PWA
  useEffect(() => {
    saveOfflineBoardSnapshot({
      access_slug: board.access_slug,
      board,
      organization,
      notes,
    });
  }, [board, organization, notes]);

  // Obsluga awaryjnego parametru ?admin=KLUCZ_ZARZADU (weryfikacja RPC lub demo + sessionStorage + ukrycie z paska adresu)
  useEffect(() => {
    const storageKey = `${ADMIN_TOKEN_SESSION_PREFIX}${board.id}`;
    const currentUrl = new URL(window.location.href);
    const urlToken = currentUrl.searchParams.get("admin")?.trim() ?? "";
    let storedToken = "";
    try {
      storedToken = window.sessionStorage.getItem(storageKey)?.trim() ?? "";
    } catch {
      storedToken = "";
    }

    const candidateToken = urlToken || storedToken;

    if (urlToken) {
      currentUrl.searchParams.delete("admin");
      const nextRelative = `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`;
      window.history.replaceState({}, "", nextRelative);
    }

    if (!candidateToken) return;

    let cancelled = false;
    const verify = async () => {
      try {
        let valid = false;

        if (isDemoMode) {
          await Promise.resolve();
          valid = candidateToken === DEMO_EMERGENCY_ADMIN_TOKEN;
        } else {
          const supabase = createClient();
          const { data, error } = await supabase.rpc("verify_admin_token", {
            p_board_id: board.id,
            p_token: candidateToken,
          });
          valid = !error && data === true;
        }

        if (cancelled) return;

        if (valid) {
          try {
            window.sessionStorage.setItem(storageKey, candidateToken);
          } catch {
            // Ignoruj bledy sessionStorage
          }
          setEmergencyToken(candidateToken);
          if (urlToken) {
            showToast(
              "Odblokowano pasek Zarządu przy użyciu awaryjnego klucza.",
              "success"
            );
          }
        } else {
          try {
            window.sessionStorage.removeItem(storageKey);
          } catch {
            // Ignoruj
          }
          setEmergencyToken(null);
          if (urlToken) {
            showToast("Podany awaryjny klucz Zarządu jest nieprawidłowy.", "error");
          }
        }
      } catch {
        // Offline lub blad sieci — nie czysc od razu tokena z sessionStorage
      }
    };

    void verify();
    return () => {
      cancelled = true;
    };
  }, [board.id, isDemoMode, showToast]);

  // Subskrypcja Realtime na zmiany sticky_notes oraz boards
  useEffect(() => {
    if (!supabaseConfigured || isOffline) {
      return;
    }

    const supabase = createClient();
    const channel = supabase
      .channel(`wskz-board-${board.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "sticky_notes",
          filter: `board_id=eq.${board.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const incoming = payload.new as StickyNoteRecord;
            setNotes((prev) => {
              if (prev.some((n) => n.id === incoming.id)) {
                return prev.map((n) => (n.id === incoming.id ? incoming : n));
              }
              return [incoming, ...prev];
            });
          } else if (payload.eventType === "UPDATE") {
            const updated = payload.new as StickyNoteRecord;
            setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
          } else if (payload.eventType === "DELETE") {
            const deletedId = (payload.old as Partial<StickyNoteRecord>)?.id;
            if (deletedId) {
              removeOwnedNoteToken(deletedId);
              setNotes((prev) => prev.filter((n) => n.id !== deletedId));
              setSelectedNoteIds((prev) => {
                if (!prev.has(deletedId)) return prev;
                const next = new Set(prev);
                next.delete(deletedId);
                return next;
              });
            }
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "boards",
          filter: `id=eq.${board.id}`,
        },
        (payload) => {
          const updatedBoard = payload.new as BoardRecord;
          setBoard({
            ...updatedBoard,
            color_legend: normalizeColorLegend(updatedBoard.color_legend),
          });
        }
      )
      .subscribe((status) => {
        setRealtimeSubscribed(status === "SUBSCRIBED");
      });

    return () => {
      setRealtimeSubscribed(false);
      void supabase.removeChannel(channel);
    };
  }, [board.id, isOffline, supabaseConfigured]);

  const colorCounts = useMemo(() => {
    const counts: Record<NoteColor, number> = {
      yellow: 0,
      blue: 0,
      green: 0,
      pink: 0,
      purple: 0,
    };
    for (const note of notes) {
      counts[note.color] = (counts[note.color] ?? 0) + 1;
    }
    return counts;
  }, [notes]);

  const uniqueAuthors = useMemo(() => {
    const authors = new Set<string>();
    for (const note of notes) {
      if (note.author_name.trim()) {
        authors.add(note.author_name.trim());
      }
    }
    return Array.from(authors).sort((a, b) => a.localeCompare(b, "pl"));
  }, [notes]);

  const totalPinnedOnBoard = useMemo(
    () => notes.filter((n) => n.is_pinned).length,
    [notes]
  );

  const crmNotesCount = useMemo(
    () => notes.filter((n) => n.sent_to_crm).length,
    [notes]
  );

  const { pinnedNotes, streamNotes } = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    const filtered = notes.filter((note) => {
      if (selectedColor !== "all" && note.color !== selectedColor) {
        return false;
      }
      if (selectedAuthor !== "all" && note.author_name !== selectedAuthor) {
        return false;
      }
      if (normalizedSearch) {
        const haystack = `${note.content} ${note.author_name} ${board.color_legend[note.color]}`.toLowerCase();
        if (!haystack.includes(normalizedSearch)) {
          return false;
        }
      }
      return true;
    });

    const pinned = filtered
      .filter((n) => n.is_pinned)
      .sort((a, b) => {
        if (sortMode === "upvotes" && b.upvotes !== a.upvotes) {
          return b.upvotes - a.upvotes;
        }
        const pinnedA = a.pinned_at ? new Date(a.pinned_at).getTime() : 0;
        const pinnedB = b.pinned_at ? new Date(b.pinned_at).getTime() : 0;
        return pinnedA - pinnedB;
      });

    const stream = filtered
      .filter((n) => !n.is_pinned)
      .sort((a, b) => {
        if (sortMode === "upvotes" && b.upvotes !== a.upvotes) {
          return b.upvotes - a.upvotes;
        }
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

    return { pinnedNotes: pinned, streamNotes: stream };
  }, [board.color_legend, notes, searchQuery, selectedAuthor, selectedColor, sortMode]);

  const visibleNoteIds = useMemo(
    () => [...pinnedNotes.map((n) => n.id), ...streamNotes.map((n) => n.id)],
    [pinnedNotes, streamNotes]
  );

  const handleAddNote = useCallback(
    async ({
      content,
      authorName,
      color,
    }: {
      content: string;
      authorName: string;
      color: NoteColor;
    }): Promise<boolean> => {
      const ownerToken = generateOwnerToken();

      if (isDemoMode) {
        const nowIso = new Date().toISOString();
        const createdId = crypto.randomUUID();
        saveOwnedNoteToken(createdId, ownerToken);
        const created: StickyNoteRecord = {
          id: createdId,
          board_id: board.id,
          tenant_id: board.tenant_id,
          content,
          author_name: authorName,
          color,
          rotation_deg: generateStableRotationDeg(),
          upvotes: 0,
          is_pinned: false,
          pinned_at: null,
          sent_to_crm: false,
          sent_to_crm_at: null,
          created_at: nowIso,
          updated_at: nowIso,
        };
        setNotes((prev) => [created, ...prev]);
        showToast("Karteczka została przyklejona (podgląd lokalny).", "success");
        return true;
      }

      const supabase = createClient();
      const rotationDeg = generateStableRotationDeg();

      const { data, error } = await supabase.rpc("create_sticky_note", {
        p_board_id: board.id,
        p_content: content,
        p_author_name: authorName,
        p_color: color,
        p_rotation_deg: rotationDeg,
        p_owner_token: ownerToken,
      });

      if (error || !data) {
        showToast(error?.message ?? "Nie udało się zapisać karteczki.", "error");
        return false;
      }

      const created = data as StickyNoteRecord;
      saveOwnedNoteToken(created.id, ownerToken);
      setNotes((prev) => {
        if (prev.some((n) => n.id === created.id)) {
          return prev;
        }
        return [created, ...prev];
      });
      showToast("Karteczka została przyklejona na tablicy.", "success");
      return true;
    },
    [board.id, board.tenant_id, isDemoMode, showToast]
  );

  const handleOwnerEditNote = useCallback(
    async (
      noteId: string,
      {
        content,
        authorName,
        color,
      }: {
        content: string;
        authorName: string;
        color: NoteColor;
      }
    ): Promise<boolean> => {
      if (board.is_locked) {
        showToast("Tablica jest zamknięta — nie można teraz edytować karteczek.", "error");
        return false;
      }
      if (isOffline) {
        showToast("Brak połączenia — edycja karteczek wymaga dostępu do sieci.", "error");
        return false;
      }

      const ownerToken = ownedNotesMap[noteId];
      if (!ownerToken) {
        showToast("Możesz edytować wyłącznie własną karteczkę.", "error");
        return false;
      }

      if (isDemoMode) {
        const nowIso = new Date().toISOString();
        setNotes((prev) =>
          prev.map((n) =>
            n.id === noteId
              ? {
                  ...n,
                  content,
                  author_name: authorName,
                  color,
                  updated_at: nowIso,
                }
              : n
          )
        );
        showToast("Zapisano poprawki na Twojej karteczce (podgląd lokalny).", "success");
        return true;
      }

      const supabase = createClient();
      const { data, error } = await supabase.rpc("owner_update_sticky_note", {
        p_note_id: noteId,
        p_owner_token: ownerToken,
        p_content: content,
        p_color: color,
        p_author_name: authorName,
      });

      if (error || !data) {
        showToast(
          error?.message ?? "Nie udało się zapisać poprawek na karteczce.",
          "error"
        );
        return false;
      }

      const updated = data as StickyNoteRecord;
      setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
      showToast("Zaktualizowano Twoją karteczkę.", "success");
      return true;
    },
    [board.is_locked, isDemoMode, isOffline, ownedNotesMap, showToast]
  );

  const handleOwnerDeleteNote = useCallback(
    async (noteId: string): Promise<boolean> => {
      if (board.is_locked) {
        showToast("Tablica jest zamknięta — nie można teraz usuwać karteczek.", "error");
        return false;
      }
      if (isOffline) {
        showToast("Brak połączenia — usuwanie karteczek wymaga dostępu do sieci.", "error");
        return false;
      }

      const ownerToken = ownedNotesMap[noteId];
      if (!ownerToken) {
        showToast("Możesz usunąć wyłącznie własną karteczkę.", "error");
        return false;
      }

      if (!isDemoMode) {
        const supabase = createClient();
        const { data, error } = await supabase.rpc("owner_delete_sticky_note", {
          p_note_id: noteId,
          p_owner_token: ownerToken,
        });

        if (error || data === false) {
          showToast(
            error?.message ?? "Nie udało się usunąć Twojej karteczki.",
            "error"
          );
          return false;
        }
      }

      removeOwnedNoteToken(noteId);
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      setSelectedNoteIds((prev) => {
        if (!prev.has(noteId)) return prev;
        const next = new Set(prev);
        next.delete(noteId);
        return next;
      });
      showToast(
        isDemoMode
          ? "Usunięto Twoją karteczkę (podgląd lokalny)."
          : "Usunięto Twoją karteczkę.",
        "success"
      );
      return true;
    },
    [board.is_locked, isDemoMode, isOffline, ownedNotesMap, showToast]
  );

  const handleUpvote = useCallback(
    async (noteId: string) => {
      if (upvotedIds.has(noteId) || board.is_locked || isOffline) {
        return;
      }

      const nextSet = new Set(upvotedIds);
      nextSet.add(noteId);

      try {
        window.localStorage.setItem(
          UPVOTED_NOTES_STORAGE_KEY,
          JSON.stringify(Array.from(nextSet))
        );
        window.dispatchEvent(new Event(UPVOTES_EVENT));
      } catch {
        // Ignoruj bledy localStorage
      }

      setNotes((prev) =>
        prev.map((n) => (n.id === noteId ? { ...n, upvotes: n.upvotes + 1 } : n))
      );

      if (isDemoMode) {
        return;
      }

      const supabase = createClient();
      const { data: exactUpvotes, error } = await supabase.rpc("upvote_sticky_note", {
        p_note_id: noteId,
      });

      if (error) {
        const revertedSet = new Set(nextSet);
        revertedSet.delete(noteId);
        try {
          window.localStorage.setItem(
            UPVOTED_NOTES_STORAGE_KEY,
            JSON.stringify(Array.from(revertedSet))
          );
          window.dispatchEvent(new Event(UPVOTES_EVENT));
        } catch {
          // Ignoruj
        }
        setNotes((prev) =>
          prev.map((n) =>
            n.id === noteId ? { ...n, upvotes: Math.max(0, n.upvotes - 1) } : n
          )
        );
        showToast(error.message || "Nie udało się oddać głosu.", "error");
        return;
      }

      if (typeof exactUpvotes === "number") {
        setNotes((prev) =>
          prev.map((n) => (n.id === noteId ? { ...n, upvotes: exactUpvotes } : n))
        );
      }
    },
    [board.is_locked, isDemoMode, isOffline, showToast, upvotedIds]
  );

  const runTokenAdminAction = useCallback(
    async (
      action: string,
      noteId: string | null = null,
      payload: Record<string, unknown> = {}
    ) => {
      if (!emergencyToken) {
        throw new Error("Brak aktywnego klucza Zarządu.");
      }
      const supabase = createClient();
      const { data, error } = await supabase.rpc("admin_token_action", {
        p_board_id: board.id,
        p_token: emergencyToken,
        p_action: action,
        p_note_id: noteId,
        p_payload: payload as never,
      });

      if (error) {
        throw new Error(error.message);
      }
      return data as Record<string, unknown>;
    },
    [board.id, emergencyToken]
  );

  const handleTogglePin = useCallback(
    async (note: StickyNoteRecord) => {
      if (!canAdmin) return;
      if (!note.is_pinned && totalPinnedOnBoard >= MAX_PINNED_NOTES) {
        showToast(
          `Strefa „Przypięte przez Zarząd” mieści maksymalnie ${MAX_PINNED_NOTES} karteczki.`,
          "error"
        );
        return;
      }

      setIsBusyAdminAction(true);
      try {
        if (isDemoMode) {
          const nextPinned = !note.is_pinned;
          setNotes((prev) =>
            prev.map((n) =>
              n.id === note.id
                ? {
                    ...n,
                    is_pinned: nextPinned,
                    pinned_at: nextPinned ? new Date().toISOString() : null,
                  }
                : n
            )
          );
        } else if (initialBundle.isAuthenticatedAdmin) {
          const supabase = createClient();
          const { data, error } = await supabase
            .from("sticky_notes")
            .update({ is_pinned: !note.is_pinned })
            .eq("id", note.id)
            .select("*")
            .single();

          if (error || !data) {
            throw new Error(error?.message ?? "Nie udało się zmienić przypięcia.");
          }
          const updated = data as StickyNoteRecord;
          setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
        } else {
          const result = await runTokenAdminAction("toggle_pin", note.id);
          const updated = result.note as StickyNoteRecord | undefined;
          if (updated) {
            setNotes((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
          }
        }

        showToast(
          note.is_pinned
            ? "Odpięto karteczkę ze strefy Zarządu."
            : "Przypięto karteczkę do strefy Zarządu.",
          "success"
        );
      } catch (err) {
        showToast(
          err instanceof Error ? err.message : "Błąd podczas przypinania karteczki.",
          "error"
        );
      } finally {
        setIsBusyAdminAction(false);
      }
    },
    [
      canAdmin,
      initialBundle.isAuthenticatedAdmin,
      isDemoMode,
      runTokenAdminAction,
      showToast,
      totalPinnedOnBoard,
    ]
  );

  const handleDeleteNotes = useCallback(
    async (noteIds: string[]) => {
      if (!canAdmin || noteIds.length === 0) return;

      const confirmed = window.confirm(
        noteIds.length === 1
          ? "Czy na pewno chcesz trwale usunąć tę karteczkę z tablicy?"
          : `Czy na pewno chcesz trwale usunąć zaznaczone karteczki (${noteIds.length})?`
      );
      if (!confirmed) return;

      setIsBusyAdminAction(true);
      try {
        if (isDemoMode) {
          // W trybie lokalnego podgladu usuwamy wyłącznie w pamięci przeglądarki
        } else if (initialBundle.isAuthenticatedAdmin) {
          const supabase = createClient();
          const { error } = await supabase
            .from("sticky_notes")
            .delete()
            .eq("board_id", board.id)
            .in("id", noteIds);
          if (error) {
            throw new Error(error.message);
          }
        } else if (noteIds.length === 1) {
          await runTokenAdminAction("delete_note", noteIds[0]);
        } else {
          await runTokenAdminAction("delete_notes_bulk", null, { note_ids: noteIds });
        }

        const deletedSet = new Set(noteIds);
        for (const id of noteIds) {
          removeOwnedNoteToken(id);
        }
        setNotes((prev) => prev.filter((n) => !deletedSet.has(n.id)));
        setSelectedNoteIds((prev) => {
          const next = new Set(prev);
          for (const id of noteIds) next.delete(id);
          return next;
        });

        showToast(
          noteIds.length === 1
            ? "Usunięto karteczkę."
            : `Usunięto ${noteIds.length} karteczek.`,
          "success"
        );
      } catch (err) {
        showToast(
          err instanceof Error ? err.message : "Nie udało się usunąć karteczki.",
          "error"
        );
      } finally {
        setIsBusyAdminAction(false);
      }
    },
    [
      board.id,
      canAdmin,
      initialBundle.isAuthenticatedAdmin,
      isDemoMode,
      runTokenAdminAction,
      showToast,
    ]
  );

  const handleConfirmMergeNotes = useCallback(
    async (sourceNoteId: string, targetNoteId: string): Promise<boolean> => {
      if (!canAdmin) return false;
      setIsBusyAdminAction(true);

      try {
        if (isDemoMode) {
          const source = notes.find((n) => n.id === sourceNoteId);
          const target = notes.find((n) => n.id === targetNoteId);
          if (!source || !target) {
            throw new Error("Nie znaleziono scalanych karteczek.");
          }

          let combinedAuthor = target.author_name;
          if (
            source.author_name &&
            source.author_name !== "Anonimowy Student" &&
            source.author_name !== target.author_name
          ) {
            combinedAuthor =
              target.author_name === "Anonimowy Student"
                ? source.author_name
                : `${target.author_name}, ${source.author_name}`.slice(0, 80);
          }

          const updatedTarget: StickyNoteRecord = {
            ...target,
            upvotes: target.upvotes + source.upvotes,
            author_name: combinedAuthor,
            is_pinned: target.is_pinned || source.is_pinned,
            sent_to_crm: target.sent_to_crm || source.sent_to_crm,
            updated_at: new Date().toISOString(),
          };

          removeOwnedNoteToken(sourceNoteId);
          setNotes((prev) =>
            prev.filter((n) => n.id !== sourceNoteId).map((n) => (n.id === targetNoteId ? updatedTarget : n))
          );
        } else {
          const supabase = createClient();
          const { data, error } = await supabase.rpc("merge_sticky_notes", {
            p_source_note_id: sourceNoteId,
            p_target_note_id: targetNoteId,
            p_board_id: board.id,
            p_token: emergencyToken ?? null,
          });

          if (error) {
            throw new Error(error.message);
          }

          const result = data as unknown as {
            success: boolean;
            merged_note: StickyNoteRecord;
            deleted_source_id: string;
          };

          removeOwnedNoteToken(sourceNoteId);
          setNotes((prev) =>
            prev
              .filter((n) => n.id !== sourceNoteId)
              .map((n) => (n.id === targetNoteId ? (result.merged_note ?? n) : n))
          );
        }

        showToast("Pomyślnie scalono karteczki (głosy zostały zsumowane).", "success");
        return true;
      } catch (err) {
        showToast(
          err instanceof Error ? err.message : "Nie udało się scalić karteczek.",
          "error"
        );
        return false;
      } finally {
        setIsBusyAdminAction(false);
      }
    },
    [board.id, canAdmin, emergencyToken, isDemoMode, notes, showToast]
  );

  const handleToggleBoardLock = useCallback(async () => {
    if (!canAdmin) return;
    setIsBusyAdminAction(true);

    try {
      const nextLocked = !board.is_locked;
      if (isDemoMode) {
        setBoard((prev) => ({ ...prev, is_locked: nextLocked }));
      } else if (initialBundle.isAuthenticatedAdmin) {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("boards")
          .update({ is_locked: nextLocked })
          .eq("id", board.id)
          .select("*")
          .single();

        if (error || !data) {
          throw new Error(error?.message ?? "Nie udało się zmienić blokady tablicy.");
        }
        setBoard({
          ...data,
          color_legend: normalizeColorLegend(data.color_legend),
        });
      } else {
        const result = await runTokenAdminAction("toggle_lock", null, {
          is_locked: nextLocked,
        });
        const updatedBoard = result.board as BoardRecord | undefined;
        if (updatedBoard) {
          setBoard({
            ...updatedBoard,
            color_legend: normalizeColorLegend(updatedBoard.color_legend),
          });
        }
      }

      showToast(
        nextLocked
          ? "Przełączono tablicę w tryb tylko do odczytu."
          : "Odblokowano możliwość dodawania karteczek.",
        "info"
      );
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Nie udało się zmienić statusu tablicy.",
        "error"
      );
    } finally {
      setIsBusyAdminAction(false);
    }
  }, [
    board.id,
    board.is_locked,
    canAdmin,
    initialBundle.isAuthenticatedAdmin,
    isDemoMode,
    runTokenAdminAction,
    showToast,
  ]);

  const handleUpdateBoardSettings = useCallback(
    async (payload: {
      title: string;
      description: string;
      color_legend: ColorLegend;
    }): Promise<boolean> => {
      if (!canAdmin) return false;
      setIsBusyAdminAction(true);

      try {
        if (isDemoMode) {
          setBoard((prev) => ({
            ...prev,
            title: payload.title,
            description: payload.description,
            color_legend: normalizeColorLegend(payload.color_legend),
          }));
        } else if (initialBundle.isAuthenticatedAdmin) {
          const supabase = createClient();
          const { data, error } = await supabase
            .from("boards")
            .update({
              title: payload.title,
              description: payload.description,
              color_legend: payload.color_legend,
            })
            .eq("id", board.id)
            .select("*")
            .single();

          if (error || !data) {
            throw new Error(error?.message ?? "Nie udało się zapisać ustawień tablicy.");
          }
          setBoard({
            ...data,
            color_legend: normalizeColorLegend(data.color_legend),
          });
        } else {
          const result = await runTokenAdminAction("update_legend", null, payload);
          const updatedBoard = result.board as BoardRecord | undefined;
          if (updatedBoard) {
            setBoard({
              ...updatedBoard,
              color_legend: normalizeColorLegend(updatedBoard.color_legend),
            });
          }
        }

        showToast("Zapisano legendę kolorów i opis tablicy.", "success");
        return true;
      } catch (err) {
        showToast(
          err instanceof Error ? err.message : "Błąd podczas zapisu ustawień.",
          "error"
        );
        return false;
      } finally {
        setIsBusyAdminAction(false);
      }
    },
    [
      board.id,
      canAdmin,
      initialBundle.isAuthenticatedAdmin,
      isDemoMode,
      runTokenAdminAction,
      showToast,
    ]
  );

  const handleRegenerateSlug = useCallback(async () => {
    if (!canAdmin) return;
    if (isDemoMode) {
      showToast(
        "Zmiana sluga URL wymaga połączenia z bazą Supabase (.env.local).",
        "info"
      );
      return;
    }
    const confirmed = window.confirm(
      "Wygenerować nowy link dla członków? Poprzedni adres URL tablicy przestanie działać."
    );
    if (!confirmed) return;

    setIsBusyAdminAction(true);
    try {
      let nextSlug = "";
      if (initialBundle.isAuthenticatedAdmin) {
        const supabase = createClient();
        const bytes = crypto.getRandomValues(new Uint8Array(3));
        const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
        const prefix = organization.tenant_id.toLowerCase().replace(/[^a-z0-9-]+/g, "-");
        const candidate = `${prefix}-${hex}`;

        const { data, error } = await supabase
          .from("boards")
          .update({ access_slug: candidate })
          .eq("id", board.id)
          .select("*")
          .single();

        if (error || !data) {
          throw new Error(error?.message ?? "Nie udało się zmienić linku tablicy.");
        }
        setBoard({
          ...data,
          color_legend: normalizeColorLegend(data.color_legend),
        });
        nextSlug = data.access_slug;
      } else {
        const result = await runTokenAdminAction("regenerate_slug", null, {
          prefix: organization.tenant_id,
        });
        const updatedBoard = result.board as BoardRecord | undefined;
        if (updatedBoard) {
          setBoard({
            ...updatedBoard,
            color_legend: normalizeColorLegend(updatedBoard.color_legend),
          });
          nextSlug = updatedBoard.access_slug;
        }
      }

      if (nextSlug) {
        showToast("Wygenerowano nowy link dostępowy tablicy.", "success");
        router.replace(`/b/${nextSlug}${isEmbed ? "?embed=true" : ""}`);
      }
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Nie udało się odświeżyć linku.",
        "error"
      );
    } finally {
      setIsBusyAdminAction(false);
    }
  }, [
    board.id,
    canAdmin,
    initialBundle.isAuthenticatedAdmin,
    isDemoMode,
    isEmbed,
    organization.tenant_id,
    router,
    runTokenAdminAction,
    showToast,
  ]);

  const handleSendToCrm = useCallback(
    async (noteIds: string[]) => {
      if (!canAdmin || noteIds.length === 0) return;

      if (isDemoMode) {
        const nowIso = new Date().toISOString();
        const pushedSet = new Set(noteIds);
        setNotes((prev) =>
          prev.map((n) =>
            pushedSet.has(n.id)
              ? { ...n, sent_to_crm: true, sent_to_crm_at: nowIso }
              : n
          )
        );
        setSelectedNoteIds((prev) => {
          const next = new Set(prev);
          for (const id of noteIds) next.delete(id);
          return next;
        });
        showToast(
          `Oznaczono ${noteIds.length} karteczek jako W REALIZACJI (CRM) — symulacja podglądu lokalnego dla ${CRM_SYSTEM_LABELS[organization.crm_system]}.`,
          "success"
        );
        return;
      }

      setIsBusyAdminAction(true);
      try {
        const response = await fetch("/api/crm/push", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            boardId: board.id,
            noteIds,
            adminToken: emergencyToken ?? undefined,
          }),
        });

        const data = (await response.json()) as {
          error?: string;
          mode?: "live" | "dry_run";
          crmSystemLabel?: string;
          count?: number;
          updatedNotes?: StickyNoteRecord[];
        };

        if (!response.ok) {
          throw new Error(data.error ?? "Nie udało się wysłać karteczek do CRM.");
        }

        if (Array.isArray(data.updatedNotes) && data.updatedNotes.length > 0) {
          const updatedMap = new Map(data.updatedNotes.map((n) => [n.id, n]));
          setNotes((prev) => prev.map((n) => updatedMap.get(n.id) ?? n));
        }

        setSelectedNoteIds((prev) => {
          const next = new Set(prev);
          for (const id of noteIds) next.delete(id);
          return next;
        });

        const suffix =
          data.mode === "dry_run" ? " (tryb lokalny CRM_ALLOW_DRY_RUN)" : "";
        showToast(
          `Przekazano ${data.count ?? noteIds.length} karteczek do ${
            data.crmSystemLabel ?? CRM_SYSTEM_LABELS[organization.crm_system]
          }${suffix}.`,
          "success"
        );
      } catch (err) {
        showToast(
          err instanceof Error ? err.message : "Błąd wysyłki do CRM.",
          "error"
        );
      } finally {
        setIsBusyAdminAction(false);
      }
    },
    [board.id, canAdmin, emergencyToken, isDemoMode, organization.crm_system, showToast]
  );

  const handleExportXlsx = useCallback(async () => {
    const targetNotes = [...pinnedNotes, ...streamNotes];
    if (targetNotes.length === 0) {
      showToast("Brak karteczek do wyeksportowania.", "info");
      return;
    }

    try {
      const fileName = await exportStickyNotesToXlsx({
        notes: targetNotes,
        organization,
        colorLegend: board.color_legend,
        boardTitle: board.title,
      });
      showToast(`Pobrano arkusz ${fileName}`, "success");
    } catch {
      showToast("Nie udało się wygenerować pliku Excel (.xlsx).", "error");
    }
  }, [board.color_legend, board.title, organization, pinnedNotes, showToast, streamNotes]);

  const handlePrintProtocol = useCallback(() => {
    setPrintTimestamp(
      new Intl.DateTimeFormat("pl-PL", {
        dateStyle: "long",
        timeStyle: "short",
      }).format(new Date())
    );
    window.setTimeout(() => {
      window.print();
    }, 60);
  }, []);

  const handleToggleSelectNote = useCallback((noteId: string) => {
    setSelectedNoteIds((prev) => {
      const next = new Set(prev);
      if (next.has(noteId)) {
        next.delete(noteId);
      } else {
        next.add(noteId);
      }
      return next;
    });
  }, []);

  const handleForgetEmergencyToken = useCallback(() => {
    try {
      window.sessionStorage.removeItem(`${ADMIN_TOKEN_SESSION_PREFIX}${board.id}`);
    } catch {
      // Ignoruj
    }
    setEmergencyToken(null);
    setSelectedNoteIds(new Set());
    showToast("Zamknięto sesję awaryjnego klucza Zarządu.", "info");
  }, [board.id, showToast]);

  const memberShareUrl = shareOrigin
    ? `${shareOrigin}/b/${board.access_slug}`
    : `/b/${board.access_slug}`;

  return (
    <div className="min-h-screen bg-cork-dots">
      {/* Zewnetrzna nawigacja WSKZ — ukrywana przy ?embed=true oraz w druku */}
      {!isEmbed ? (
        <nav
          aria-label="Nawigacja główna Sprytne Karteczki"
          className="no-print border-b border-stone-200/90 bg-white/85 backdrop-blur-md"
        >
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-stone-600 transition hover:bg-stone-100 hover:text-stone-900"
              >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Tablice WSKZ</span>
              </Link>
              <span className="text-stone-300" aria-hidden="true">
                /
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-900">
                <Sparkles className="h-3.5 w-3.5 text-amber-600" aria-hidden="true" />
                <span>Sprytne Karteczki</span>
              </span>
            </div>

            <TenantSwitcher
              currentTenantId={organization.tenant_id}
              currentBoardSlug={board.access_slug}
              userEmail={initialBundle.userEmail}
              tenants={initialBundle.adminTenants}
              loginRedirectPath={`/b/${board.access_slug}`}
            />
          </div>
        </nav>
      ) : null}

      <main className="mx-auto max-w-7xl space-y-5 px-4 py-5 sm:px-6 sm:py-6">
        {/* Naglowek do druku protokolu A4 */}
        <PrintProtocolHeader
          board={board}
          organization={organization}
          notes={[...pinnedNotes, ...streamNotes]}
          pinnedCount={totalPinnedOnBoard}
          crmCount={crmNotesCount}
          generatedAtLabel={printTimestamp}
        />

        {/* Naglowek tablicy w trybie ekranowym */}
        <header className="no-print flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            {(() => {
              const orgMeta = resolveOrganizationMeta(organization);
              return (
                <>
                  <div
                    style={{
                      backgroundColor: orgMeta.light_bg_hex,
                      borderColor: `${orgMeta.primary_hex}55`,
                      color: orgMeta.primary_hex,
                    }}
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border shadow-xs"
                  >
                    <OrganizationIcon iconName={orgMeta.icon_name} className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold tracking-wide text-stone-700 uppercase">
                        {orgMeta.list_name}
                      </span>
                      {orgMeta.email ? (
                        <a
                          href={`mailto:${orgMeta.email}`}
                          className="rounded-md border border-stone-200 bg-white/90 px-2 py-0.5 text-[10px] font-medium text-stone-600 transition hover:border-stone-400 hover:text-stone-900"
                        >
                          {orgMeta.email}
                        </a>
                      ) : null}
                    </div>
                    <h1 className="mt-0.5 text-xl font-extrabold tracking-tight text-stone-950 sm:text-2xl">
                      {board.title}
                    </h1>
                    {board.description ? (
                      <p className="mt-1 max-w-3xl text-sm text-stone-600">
                        {board.description}
                      </p>
                    ) : null}
                  </div>
                </>
              );
            })()}
          </div>

          <div className="flex shrink-0 items-center gap-2 self-start sm:self-center">
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${
                isOffline
                  ? "border-amber-300 bg-amber-50 text-amber-900"
                  : isRealtimeLive
                    ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                    : "border-stone-300 bg-white text-stone-700"
              }`}
            >
              {isOffline ? (
                <Radio className="h-3.5 w-3.5 text-amber-700" aria-hidden="true" />
              ) : isRealtimeLive ? (
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
              ) : (
                <Radio className="h-3.5 w-3.5 text-stone-400" aria-hidden="true" />
              )}
              <span>
                {isOffline
                  ? "Offline (podgląd)"
                  : isDemoMode
                    ? "Podgląd lokalny (Demo)"
                    : isRealtimeLive
                      ? "Synchronizacja na żywo"
                      : "Synchronizacja..."}
              </span>
            </span>
          </div>
        </header>

        {/* Widżet rotacji i zmiany PIN-u dla Zarządu */}
        {canAdmin && (
          <div className="no-print">
            <PinRotationWidget
              boardId={board.id}
              currentPin={board.pin_code ?? "123456"}
              pinUpdatedAt={board.pin_updated_at ?? null}
              onPinChange={(newPin) => {
                showToast(`Zmieniono PIN tablicy na: ${newPin}`, "success");
              }}
            />
          </div>
        )}

        {isDemoMode ? (
          <div className="no-print flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-300 bg-amber-50/90 px-3.5 py-2 text-xs text-amber-950">
            <span>
              <strong>Tryb podglądu lokalnego</strong> (brak <code className="font-mono">.env.local</code> Supabase) — wszystkie interakcje działają w pamięci przeglądarki.
            </span>
            {!canAdmin ? (
              <button
                type="button"
                onClick={() => {
                  try {
                    window.sessionStorage.setItem(
                      `${ADMIN_TOKEN_SESSION_PREFIX}${board.id}`,
                      DEMO_EMERGENCY_ADMIN_TOKEN
                    );
                  } catch {
                    // Ignoruj
                  }
                  setEmergencyToken(DEMO_EMERGENCY_ADMIN_TOKEN);
                  showToast("Odblokowano narzędzia Zarządu (klucz demo WSKZ-ZARZAD-2026).", "success");
                }}
                className="rounded-lg border border-amber-400 bg-white px-2.5 py-1 font-semibold text-amber-950 hover:bg-amber-100"
              >
                Włącz pasek Zarządu (?admin=WSKZ-ZARZAD-2026)
              </button>
            ) : null}
          </div>
        ) : null}

        {/* Pasek szybkiego dodawania karteczek */}
        <QuickAddBar
          colorLegend={board.color_legend}
          isLocked={board.is_locked}
          isOffline={isOffline}
          existingNotes={notes}
          onUpvoteNote={handleUpvote}
          onAddNote={handleAddNote}
        />

        {/* Interaktywna legenda kolorów, filtry i akcje Zarządu */}
        <FilterBar
          board={board}
          totalNotesCount={notes.length}
          visibleNotesCount={visibleNoteIds.length}
          colorCounts={colorCounts}
          selectedColor={selectedColor}
          onSelectColor={setSelectedColor}
          uniqueAuthors={uniqueAuthors}
          selectedAuthor={selectedAuthor}
          onSelectAuthor={setSelectedAuthor}
          sortMode={sortMode}
          onChangeSortMode={setSortMode}
          searchQuery={searchQuery}
          onChangeSearchQuery={setSearchQuery}
          onResetFilters={() => {
            setSelectedColor("all");
            setSelectedAuthor("all");
            setSearchQuery("");
          }}
          memberShareUrl={memberShareUrl}
          onExportXlsx={handleExportXlsx}
          onPrintProtocol={handlePrintProtocol}
          canAdmin={canAdmin}
          adminSource={adminSource}
          selectedNoteIds={Array.from(selectedNoteIds)}
          onSelectAllVisible={() => setSelectedNoteIds(new Set(visibleNoteIds))}
          onClearSelection={() => setSelectedNoteIds(new Set())}
          onBulkSendToCrm={() => void handleSendToCrm(Array.from(selectedNoteIds))}
          onBulkDelete={() => void handleDeleteNotes(Array.from(selectedNoteIds))}
          onToggleBoardLock={handleToggleBoardLock}
          onUpdateBoardSettings={handleUpdateBoardSettings}
          onRegenerateSlug={handleRegenerateSlug}
          onForgetEmergencyToken={handleForgetEmergencyToken}
          isBusyAdminAction={isBusyAdminAction}
        />

        {/* Strefa Przypięte przez Zarząd + Główny strumień LIFO */}
        <BoardGrid
          pinnedNotes={pinnedNotes}
          streamNotes={streamNotes}
          totalNotesCount={notes.length}
          totalPinnedOnBoard={totalPinnedOnBoard}
          colorLegend={board.color_legend}
          upvotedIds={upvotedIds}
          ownedNoteIds={ownedNoteIds}
          isLocked={board.is_locked}
          isOffline={isOffline}
          canAdmin={canAdmin}
          selectedNoteIds={selectedNoteIds}
          onUpvote={handleUpvote}
          onToggleSelect={handleToggleSelectNote}
          onTogglePin={handleTogglePin}
          onSendToCrm={(noteId) => void handleSendToCrm([noteId])}
          onDeleteNote={(noteId) => void handleDeleteNotes([noteId])}
          onRequestMerge={(sourceNote) => setMergeSourceNote(sourceNote)}
          onOwnerEditNote={handleOwnerEditNote}
          onOwnerDeleteNote={handleOwnerDeleteNote}
          onResetFilters={() => {
            setSelectedColor("all");
            setSelectedAuthor("all");
            setSearchQuery("");
          }}
        />

        {/* Modal scalania duplikatu */}
        <MergeNotesModal
          sourceNote={mergeSourceNote}
          availableNotes={notes}
          colorLegend={board.color_legend}
          isOpen={mergeSourceNote !== null}
          onClose={() => setMergeSourceNote(null)}
          onConfirmMerge={handleConfirmMergeNotes}
        />
      </main>
    </div>
  );
}
