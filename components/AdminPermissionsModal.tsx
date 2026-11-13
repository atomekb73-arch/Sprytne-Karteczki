"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { AlertCircle, Check, Shield, Trash2, UserPlus, X } from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import { WSKZ_ORGANIZATIONS_CATALOG } from "@/lib/organizations";

interface PermissionEntry {
  id: string;
  user_email: string;
  tenant_id: string;
  role: string;
  created_at: string;
}

interface AdminPermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSuperadmin: boolean;
}

export function AdminPermissionsModal({
  isOpen,
  onClose,
  isSuperadmin,
}: AdminPermissionsModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { showToast } = useToast();

  const [permissions, setPermissions] = useState<PermissionEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [selectedTenant, setSelectedTenant] = useState<string>("all");
  const [selectedRole, setSelectedRole] = useState<string>("superadmin");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPermissions = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/permissions");
      if (res.ok) {
        const data = await res.json();
        setPermissions(data.permissions ?? []);
      }
    } catch {
      // Ignoruj
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      setError(null);
      setEmailInput("");
      fetchPermissions();
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isOpen]);

  const handleAddPermission = async (e: FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim() || !emailInput.includes("@")) {
      setError("Wpisz poprawny adres e-mail.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailInput.trim(),
          tenantId: selectedTenant,
          role: selectedTenant === "all" ? "superadmin" : selectedRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Błąd dodawania uprawnień.");
      }

      showToast(`Nadano uprawnienia dla ${emailInput.trim()}.`, "success");
      setEmailInput("");
      await fetchPermissions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wystąpił błąd.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevokePermission = async (permId: string, email: string) => {
    if (!confirm(`Czy na pewno odebrać uprawnienia dla ${email}?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/permissions?id=${permId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        showToast("Odebrano uprawnienia.", "info");
        setPermissions((prev) => prev.filter((p) => p.id !== permId));
      } else {
        const data = await res.json();
        showToast(data.error ?? "Nie udało się odebrać uprawnień.", "error");
      }
    } catch {
      showToast("Błąd sieci podczas odbierania uprawnień.", "error");
    }
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="m-auto w-full max-w-xl rounded-2xl border border-stone-200 bg-white p-0 shadow-2xl backdrop:bg-stone-950/40 backdrop:backdrop-blur-xs"
    >
      <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-stone-900 text-[#FEF08A]">
            <Shield className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-base font-bold text-stone-900">
              Zarządzaj dostępem Zarządu
            </h2>
            <p className="text-xs text-stone-500">
              Nadawaj rolę administratora członkom kół po adresie e-mail
            </p>
          </div>
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

      <div className="max-h-[75vh] space-y-5 overflow-y-auto p-5">
        {/* Formularz nadawania dostępu */}
        <form onSubmit={handleAddPermission} className="space-y-3 rounded-xl border border-stone-200 bg-stone-50/70 p-4">
          <h3 className="flex items-center gap-1.5 text-xs font-bold text-stone-900">
            <UserPlus className="h-3.5 w-3.5 text-stone-700" aria-hidden="true" />
            <span>Nadaj nowe uprawnienia</span>
          </h3>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <div>
              <label htmlFor="perm-email" className="mb-1 block text-[11px] font-semibold text-stone-700">
                Adres e-mail członka
              </label>
              <input
                id="perm-email"
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="np. imie.nazwisko@wskz.pl"
                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs text-stone-900 focus:border-stone-900 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="perm-tenant" className="mb-1 block text-[11px] font-semibold text-stone-700">
                Jednostka / Koło Naukowe
              </label>
              <select
                id="perm-tenant"
                value={selectedTenant}
                onChange={(e) => {
                  setSelectedTenant(e.target.value);
                  if (e.target.value === "all") setSelectedRole("superadmin");
                }}
                className="w-full rounded-lg border border-stone-300 bg-white px-2.5 py-1.5 text-xs font-medium text-stone-800 focus:border-stone-900 focus:outline-none"
              >
                {isSuperadmin ? (
                  <option value="all">Wszystkie jednostki — Superadmin</option>
                ) : null}
                {WSKZ_ORGANIZATIONS_CATALOG.map((u) => (
                  <option key={u.tenant_id} value={u.tenant_id}>
                    {u.list_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error ? (
            <p role="alert" className="flex items-center gap-1.5 text-xs font-medium text-rose-700">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </p>
          ) : null}

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 rounded-lg bg-stone-900 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-stone-800 disabled:opacity-60"
            >
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{isSubmitting ? "Zapisywanie..." : "Nadaj dostęp"}</span>
            </button>
          </div>
        </form>

        {/* Lista osób z dostępem */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-stone-900">
            Osoby z aktywnymi uprawnieniami ({permissions.length})
          </h3>

          {isLoading ? (
            <div className="space-y-2">
              <div className="h-10 animate-pulse rounded-lg bg-stone-100" />
              <div className="h-10 animate-pulse rounded-lg bg-stone-100" />
            </div>
          ) : permissions.length === 0 ? (
            <p className="rounded-lg border border-dashed border-stone-200 p-4 text-center text-xs text-stone-500">
              Brak dodatkowych uprawnień w bazie.
            </p>
          ) : (
            <div className="divide-y divide-stone-100 rounded-xl border border-stone-200 bg-white">
              {permissions.map((p) => {
                const org = WSKZ_ORGANIZATIONS_CATALOG.find((o) => o.tenant_id === p.tenant_id);
                return (
                  <div key={p.id} className="flex items-center justify-between gap-3 p-3 text-xs">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-stone-900">{p.user_email}</p>
                      <p className="truncate text-[11px] text-stone-500">
                        {p.role === "superadmin"
                          ? "Główny Administrator (Wszystkie koła)"
                          : org?.list_name ?? p.tenant_id}
                      </p>
                    </div>
                    {isSuperadmin && p.user_email !== "atomekb73@gmail.com" ? (
                      <button
                        type="button"
                        onClick={() => handleRevokePermission(p.id, p.user_email)}
                        title="Odbierz dostęp"
                        className="rounded-lg p-1.5 text-rose-600 transition hover:bg-rose-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </dialog>
  );
}
