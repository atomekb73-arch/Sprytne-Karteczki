# Sprytne Karteczki (Karteczki WSKZ)

Ultralekka aplikacja PWA w architekturze **Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + Supabase** dla Kół Naukowych oraz Samorządu Studenckiego WSKZ.

## Szybkie uruchomienie lokalne

1. Skopiuj plik konfiguracyjny środowiska:
   ```bash
   cp .env.example .env.local
   ```
2. Wpisz zmienne Supabase (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`), `WSKZ_CRM_API_KEY` oraz opcjonalne webhooki CRM (do lokalnych testów wystarczy `CRM_ALLOW_DRY_RUN=true`).
3. W panelu SQL projektu Supabase uruchom kolejno:
   - `supabase/migrations/202611120001_init_sprytne_karteczki.sql`
   - `supabase/seed.sql` (dane startowe organizacji WSKZ, tablic i przykładowych karteczek)
4. Zainstaluj zależności (jeśli nie są jeszcze obecne) i uruchom serwer deweloperski:
   ```bash
   npm install
   npm run dev
   ```

## Dostęp i role

- **Członkowie (bez logowania):** `/b/skn-seksuologii-8f92` (lub inna tablica po `access_slug`)
- **Zarząd (Supabase Auth + Multi-Tenant Switcher):** `/login` (wymaga wpisu w `public.admin_permissions`)
- **Tryb awaryjny Zarządu (klucz w URL):** `/b/skn-seksuologii-8f92?admin=WSKZ-ZARZAD-2026`
- **Osadzanie w CRM (`iframe`):** `/b/skn-seksuologii-8f92?embed=true`
- **Odczyt offline (PWA):** `/offline`

## Integracja CRM

- **Wypychanie karteczek (`POST /api/crm/push`):** weryfikuje sesję Zarządu lub awaryjny token tablicy, sprawdza `organizations.crm_system` (`samorzad_kancelaria` / `crm_kola_naukowe`), wysyła payload JSON na odpowiedni webhook i ustawia `sent_to_crm = true` (stempel `W REALIZACJI (CRM)`).
- **Import do harmonogramu CRM (`GET /api/crm/import?tenant_id=...&min_upvotes=...`):** zabezpieczony nagłówkiem `x-wskz-api-key` porównywanym czasowo-staliście z `WSKZ_CRM_API_KEY`.
