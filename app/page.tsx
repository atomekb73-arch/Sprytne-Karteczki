import Link from "next/link";
import { Suspense } from "react";
import {
  ArrowRight,
  Database,
  Layers,
  Radio,
  Sparkles,
  WifiOff,
} from "lucide-react";
import { EcosystemDirectory } from "@/components/EcosystemDirectory";
import { TenantSwitcher } from "@/components/TenantSwitcher";
import {
  fetchAdminTenantsForCurrentUser,
  fetchPublicEcosystemOverview,
} from "@/lib/board-data";

function HomeSlugJumpForm() {
  return (
    <form
      action="/b"
      method="get"
      className="flex flex-col gap-2 sm:flex-row sm:items-center"
    >
      <label htmlFor="board-slug-input" className="sr-only">
        Kod lub slug tablicy
      </label>
      <input
        id="board-slug-input"
        name="slug"
        type="text"
        required
        placeholder="Wpisz kod tablicy, np. skn-seksuologii-8f92"
        className="flex-1 rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-900 focus:outline-none"
      />
      <button
        type="submit"
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-stone-800"
      >
        <span>Otwórz tablicę</span>
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </button>
    </form>
  );
}

async function HomeNavTenantSlot() {
  const adminState = await fetchAdminTenantsForCurrentUser();
  return (
    <TenantSwitcher
      userEmail={adminState.userEmail}
      tenants={adminState.tenants}
      loginRedirectPath="/"
    />
  );
}

async function EcosystemBoardsSection() {
  const { organizations, boards, isDemoMode } = await fetchPublicEcosystemOverview();

  return (
    <section aria-label="Aktywne tablice w ekosystemie WSKZ" className="space-y-4">
      {isDemoMode ? (
        <div className="rounded-2xl border border-amber-300 bg-amber-50/90 px-4 py-3 text-xs text-amber-950 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="flex items-center gap-2 leading-relaxed">
              <Database className="h-4 w-4 shrink-0 text-amber-700" aria-hidden="true" />
              <span>
                <strong>Tryb podglądu lokalnego:</strong> brak pliku{" "}
                <code className="rounded bg-amber-100 px-1 py-0.5 font-mono">.env.local</code>{" "}
                — wyświetlane są przykładowe tablice z{" "}
                <code className="rounded bg-amber-100 px-1 py-0.5 font-mono">supabase/seed.sql</code>.
                Po uzupełnieniu zmiennych Supabase aplikacja przełączy się automatycznie na produkcyjną bazę danych.
              </span>
            </p>
            <Link
              href="/b/skn-seksuologii-8f92?admin=WSKZ-ZARZAD-2026"
              className="shrink-0 rounded-lg border border-amber-400 bg-white px-2.5 py-1 font-semibold text-amber-950 hover:bg-amber-100"
            >
              Podgląd z uprawnieniami Zarządu
            </Link>
          </div>
        </div>
      ) : null}

      <EcosystemDirectory organizations={organizations} boards={boards} />
    </section>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-cork-dots">
      <header className="border-b border-stone-200/90 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-900 text-[#FEF08A] shadow-xs">
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-extrabold tracking-tight text-stone-950">
                Sprytne Karteczki
              </p>
              <p className="text-[11px] font-medium text-stone-600">
                Karteczki WSKZ — Koła Naukowe i Samorząd Studencki
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/offline"
              className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 transition hover:bg-stone-50"
            >
              <WifiOff className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Zapisane offline</span>
            </Link>

            <Suspense
              fallback={
                <span className="inline-flex h-8 w-36 animate-pulse rounded-lg bg-stone-200" />
              }
            >
              <HomeNavTenantSlot />
            </Suspense>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6 sm:py-10">
        {/* Hero */}
        <section className="rounded-3xl border border-stone-200 bg-white/95 p-6 shadow-sm sm:p-8">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-[#FEF08A] px-3 py-1 text-xs font-bold text-stone-900">
              <Radio className="h-3.5 w-3.5 text-stone-900" aria-hidden="true" />
              <span>PWA • Realtime Supabase • Synchronizacja z CRM WSKZ</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-stone-950 sm:text-4xl">
              Wirtualna tablica pomysłów i burz mózgów dla studentów WSKZ
            </h1>
            <p className="text-sm leading-relaxed text-stone-600 sm:text-base">
              Zbieraj pomysły podczas spotkań Google Meet bez logowania członków, przypinaj priorytety Zarządu, eksportuj protokoły A4 / Excel oraz wypychaj wybrane inicjatywy jednym kliknięciem do CRM Kancelarii Samorządu i CRM Kół Naukowych.
            </p>
            <div className="pt-1">
              <HomeSlugJumpForm />
            </div>
          </div>

          <div className="mt-7 grid grid-cols-1 gap-4 border-t border-stone-100 pt-6 sm:grid-cols-3">
            <div className="rounded-xl border border-stone-200/80 bg-[#FEF08A]/45 p-4">
              <p className="flex items-center gap-1.5 text-xs font-bold text-stone-900">
                <Layers className="h-4 w-4" aria-hidden="true" />
                <span>Mechanika LIFO od góry</span>
              </p>
              <p className="mt-1 text-xs leading-relaxed text-stone-700">
                Nowe karteczki zawsze lądują w lewym górnym rogu głównego strumienia, a strefa „Przypięte przez Zarząd” chroni maksymalnie 4 priorytety.
              </p>
            </div>
            <div className="rounded-xl border border-stone-200/80 bg-[#BAE6FD]/45 p-4">
              <p className="flex items-center gap-1.5 text-xs font-bold text-stone-900">
                <Radio className="h-4 w-4" aria-hidden="true" />
                <span>Zero tarcia dla studentów</span>
              </p>
              <p className="mt-1 text-xs leading-relaxed text-stone-700">
                Członkowie wchodzą przez prywatny link <code className="font-mono">/b/slug</code>, a Zarząd korzysta z Multi-Tenant Switchera lub klucza awaryjnego.
              </p>
            </div>
            <div className="rounded-xl border border-stone-200/80 bg-[#BBF7D0]/45 p-4">
              <p className="flex items-center gap-1.5 text-xs font-bold text-stone-900">
                <Database className="h-4 w-4" aria-hidden="true" />
                <span>Dwukierunkowy CRM WSKZ</span>
              </p>
              <p className="mt-1 text-xs leading-relaxed text-stone-700">
                Wypychanie webhookiem <code className="font-mono">/api/crm/push</code> oraz zaciąganie harmonogramu przez <code className="font-mono">/api/crm/import</code> i tryb <code className="font-mono">?embed=true</code>.
              </p>
            </div>
          </div>
        </section>

        <Suspense
          fallback={
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="h-44 animate-pulse rounded-2xl bg-white/70" />
              <div className="h-44 animate-pulse rounded-2xl bg-white/70" />
            </div>
          }
        >
          <EcosystemBoardsSection />
        </Suspense>
      </main>
    </div>
  );
}
