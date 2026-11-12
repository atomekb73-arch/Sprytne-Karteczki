-- ============================================================================
-- Sprytne Karteczki (Karteczki WSKZ) — Dane startowe (Seed: 17 jednostek WSKZ)
-- Uwaga: w produkcji zmień domyślne awaryjne klucze Zarządu przez RPC
-- `public.rotate_board_admin_token(board_id, new_token)`.
-- ============================================================================

INSERT INTO public.organizations (
  tenant_id, form_unit_id, unit_type, club_number, name, full_name, list_name, short_name,
  badge_code, email, icon_name, emoji, primary_hex, light_bg_hex, tailwind_accent,
  crm_system, sort_order
)
VALUES
  ('biuro-dziekana', 'Biuro Dziekana', 'admin', NULL, 'Biuro Dziekana WSKZ', 'Biuro Dziekana WSKZ', 'Biuro Dziekana', 'Dziekanat', 'DZIEKANA', 'biuro.dziekanawp@wskz.pl', 'Building2', '🏛️', '#1E293B', '#F1F5F9', 'slate', 'samorzad_kancelaria', 1),
  ('samorzad-studencki', 'Samorząd Studencki', 'admin', NULL, 'Samorząd Studencki WSKZ', 'Samorząd Studencki WSKZ', 'Samorząd Studencki', 'Samorząd', 'SAMORZĄD', 'samorzad@wskz.pl', 'Users', '🤝', '#0284C7', '#E0F2FE', 'sky', 'samorzad_kancelaria', 2),
  ('wydarzenia-ogolnewydzialowe', 'Wydarzenia Ogólnowydziałowe', 'admin', NULL, 'Wydział Nauk Społecznych WSKZ', 'Wydział Nauk Społecznych WSKZ', 'Wydarzenia Ogólnowydziałowe', 'Wydział', 'OGÓLNE', 'biuro.dziekanawp@wskz.pl', 'GraduationCap', '🎓', '#334155', '#F8FAFC', 'slate', 'samorzad_kancelaria', 3),
  ('skn-psychologii-klinicznej', 'SKN Psychologii Klinicznej', 'club', 1, 'Koło Naukowe Psychologii Klinicznej', 'Koło Naukowe Psychologii Klinicznej', '01 SKN Psychologii Klinicznej', 'SKN Psychologii Klinicznej', 'KLINICZNA', 'kolo.kliniczna@wskz.pl', 'Brain', '🧠', '#6D28D9', '#EDE9FE', 'violet', 'crm_kola_naukowe', 10),
  ('skn-psychotraumatologii-integrum', 'SKN Psychotraumatologii - Integrum', 'club', 2, 'Koło Naukowe Psychotraumatologii - Integrum', 'Koło Naukowe Psychotraumatologii - Integrum', '02 SKN Psychotraumatologii', 'SKN Psychotraumatologii', 'INTEGRUM', 'kolo.psychotraumatologii@wskz.pl', 'Puzzle', '🧩', '#BE185D', '#FCE7F3', 'pink', 'crm_kola_naukowe', 11),
  ('skn-psychoterapii', 'SKN Psychoterapii', 'club', 3, 'Koło Naukowe Psychoterapii', 'Koło Naukowe Psychoterapii', '03 SKN Psychoterapii', 'SKN Psychoterapii', 'TERAPII', 'kolo.psychoterapii@wskz.pl', 'Armchair', '🛋️', '#DB2777', '#FDF2F8', 'pink', 'crm_kola_naukowe', 12),
  ('skn-psychologii-kryminalnej', 'SKN Psychologii Kryminalnej', 'club', 4, 'Koło Naukowe Psychologii Kryminalnej', 'Koło Naukowe Psychologii Kryminalnej', '04 SKN Psychologii Kryminalnej', 'SKN Psychologii Kryminalnej', 'KRYMINALNA', 'kolo.kryminalna@wskz.pl', 'Search', '🔍', '#B45309', '#FEF3C7', 'amber', 'crm_kola_naukowe', 13),
  ('skn-psychologii-zachowan-ryzykownych', 'SKN Psychologii Zachowań Ryzykownych', 'club', 5, 'Koło Naukowe Psychologii Zachowań Ryzykownych', 'Koło Naukowe Psychologii Zachowań Ryzykownych', '05 SKN Zachowań Ryzykownych', 'SKN Zachowań Ryzykownych', 'UZALEŻNIEŃ', 'kolo.ryzykowne@wskz.pl', 'Flame', '🔗', '#C2410C', '#FFEDD5', 'orange', 'crm_kola_naukowe', 14),
  ('skn-psychologii-spolecznej-i-ewolucyjnej', 'SKN Psychologii Społecznej i Ewolucyjnej', 'club', 6, 'Koło Naukowe Psychologii Społecznej i Ewolucyjnej', 'Koło Naukowe Psychologii Społecznej i Ewolucyjnej', '06 SKN Społecznej i Ewolucyjnej', 'SKN Społecznej i Ewolucyjnej', 'EWOLUCYJNA', 'kolo.spoleczna@wskz.pl', 'Dna', '🧬', '#D97706', '#FEF3C7', 'amber', 'crm_kola_naukowe', 15),
  ('skn-psychoonkologii', 'SKN Psychoonkologii', 'club', 7, 'Koło Naukowe Psychoonkologii', 'Koło Naukowe Psychoonkologii', '07 SKN Psychoonkologii', 'SKN Psychoonkologii', 'ONKOLOGII', 'kolo.psychoonkologii@wskz.pl', 'Ribbon', '🎗️', '#0284C7', '#E0F2FE', 'sky', 'crm_kola_naukowe', 16),
  ('skn-psychofizjologii', 'SKN Psychofizjologii', 'club', 8, 'Koło Naukowe Psychofizjologii', 'Koło Naukowe Psychofizjologii', '08 SKN Psychofizjologii', 'SKN Psychofizjologii', 'FIZJOLOGII', 'kolo.psychofizjologii@wskz.pl', 'Zap', '⚡', '#0D9488', '#CCFBF1', 'teal', 'crm_kola_naukowe', 17),
  ('skn-psychologii-zdrowia-i-srodowiska', 'SKN Psychologii Zdrowia i Środowiska', 'club', 9, 'Koło Naukowe Psychologii Zdrowia i Środowiska', 'Koło Naukowe Psychologii Zdrowia i Środowiska', '09 SKN Zdrowia i Środowiska', 'SKN Zdrowia i Środowiska', 'ZDROWIA', 'kolo.zdrowia@wskz.pl', 'Leaf', '🔬', '#059669', '#D1FAE5', 'emerald', 'crm_kola_naukowe', 18),
  ('skn-seksuologii', 'SKN Seksuologii', 'club', 10, 'Koło Naukowe Seksuologii', 'Koło Naukowe Seksuologii', '10 SKN Seksuologii', 'SKN Seksuologii', 'SEKSUOLOGII', 'kn.seksuologii@wskz.pl', 'Heart', '💚', '#16A34A', '#DCFCE7', 'green', 'crm_kola_naukowe', 19),
  ('skn-rozwoju-dzieci-i-mlodziezy', 'SKN Rozwoju Dzieci i Młodzieży', 'club', 11, 'Koło Naukowe Rozwoju Dzieci i Młodzieży', 'Koło Naukowe Rozwoju Dzieci i Młodzieży', '11 SKN Rozwoju Dzieci', 'SKN Rozwoju Dzieci', 'ROZWOJU', 'kolo.rozwojudzieci@wskz.pl', 'Sparkles', '🪁', '#A21CAF', '#FAE8FF', 'fuchsia', 'crm_kola_naukowe', 20),
  ('skn-krytycznego-myslenia', 'SKN Krytycznego Myślenia', 'club', 12, 'Koło Naukowe Krytycznego Myślenia', 'Koło Naukowe Krytycznego Myślenia', '12 SKN Krytycznego Myślenia', 'SKN Krytycznego Myślenia', 'MYŚLENIA', 'kolo.krytycznegomyslenia@wskz.pl', 'HelpCircle', '♟️', '#7E22CE', '#F3E8FF', 'purple', 'crm_kola_naukowe', 21),
  ('skn-reklamy-pr-i-marketingu', 'SKN Reklamy, PR i Marketingu', 'club', 13, 'Koło Naukowe Reklamy, PR i Marketingu', 'Koło Naukowe Reklamy, PR i Marketingu', '13 SKN Reklamy, PR i Marketingu', 'SKN Reklamy, PR i Marketingu', 'REKLAMY', 'kolo.reklamy@wskz.pl', 'Target', '🎯', '#E11D48', '#FFE4E6', 'rose', 'crm_kola_naukowe', 22),
  ('skn-startupow', 'SKN Start-upów', 'club', 14, 'Koło Naukowe Nowoczesnego Zarządzania i Start-upów', 'Koło Naukowe Nowoczesnego Zarządzania i Start-upów', '14 SKN Start-upów', '14 SKN Start-upów', 'STARTUP', 'kolo.startup@wskz.pl', 'Rocket', '🚀', '#10B981', '#D1FAE5', 'emerald', 'crm_kola_naukowe', 23)
ON CONFLICT (tenant_id) DO UPDATE
SET form_unit_id = EXCLUDED.form_unit_id,
    unit_type = EXCLUDED.unit_type,
    club_number = EXCLUDED.club_number,
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    list_name = EXCLUDED.list_name,
    short_name = EXCLUDED.short_name,
    badge_code = EXCLUDED.badge_code,
    email = EXCLUDED.email,
    icon_name = EXCLUDED.icon_name,
    emoji = EXCLUDED.emoji,
    primary_hex = EXCLUDED.primary_hex,
    light_bg_hex = EXCLUDED.light_bg_hex,
    tailwind_accent = EXCLUDED.tailwind_accent,
    crm_system = EXCLUDED.crm_system,
    sort_order = EXCLUDED.sort_order;

INSERT INTO public.boards (id, tenant_id, title, description, access_slug, is_locked)
VALUES
  ('11111111-1111-4111-8111-111111111101', 'skn-seksuologii', 'Burza mózgów — Semestr Letni 2026', 'Otwarta tablica pomysłów na badania, konferencje i integrację członków SKN Seksuologii.', 'skn-seksuologii-8f92', false),
  ('11111111-1111-4111-8111-111111111102', 'samorzad-studencki', 'Kancelaria Samorządu — Postulaty i Wydarzenia 2026', 'Tablica inicjatyw studenckich, spraw pilnych oraz projektów Juwenaliów i Dni Adaptacyjnych.', 'samorzad-studencki-2026', false),
  ('11111111-1111-4111-8111-111111111103', 'biuro-dziekana', 'Inicjatywy Jakości Kształcenia i Sprawy Dziekańskie', 'Przestrzeń na usprawnienia organizacyjne, dydaktyczne oraz komunikację ze studentami.', 'biuro-dziekana-2026', false),
  ('11111111-1111-4111-8111-111111111104', 'wydarzenia-ogolnewydzialowe', 'Sympozja i Konferencje Ogólnowydziałowe WSKZ', 'Koordynacja tematów wspólnych wydarzeń międzykołowych, debat i dni otwartych.', 'wydarzenia-ogolne-2026', false),
  ('11111111-1111-4111-8111-111111111105', 'skn-psychologii-klinicznej', 'Plan Pracy Naukowej i Warsztatów Klinicznych', 'Zbieramy tematy case studies, przeglądów systematycznych oraz warsztatów diagnostycznych.', 'skn-psychologii-klinicznej-4c18', false),
  ('11111111-1111-4111-8111-111111111106', 'skn-psychotraumatologii-integrum', 'Seminaria Integrum — Interwencja Kryzysowa', 'Zgłoszenia tematów spotkań z praktykami oraz projektów psychoedukacyjnych.', 'skn-integrum-2026', false),
  ('11111111-1111-4111-8111-111111111107', 'skn-psychoterapii', 'Przegląd Nurtów Psychoterapeutycznych i Superwizje', 'Pomysły na spotkania gościnne z certyfikowanymi psychoterapeutami i analizę przypadków.', 'skn-psychoterapii-2026', false),
  ('11111111-1111-4111-8111-111111111108', 'skn-psychologii-kryminalnej', 'Profilowanie i Psychologia Sądowa — Pomysły 2026', 'Propozycje kazusów, analiz akt oraz wspólnych debat kryminologicznych.', 'skn-kryminalnej-2026', false),
  ('11111111-1111-4111-8111-111111111109', 'skn-psychologii-zachowan-ryzykownych', 'Profilaktyka Uzależnień i Nowe Projekty Badawcze', 'Koncepcje kampanii świadomościowych i artykułów o uzależnieniach behawioralnych.', 'skn-ryzykownych-2026', false),
  ('11111111-1111-4111-8111-111111111110', 'skn-psychologii-spolecznej-i-ewolucyjnej', 'Eksperymenty Społeczne i Psychologia Ewolucyjna', 'Pomysły na replikacje klasycznych badań oraz kwestionariusze online.', 'skn-spolecznej-2026', false),
  ('11111111-1111-4111-8111-111111111111', 'skn-psychoonkologii', 'Wsparcie Pacjenta i Zespołów Medycznych', 'Inicjatywy warsztatowe, publikacje oraz współpraca ze środowiskiem medycznym.', 'skn-psychoonkologii-2026', false),
  ('11111111-1111-4111-8111-111111111112', 'skn-psychofizjologii', 'Neuroobrazowanie, Biofeedback i Pomiary EEG', 'Propozycje warsztatów metodologicznych i projektów z neuropsychologii.', 'skn-psychofizjologii-2026', false),
  ('11111111-1111-4111-8111-111111111113', 'skn-psychologii-zdrowia-i-srodowiska', 'Dobrostan, Ekopsychologia i Styl Życia', 'Zgłoszenia projektów badawczych dotyczących jakości życia i zdrowia psychicznego.', 'skn-zdrowia-2026', false),
  ('11111111-1111-4111-8111-111111111114', 'skn-rozwoju-dzieci-i-mlodziezy', 'Psychologia Wychowawcza i Rozwój Nastolatków', 'Materiały edukacyjne dla rodziców, webinary i tematy prac zespołowych.', 'skn-rozwoju-2026', false),
  ('11111111-1111-4111-8111-111111111115', 'skn-krytycznego-myslenia', 'Turniej Debat Oksfordzkich i Logika Argumentacji', 'Propozycje tez debat oraz przegląd błędów poznawczych w mediach.', 'skn-krytycznego-2026', false),
  ('11111111-1111-4111-8111-111111111116', 'skn-reklamy-pr-i-marketingu', 'Kampanie Społeczne i Psychologia Konsumenta', 'Briefy kreatywne, promocja inicjatyw WSKZ oraz analiza trendów w PR.', 'skn-reklamy-2026', false),
  ('11111111-1111-4111-8111-111111111117', 'skn-startupow', 'Inkubator Pomysłów i Przedsiębiorczość Akademicka', 'Pitchowanie projektów studenckich, hackathon oraz spotkania z mentorami.', 'skn-startupow-2026', false)
ON CONFLICT (access_slug) DO NOTHING;

-- Domyślne klucze awaryjne Zarządu dla tablic startowych (do testów ?admin=WSKZ-ZARZAD-2026)
INSERT INTO private.board_admin_secrets (board_id, admin_token_hash)
SELECT b.id, private.hash_admin_token('WSKZ-ZARZAD-2026')
FROM public.boards b
ON CONFLICT (board_id) DO NOTHING;

-- Przykładowe karteczki (przypięte + strumień LIFO + w realizacji CRM)
INSERT INTO public.sticky_notes (
  id, board_id, tenant_id, content, author_name, color, rotation_deg,
  upvotes, is_pinned, pinned_at, sent_to_crm, sent_to_crm_at, created_at
)
VALUES
  (
    '22222222-2222-4222-8222-222222222201',
    '11111111-1111-4111-8111-111111111101',
    'skn-seksuologii',
    'Priorytet semestru: Ogólnopolska Studencka Konferencja Interdyscyplinarna w maju. Zbieramy propozycje paneli eksperckich i abstraktów do końca miesiąca!',
    'Zarząd SKN (Zofia K.)',
    'blue',
    -0.55,
    18,
    true,
    now() - interval '6 days',
    true,
    now() - interval '2 days',
    now() - interval '6 days'
  ),
  (
    '22222222-2222-4222-8222-222222222202',
    '11111111-1111-4111-8111-111111111101',
    'skn-seksuologii',
    'Potrzebujemy 3 osób do redakcji i korekty nowej broszury psychoedukacyjnej o komunikacji w relacjach — wpiszcie w treści lub na spotkaniu Meet w czwartek.',
    'Marek Zieliński',
    'purple',
    0.62,
    12,
    true,
    now() - interval '5 days',
    false,
    null,
    now() - interval '5 days'
  ),
  (
    '22222222-2222-4222-8222-222222222203',
    '11111111-1111-4111-8111-111111111101',
    'skn-seksuologii',
    'Przegląd literatury: wpływ mediów społecznościowych na obraz ciała i intymność u młodych dorosłych (artykuł przeglądowy do zeszytu naukowego WSKZ).',
    'dr n. społ. Anna Nowak (opiekun)',
    'green',
    -0.30,
    15,
    false,
    null,
    true,
    now() - interval '1 day',
    now() - interval '3 days'
  ),
  (
    '22222222-2222-4222-8222-222222222204',
    '11111111-1111-4111-8111-111111111101',
    'skn-seksuologii',
    'Część nowych członków ma problem ze znalezieniem linków do nagrań spotkań Google Meet — przydałby się jeden przypięty indeks na dysku Koła.',
    'Karolina W.',
    'pink',
    0.85,
    9,
    false,
    null,
    false,
    null,
    now() - interval '2 days'
  ),
  (
    '22222222-2222-4222-8222-222222222205',
    '11111111-1111-4111-8111-111111111101',
    'skn-seksuologii',
    'A gdyby zrobić cykl krótkich rolek Q&A z obalaniem najczęstszych mitów naukowych na Instagramie Koła? Mogę przygotować pierwszą listę pytań.',
    'Jakub S.',
    'yellow',
    -0.75,
    7,
    false,
    null,
    false,
    null,
    now() - interval '12 hours'
  ),
  (
    '22222222-2222-4222-8222-222222222206',
    '11111111-1111-4111-8111-111111111102',
    'samorzad-studencki',
    'Uruchomienie cyklicznych dyżurów online Kancelarii Samorządu w każdy wtorek o 18:00 — wniosek po ankiecie satysfakcji studentów.',
    'Prezydium Samorządu',
    'blue',
    0.40,
    24,
    true,
    now() - interval '4 days',
    true,
    now() - interval '1 day',
    now() - interval '4 days'
  ),
  (
    '22222222-2222-4222-8222-222222222207',
    '11111111-1111-4111-8111-111111111102',
    'samorzad-studencki',
    'Prośba o doprecyzowanie zasad rozliczania mikrograntów dla Kół Naukowych przed konferencjami wyjazdowymi.',
    'Julia K.',
    'pink',
    -0.45,
    14,
    false,
    null,
    false,
    null,
    now() - interval '1 day'
  )
ON CONFLICT (id) DO NOTHING;
