"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  Building2,
  Check,
  ChevronDown,
  LayoutGrid,
  Lock,
  LogIn,
  LogOut,
  Plus,
  Shield,
  X,
} from "lucide-react";
import { AdminPermissionsModal } from "@/components/AdminPermissionsModal";
import { useToast } from "@/components/ToastProvider";
import { CRM_SYSTEM_LABELS } from "@/lib/constants";
import { OrganizationIcon } from "@/lib/icons";
import { resolveOrganizationMeta } from "@/lib/organizations";
import type { AdminTenantSummary } from "@/types/board";

interface TenantSwitcherProps {
  currentTenantId?: string;
  currentBoardSlug?: string;
  userEmail: string | null;
  tenants: AdminTenantSummary[];
  isSuperadmin?: boolean;
  loginRedirectPath?: string;
}

export function TenantSwitcher({
  currentTenantId,
  currentBoardSlug,
  userEmail,
  tenants,
  isSuperadmin = false,
  loginRedirectPath = "/",
}: TenantSwitcherProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [isPermModalOpen, setIsPermModalOpen] = useState(false);
  const [selectedTenantForNew, setSelectedTenantForNew] = useState<string>(
    currentTenantId ?? tenants[0]?.tenant_id ?? ""
  );
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newAdminToken, setNewAdminToken] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const activeTenant =
    tenants.find((t) => t.tenant_id === currentTenantId) ?? tenants[0];

  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (event: PointerEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  const openCreateBoardDialog = (tenantId?: string) => {
    setIsOpen(false);
    setSelectedTenantForNew(tenantId ?? activeTenant?.tenant_id ?? tenants[0]?.tenant_id ?? "");
    setNewTitle("");
    setNewDescription("");
    setNewAdminToken("");
    dialogRef.current?.showModal();
  };

  const handleDialogClose = () => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.returnValue = "";
  };

  const handleCreateBoard = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedTenantForNew || newTitle.trim().length < 2) {
      showToast("Wpisz nazwę nowej tablicy (min. 2 znaki).", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/boards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: selectedTenantForNew,
          title: newTitle.trim(),
          description: newDescription.trim(),
          adminToken: newAdminToken.trim() || undefined,
        }),
      });
      const data = (await response.json()) as {
        error?: string;
        board?: { access_slug: string; title: string };
      };

      if (!response.ok || !data.board) {
        showToast(data.error ?? "Nie udało się utworzyć tablicy.", "error");
        return;
      }

      dialogRef.current?.close("created");
      showToast(`Utworzono tablicę „${data.board.title}”.`, "success");
      router.push(`/b/${data.board.access_slug}`);
      router.refresh();
    } catch {
      showToast("Błąd sieci podczas tworzenia tablicy.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!userEmail) {
    return (
      <Link
        href={`/login?next=${encodeURIComponent(loginRedirectPath)}`}
        className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-800 shadow-2xs transition hover:border-stone-400 hover:bg-stone-50"
      >
        <LogIn className="h-3.5 w-3.5 text-stone-600" aria-hidden="true" />
        <span>Logowanie Zarządu</span>
      </Link>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className="inline-flex max-w-[270px] items-center gap-2 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-left text-xs font-semibold text-stone-900 shadow-2xs transition hover:border-stone-400 hover:bg-stone-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900"
      >
        {activeTenant ? (
          (() => {
            const activeMeta = resolveOrganizationMeta(activeTenant.organization);
            return (
              <>
                <span style={{ color: activeMeta.primary_hex }} className="shrink-0">
                  <OrganizationIcon
                    iconName={activeMeta.icon_name}
                    className="h-4 w-4"
                  />
                </span>
                <span aria-hidden="true" className="text-xs leading-none">
                  {activeMeta.emoji}
                </span>
                <span className="truncate">{activeMeta.list_name}</span>
              </>
            );
          })()
        ) : (
          <>
            <Building2 className="h-4 w-4 shrink-0 text-stone-700" aria-hidden="true" />
            <span className="truncate">{userEmail}</span>
          </>
        )}
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-stone-500 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        />
      </button>

      {isOpen ? (
        <div
          role="menu"
          aria-label="Przełącznik organizacji i tablic Zarządu"
          className="absolute right-0 z-40 mt-2 w-80 origin-top-right rounded-xl border border-stone-200 bg-white p-2 shadow-xl ring-1 ring-black/5"
        >
          <div className="border-b border-stone-100 px-2.5 py-2">
            <p className="text-[11px] font-semibold tracking-wide text-stone-500 uppercase">
              Twoje jednostki i koła
            </p>
            <p className="truncate text-xs font-medium text-stone-800">{userEmail}</p>
          </div>

          <div className="max-h-80 overflow-y-auto py-1.5">
            {tenants.length === 0 ? (
              <p className="px-2.5 py-3 text-xs leading-relaxed text-stone-600">
                To konto nie ma jeszcze przypisanego dostępu do żadnego koła ani jednostki. Poproś opiekuna lub głównego administratora o nadanie uprawnień.
              </p>
            ) : (
              tenants.map((tenant) => {
                const isActiveOrg = tenant.tenant_id === currentTenantId;
                const tenantMeta = resolveOrganizationMeta(tenant.organization);
                return (
                  <div
                    key={tenant.tenant_id}
                    className={`mb-1.5 rounded-lg p-2 last:mb-0 ${
                      isActiveOrg ? "bg-stone-100/90" : "hover:bg-stone-50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          style={{
                            backgroundColor: tenantMeta.light_bg_hex,
                            borderColor: `${tenantMeta.primary_hex}4D`,
                            color: tenantMeta.primary_hex,
                          }}
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border"
                        >
                          <OrganizationIcon
                            iconName={tenantMeta.icon_name}
                            className="h-4 w-4"
                          />
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span aria-hidden="true" className="text-xs leading-none">
                              {tenantMeta.emoji}
                            </span>
                            <p className="truncate text-xs font-semibold text-stone-900">
                              {tenantMeta.list_name}
                            </p>
                            <span
                              style={{
                                backgroundColor: tenantMeta.light_bg_hex,
                                borderColor: `${tenantMeta.primary_hex}45`,
                                color: "#1C1917",
                              }}
                              className="shrink-0 rounded border px-1 py-0.2 font-mono text-[9px] font-bold"
                            >
                              {tenantMeta.badge_code}
                            </span>
                          </div>
                          <p className="truncate text-[10px] text-stone-500">
                            {tenantMeta.name} · {CRM_SYSTEM_LABELS[tenant.organization.crm_system]}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => openCreateBoardDialog(tenant.tenant_id)}
                        title={`Nowa tablica dla ${tenant.organization.name}`}
                        className="inline-flex shrink-0 items-center gap-1 rounded-md border border-stone-200 bg-white px-2 py-1 text-[11px] font-medium text-stone-700 transition hover:bg-stone-100"
                      >
                        <Plus className="h-3 w-3" aria-hidden="true" />
                        <span>Nowa</span>
                      </button>
                    </div>

                    {tenant.boards.length > 0 ? (
                      <div className="mt-2 space-y-1 pl-9">
                        {tenant.boards.map((board) => {
                          const isCurrent = board.access_slug === currentBoardSlug;
                          return (
                            <Link
                              key={board.id}
                              href={`/b/${board.access_slug}`}
                              onClick={() => setIsOpen(false)}
                              className={`flex items-center justify-between gap-2 rounded-md px-2 py-1 text-xs transition ${
                                isCurrent
                                  ? "bg-stone-900 font-semibold text-white"
                                  : "text-stone-700 hover:bg-stone-200/70"
                              }`}
                            >
                              <span className="flex min-w-0 items-center gap-1.5">
                                <LayoutGrid className="h-3 w-3 shrink-0" aria-hidden="true" />
                                <span className="truncate">{board.title}</span>
                              </span>
                              <span className="flex shrink-0 items-center gap-1">
                                {board.is_locked ? (
                                  <Lock className="h-3 w-3 opacity-80" aria-label="Tylko do odczytu" />
                                ) : null}
                                {isCurrent ? (
                                  <Check className="h-3 w-3" aria-hidden="true" />
                                ) : null}
                              </span>
                            </Link>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="mt-2 pl-9">
                        <Link
                          href={`/b?slug=${tenant.tenant_id}-start`}
                          onClick={async (e) => {
                            e.preventDefault();
                            setIsOpen(false);
                            try {
                              const res = await fetch(`/api/organizations/${tenant.tenant_id}/board`);
                              const data = await res.json();
                              if (data.slug) {
                                router.push(`/b/${data.slug}`);
                              } else {
                                openCreateBoardDialog(tenant.tenant_id);
                              }
                            } catch {
                              openCreateBoardDialog(tenant.tenant_id);
                            }
                          }}
                          className="inline-flex items-center gap-1.5 rounded-md bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-800 hover:bg-stone-200"
                        >
                          <LayoutGrid className="h-3 w-3" aria-hidden="true" />
                          <span>Otwórz tablicę koła</span>
                        </Link>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 px-2 pt-2">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setIsPermModalOpen(true);
                }}
                className="inline-flex items-center gap-1 rounded-md border border-stone-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-stone-800 transition hover:bg-stone-50"
              >
                <Shield className="h-3.5 w-3.5 text-stone-700" aria-hidden="true" />
                <span>Zarządzaj dostępem</span>
              </button>

              {tenants.length > 0 ? (
                <button
                  type="button"
                  onClick={() => openCreateBoardDialog()}
                  className="inline-flex items-center gap-1 rounded-md bg-stone-900 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-stone-800"
                >
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Nowa tablica</span>
                </button>
              ) : null}
            </div>

            <form
              action={`/auth/signout?next=${encodeURIComponent(loginRedirectPath)}`}
              method="post"
            >
              <button
                type="submit"
                className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium text-stone-600 transition hover:bg-stone-100 hover:text-stone-900"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Wyloguj</span>
              </button>
            </form>
          </div>
        </div>
      ) : null}

      <dialog
        ref={dialogRef}
        onClose={handleDialogClose}
        aria-labelledby="create-board-dialog-title"
        className="m-auto w-full max-w-md rounded-2xl border border-stone-200 bg-white p-0 text-stone-900 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
          <h2 id="create-board-dialog-title" className="text-base font-bold">
            Utwórz nową tablicę pomysłów
          </h2>
          <form method="dialog">
            <button
              type="submit"
              value="cancel"
              aria-label="Zamknij okno"
              className="rounded-lg p-1 text-stone-500 transition hover:bg-stone-100 hover:text-stone-900"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </form>
        </div>

        <form onSubmit={handleCreateBoard} className="space-y-4 px-5 py-4">
          <div>
            <label
              htmlFor="new-board-tenant"
              className="mb-1 block text-xs font-semibold text-stone-700"
            >
              Organizacja / Koło Naukowe
            </label>
            <select
              id="new-board-tenant"
              value={selectedTenantForNew}
              onChange={(e) => setSelectedTenantForNew(e.target.value)}
              className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-stone-900 focus:outline-none"
              required
            >
              {tenants.map((t) => (
                <option key={t.tenant_id} value={t.tenant_id}>
                  {t.organization.name} ({t.tenant_id})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="new-board-title"
              className="mb-1 block text-xs font-semibold text-stone-700"
            >
              Tytuł tablicy
            </label>
            <input
              id="new-board-title"
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="np. Burza mózgów — Konferencja Jesienna"
              minLength={2}
              maxLength={180}
              required
              className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-stone-900 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="new-board-desc"
              className="mb-1 block text-xs font-semibold text-stone-700"
            >
              Krótki opis / cel spotkania (opcjonalnie)
            </label>
            <textarea
              id="new-board-desc"
              rows={2}
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Zbieramy propozycje tematów wystąpień i warsztatów..."
              className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-stone-900 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="new-board-token"
              className="mb-1 block text-xs font-semibold text-stone-700"
            >
              Awaryjny klucz Zarządu ?admin= (opcjonalnie, min. 8 znaków)
            </label>
            <input
              id="new-board-token"
              type="text"
              value={newAdminToken}
              onChange={(e) => setNewAdminToken(e.target.value)}
              placeholder="np. SKN-ZARZAD-2026"
              minLength={8}
              className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 font-mono text-xs text-stone-900 focus:border-stone-900 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-stone-100 pt-3">
            <button
              type="button"
              onClick={() => dialogRef.current?.close("cancel")}
              className="rounded-lg border border-stone-300 bg-white px-3.5 py-2 text-xs font-semibold text-stone-700 transition hover:bg-stone-50"
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-stone-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-stone-800 disabled:opacity-60"
            >
              {isSubmitting ? "Tworzenie..." : "Utwórz tablicę"}
            </button>
          </div>
        </form>
      </dialog>

      <AdminPermissionsModal
        isOpen={isPermModalOpen}
        onClose={() => setIsPermModalOpen(false)}
        isSuperadmin={isSuperadmin}
      />
    </div>
  );
}
