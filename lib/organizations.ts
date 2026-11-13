import type { CrmSystem } from "@/lib/constants";
import type { OrganizationRecord } from "@/types/board";

/**
 * WSKZ Ecosystem - Shared Organizations & Academic Clubs Configuration
 *
 * Oficjalny słownik jednostek wydziałowych i Kół Naukowych WSKZ (KN-001 do KN-018)
 * z aktualnymi adresami e-mail, opiekunami naukowymi i zakresami działalności.
 */

export interface OrganizationUnit {
  id: string;              // Identyfikator systemowy zgodny z formularzami i bazą danych
  slug: string;            // URL-friendly unikalny identyfikator
  clubNumber?: number;     // Numer koła (1-18) lub undefined dla jednostek wydziałowych
  type: "admin" | "club";  // Typ jednostki
  faculty?: string;        // Wydział / Jednostka nadrzędna
  supervisor?: string;     // Opiekun naukowy
  status?: "Aktywne" | "Zawieszone"; // Status działalności koła
  description?: string;    // Opis / zakres działalności
  notes?: string;          // Uwagi / notatki (np. terminy spotkań, wakaty)
  name: string;            // Nazwa krótka z numeracją do list i sidebarów
  fullName: string;        // Pełna oficjalna nazwa statutowa
  shortName: string;       // Etykieta skrócona do widoków kompaktowych
  code: string;            // Kod alfanumeryczny na plakietki / badże (max 11 znaków)
  email?: string;          // Oficjalny uczelniany adres e-mail / skrzynka koła
  icon: string;            // Nazwa wektorowej ikony z pakietu 'lucide-react'
  emoji: string;           // Znak emoji pomocniczy dla interfejsów tekstowych
  color: string;           // Kolor główny / akcentujący HEX
  bgLight: string;         // Jasne tło HEX (np. pod ikony, tagi, stany hover)
  accentColor: string;     // Odpowiednik koloru w palecie Tailwind CSS
}

export const ORGANIZATIONS_CONFIG: OrganizationUnit[] = [
  // --------------------------------------------------------------------------
  // JEDNOSTKI ADMINISTRACYJNE I OGÓLNOWYDZIAŁOWE
  // --------------------------------------------------------------------------
  {
    id: "Biuro Dziekana",
    slug: "biuro-dziekana",
    type: "admin",
    name: "Biuro Dziekana",
    fullName: "Biuro Dziekana WSKZ",
    shortName: "Dziekanat",
    code: "DZIEKANA",
    email: "biuro.dziekanawp@wskz.pl",
    icon: "Building2",
    emoji: "🏛️",
    color: "#1E293B",
    bgLight: "#F1F5F9",
    accentColor: "slate",
  },
  {
    id: "Samorząd Studencki",
    slug: "samorzad-studencki",
    type: "admin",
    name: "Samorząd Studencki",
    fullName: "Samorząd Studencki WSKZ",
    shortName: "Samorząd",
    code: "SAMORZĄD",
    email: "samorzad@wskz.pl",
    icon: "Users",
    emoji: "🤝",
    color: "#0284C7",
    bgLight: "#E0F2FE",
    accentColor: "sky",
  },
  {
    id: "Wydarzenia Ogólnowydziałowe",
    slug: "wydarzenia-ogolnewydzialowe",
    type: "admin",
    name: "Wydarzenia Ogólnowydziałowe",
    fullName: "Wydział Nauk Społecznych WSKZ",
    shortName: "Wydział",
    code: "OGÓLNE",
    email: "biuro.dziekanawp@wskz.pl",
    icon: "GraduationCap",
    emoji: "🎓",
    color: "#334155",
    bgLight: "#F8FAFC",
    accentColor: "slate",
  },

  // --------------------------------------------------------------------------
  // STUDENCKIE KOŁA NAUKOWE (KN-001 DO KN-018)
  // --------------------------------------------------------------------------
  {
    id: "SKN Psychologii Klinicznej",
    slug: "skn-psychologii-klinicznej",
    clubNumber: 1,
    type: "club",
    faculty: "Wydział Psychologii",
    supervisor: "mgr Tymoteusz Czerhoniak",
    status: "Aktywne",
    name: "01 SKN Psychologii Klinicznej",
    fullName: "SKN Psychologii Klinicznej",
    shortName: "SKN Psychologii Klinicznej",
    code: "KLINICZNA",
    email: "skn.kliniczna@wskz.pl",
    description: "Diagnoza psychologiczna, nozologia zaburzeń psychicznych, metody pomocy psychologicznej oraz studia przypadków klinicznych.",
    icon: "Brain",
    emoji: "🧠",
    color: "#6D28D9",
    bgLight: "#EDE9FE",
    accentColor: "violet",
  },
  {
    id: "SKN Psychotraumatologii - Integrum",
    slug: "skn-psychotraumatologii-integrum",
    clubNumber: 2,
    type: "club",
    faculty: "Wydział Psychologii",
    supervisor: "dr hab. Grażyna Dolińska-Zygmunt",
    status: "Aktywne",
    name: "02 SKN Psychotraumatologii",
    fullName: "SKN Psychotraumatologii - Integrum",
    shortName: "SKN Psychotraumatologii",
    code: "INTEGRUM",
    email: "kolo.integrum@wskz.pl",
    description: "Badania nad traumą psychiczną, PTSD i CPTSD, interwencja kryzysowa, seminaria psychotraumatologii klinicznej oraz psychoedukacja.",
    icon: "Puzzle",
    emoji: "🧩",
    color: "#BE185D",
    bgLight: "#FCE7F3",
    accentColor: "pink",
  },
  {
    id: "SKN Psychoterapii",
    slug: "skn-psychoterapii",
    clubNumber: 3,
    type: "club",
    faculty: "Wydział Psychologii",
    supervisor: "dr Agnieszka Turkiewicz-Maligranda",
    status: "Zawieszone",
    notes: "Działalność koła zawieszona",
    name: "03 SKN Psychoterapii",
    fullName: "SKN Psychoterapii",
    shortName: "SKN Psychoterapii",
    code: "TERAPII",
    email: "kolo.psychoterapia@gmail.com",
    description: "Rozwój warsztatu terapeutycznego, praca kliniczna w różnych nurtach psychoterapii, studia przypadków i warsztaty praktyczne.",
    icon: "Armchair",
    emoji: "🛋️",
    color: "#DB2777",
    bgLight: "#FDF2F8",
    accentColor: "pink",
  },
  {
    id: "SKN Psychologii Kryminalnej",
    slug: "skn-psychologii-kryminalnej",
    clubNumber: 4,
    type: "club",
    faculty: "Wydział Psychologii",
    supervisor: "Wakat (w trakcie powoływania)",
    status: "Aktywne",
    name: "04 SKN Psychologii Kryminalnej",
    fullName: "SKN Psychologii Kryminalnej",
    shortName: "SKN Psychologii Kryminalnej",
    code: "KRYMINALNA",
    email: "skn.kryminalna@wskz.pl",
    description: "Profilowanie sprawców, wiktymologia, psychologia zeznań świadków, motywacja zachowań przestępczych oraz psychologia sądowa.",
    icon: "Search",
    emoji: "🔍",
    color: "#B45309",
    bgLight: "#FEF3C7",
    accentColor: "amber",
  },
  {
    id: "SKN Psychologii Zachowań Ryzykownych i Uzależnień",
    slug: "skn-psychologii-zachowan-ryzykownych",
    clubNumber: 5,
    type: "club",
    faculty: "Wydział Psychologii",
    supervisor: "Wakat (w trakcie powoływania)",
    status: "Aktywne",
    name: "05 SKN Zachowań Ryzykownych i Uzależnień",
    fullName: "SKN Psychologii Zachowań Ryzykownych i Uzależnień",
    shortName: "SKN Uzależnień",
    code: "UZALEŻNIEŃ",
    email: "skn.uzaleznienia@wskz.pl",
    description: "Mechanizmy uzależnień behawioralnych i chemicznych, profilaktyka zachowań ryzykownych oraz strategie redukcji szkód.",
    icon: "Flame",
    emoji: "🔗",
    color: "#C2410C",
    bgLight: "#FFEDD5",
    accentColor: "orange",
  },
  {
    id: "SKN Psychologii Społecznej i Ewolucyjnej",
    slug: "skn-psychologii-spolecznej-i-ewolucyjnej",
    clubNumber: 6,
    type: "club",
    faculty: "Wydział Psychologii",
    supervisor: "dr Wiktoria Jędryczka",
    notes: "Nowy opiekun: dr Wiktoria Jędryczka",
    status: "Aktywne",
    name: "06 SKN Społecznej i Ewolucyjnej",
    fullName: "SKN Psychologii Społecznej i Ewolucyjnej",
    shortName: "SKN Społecznej i Ewolucyjnej",
    code: "EWOLUCYJNA",
    email: "skn.spoleczna@wskz.pl",
    description: "Badanie mechanizmów wpływu społecznego, psychologia ewolucyjna zachowań interpersonalnych, procesy grupowe i normy kulturowe.",
    icon: "Dna",
    emoji: "🧬",
    color: "#D97706",
    bgLight: "#FEF3C7",
    accentColor: "amber",
  },
  {
    id: "SKN Psychoonkologii",
    slug: "skn-psychoonkologii",
    clubNumber: 7,
    type: "club",
    faculty: "Wydział Psychologii",
    supervisor: "mgr Joanna Głowacka",
    status: "Aktywne",
    name: "07 SKN Psychoonkologii",
    fullName: "SKN Psychoonkologii",
    shortName: "SKN Psychoonkologii",
    code: "ONKOLOGII",
    email: "skn.psychoonkologia@wskz.pl",
    description: "Wsparcie psychologiczne pacjentów onkologicznych i ich rodzin, adaptacja do choroby przewlekłej oraz profilaktyka wypalenia.",
    icon: "Ribbon",
    emoji: "🎗️",
    color: "#0284C7",
    bgLight: "#E0F2FE",
    accentColor: "sky",
  },
  {
    id: "SKN Psychofizjologii",
    slug: "skn-psychofizjologii",
    clubNumber: 8,
    type: "club",
    faculty: "Wydział Psychologii",
    supervisor: "Wakat (w trakcie powoływania)",
    status: "Aktywne",
    name: "08 SKN Psychofizjologii",
    fullName: "SKN Psychofizjologii",
    shortName: "SKN Psychofizjologii",
    code: "FIZJOLOGII",
    email: "skn.psychofizjologia@wskz.pl",
    description: "Biologiczne podstawy procesów psychicznych, biofeedback, neuroobrazowanie oraz reakcje fizjologiczne na stres i emocje.",
    icon: "Zap",
    emoji: "⚡",
    color: "#0D9488",
    bgLight: "#CCFBF1",
    accentColor: "teal",
  },
  {
    id: "SKN Psychologii Zdrowia i Środowiska",
    slug: "skn-psychologii-zdrowia-i-srodowiska",
    clubNumber: 9,
    type: "club",
    faculty: "Wydział Psychologii",
    supervisor: "mgr Joanna Głowacka",
    status: "Aktywne",
    name: "09 SKN Zdrowia i Środowiska",
    fullName: "SKN Psychologii Zdrowia i Środowiska",
    shortName: "SKN Zdrowia i Środowiska",
    code: "ZDROWIA",
    email: "psychologia.zdrowia@wskz.pl",
    description: "Wpływ środowiska i stresu na zdrowie psychosomatyczne, profilaktyka zdrowia psychicznego, psychologia ekologiczna i dobrostan.",
    icon: "Leaf",
    emoji: "🔬",
    color: "#059669",
    bgLight: "#D1FAE5",
    accentColor: "emerald",
  },
  {
    id: "SKN Seksuologii",
    slug: "skn-seksuologii",
    clubNumber: 10,
    type: "club",
    faculty: "Wydział Psychologii",
    supervisor: "dr Martyna Dziekan, dr Ewa Skupińska",
    status: "Aktywne",
    name: "10 SKN Seksuologii",
    fullName: "SKN Seksuologii",
    shortName: "SKN Seksuologii",
    code: "SEKSUOLOGII",
    email: "kn.seksuologii@wskz.pl",
    description: "Opiekunowie: mgr M. Dziekan, dr Ewa Skupińska. Edukacja seksualna, poradnictwo i psychoseksuologia.",
    icon: "Heart",
    emoji: "💚",
    color: "#16A34A",
    bgLight: "#DCFCE7",
    accentColor: "green",
  },
  {
    id: "SKN Psychologii Rozwoju Dzieci i Młodzieży",
    slug: "skn-rozwoju-dzieci-i-mlodziezy",
    clubNumber: 11,
    type: "club",
    faculty: "Wydział Psychologii",
    supervisor: "Wakat (w trakcie powoływania)",
    notes: "Pierwsze spotkanie 13.11",
    status: "Aktywne",
    name: "11 SKN Rozwoju Dzieci i Młodzieży",
    fullName: "SKN Psychologii Rozwoju Dzieci i Młodzieży",
    shortName: "SKN Rozwoju Dzieci",
    code: "ROZWOJU",
    email: "skn.rozwoj@wskz.pl",
    description: "Prawidłowości i zaburzenia rozwoju poznawczo-emocjonalnego dzieci i młodzieży, metody wsparcia oraz psychologia wychowawcza.",
    icon: "Sparkles",
    emoji: "🪁",
    color: "#A21CAF",
    bgLight: "#FAE8FF",
    accentColor: "fuchsia",
  },
  {
    id: "SKN Warsztat Krytycznego Myślenia",
    slug: "skn-krytycznego-myslenia",
    clubNumber: 12,
    type: "club",
    faculty: "Wydział Psychologii",
    supervisor: "mgr Liwiusz Piurko",
    notes: "Nowy opiekun: mgr Liwiusz Piurko",
    status: "Aktywne",
    name: "12 SKN Warsztat Krytycznego Myślenia",
    fullName: "SKN Warsztat Krytycznego Myślenia",
    shortName: "SKN Krytycznego Myślenia",
    code: "MYŚLENIA",
    email: "warsztat.krytycznego@wskz.pl",
    description: "Krytyczna analiza informacji, weryfikacja źródeł naukowych, Journal Club, Klub Książki oraz zwalczanie dezinformacji.",
    icon: "HelpCircle",
    emoji: "♟️",
    color: "#7E22CE",
    bgLight: "#F3E8FF",
    accentColor: "purple",
  },
  {
    id: "SKN Reklamy, PR i Marketingu",
    slug: "skn-reklamy-pr-i-marketingu",
    clubNumber: 13,
    type: "club",
    faculty: "Wydział Psychologii",
    supervisor: "Wakat (w trakcie powoływania)",
    status: "Aktywne",
    name: "13 SKN Reklamy, PR i Marketingu",
    fullName: "SKN Reklamy, PR i Marketingu",
    shortName: "SKN Reklamy, PR i Marketingu",
    code: "REKLAMY",
    email: "kolo.pr@wskz.pl",
    description: "Psychologia w reklamie i marketingu, zachowania konsumenckie, employer branding, wizerunek w social mediach i etyka komunikacji.",
    icon: "Target",
    emoji: "🎯",
    color: "#E11D48",
    bgLight: "#FFE4E6",
    accentColor: "rose",
  },
  {
    id: "KN Geopolitica",
    slug: "kn-geopolitica",
    clubNumber: 14,
    type: "club",
    faculty: "Wydział Nauk Społecznych i Technicznych (WNS)",
    supervisor: "dr Łukasz Cymbaluk",
    notes: "Opiekun: dr Łukasz Cymbaluk",
    status: "Aktywne",
    name: "14 KN Geopolitica",
    fullName: "KN Geopolitica",
    shortName: "KN Geopolitica",
    code: "GEOPOLITYKA",
    email: "geopolitica@wskz.pl",
    description: "Analiza procesów geopolitycznych, bezpieczeństwa międzynarodowego, dyplomacji i konfliktów na świecie; debaty eksperckie oraz seminaria.",
    icon: "Globe",
    emoji: "🌍",
    color: "#0369A1",
    bgLight: "#E0F2FE",
    accentColor: "sky",
  },
  {
    id: "KN Cyber-AI / Human-AI - Fusion",
    slug: "kn-cyber-ai-human-ai-fusion",
    clubNumber: 15,
    type: "club",
    faculty: "Wydział Nauk Społecznych i Technicznych (WNS)",
    supervisor: "Wakat (w trakcie powoływania)",
    status: "Aktywne",
    name: "15 KN Cyber-AI / Human-AI - Fusion",
    fullName: "KN Cyber-AI / Human-AI - Fusion",
    shortName: "KN Cyber-AI",
    code: "CYBER-AI",
    email: "cyber.ai@wskz.pl",
    description: "Wpływ sztucznej inteligencji na człowieka i społeczeństwo, interakcja człowiek-komputer (HCI), etyka AI oraz cyberbezpieczeństwo.",
    icon: "Cpu",
    emoji: "🤖",
    color: "#4F46E5",
    bgLight: "#EEF2FF",
    accentColor: "indigo",
  },
  {
    id: "KN Prawa Karnego",
    slug: "kn-prawa-karnego",
    clubNumber: 16,
    type: "club",
    faculty: "Wydział Nauk Społecznych i Technicznych (WNS)",
    supervisor: "Wakat (w trakcie powoływania)",
    status: "Aktywne",
    name: "16 KN Prawa Karnego",
    fullName: "KN Prawa Karnego",
    shortName: "KN Prawa Karnego",
    code: "PRAWO",
    email: "kolo.pk@wskz.pl",
    description: "Materialne i procesowe prawo karne, kryminalistyka, symulacje rozpraw sądowych (moot court) oraz analiza orzecznictwa.",
    icon: "Scale",
    emoji: "⚖️",
    color: "#991B1B",
    bgLight: "#FEE2E2",
    accentColor: "red",
  },
  {
    id: "KN Administracji Samorządowej",
    slug: "kn-administracji-samorzadowej",
    clubNumber: 17,
    type: "club",
    faculty: "Wydział Nauk Społecznych i Technicznych (WNS)",
    supervisor: "Wakat (w trakcie powoływania)",
    status: "Aktywne",
    name: "17 KN Administracji Samorządowej",
    fullName: "KN Administracji Samorządowej",
    shortName: "KN Samorządowa",
    code: "SAMORZĄD",
    email: "kolo.ansso@wskz.pl",
    description: "Funkcjonowanie jednostek samorządu terytorialnego, prawo administracyjne, rozwój lokalny i partycypacja obywatelska.",
    icon: "Landmark",
    emoji: "🏛️",
    color: "#065F46",
    bgLight: "#D1FAE5",
    accentColor: "emerald",
  },
  {
    id: "KN HR Next",
    slug: "kn-hr-next",
    clubNumber: 18,
    type: "club",
    faculty: "Wydział Nauk Społecznych i Technicznych (WNS)",
    supervisor: "Wakat (w trakcie powoływania)",
    status: "Aktywne",
    name: "18 KN HR Next",
    fullName: "KN HR Next",
    shortName: "KN HR Next",
    code: "HR-NEXT",
    email: "hrnext@wskz.pl",
    description: "Nowoczesne zarządzanie zasobami ludzkimi, rekrutacja i talent management, psychologia pracy oraz narzędzia People Analytics.",
    icon: "Users",
    emoji: "👥",
    color: "#C026D3",
    bgLight: "#FAE8FF",
    accentColor: "fuchsia",
  },
  // Kompatybilność wsteczna z dotychczasowym wpisem start-upów
  {
    id: "SKN Start-upów",
    slug: "skn-startupow",
    type: "club",
    name: "SKN Start-upów",
    fullName: "Koło Naukowe Nowoczesnego Zarządzania i Start-upów",
    shortName: "SKN Start-upów",
    code: "STARTUP",
    email: "kolo.startup@wskz.pl",
    icon: "Rocket",
    emoji: "🚀",
    color: "#10B981",
    bgLight: "#D1FAE5",
    accentColor: "emerald",
  },
];

// --------------------------------------------------------------------------
// POMOCNICZE TABLICE I MAPY DO SZYBKIEGO WYSZUKIWANIA
// --------------------------------------------------------------------------

/** Tylko koła naukowe */
export const ACADEMIC_CLUBS = ORGANIZATIONS_CONFIG.filter(
  (org) => org.type === "club"
);

/** Tylko administracja i samorząd */
export const ADMIN_UNITS = ORGANIZATIONS_CONFIG.filter(
  (org) => org.type === "admin"
);

/** Szybki słownik O(1) po kluczach id, slug, name, fullName, shortName oraz code */
export const ORGANIZATIONS_MAP = ORGANIZATIONS_CONFIG.reduce<
  Record<string, OrganizationUnit>
>((acc, org) => {
  acc[org.id] = org;
  acc[org.slug] = org;
  acc[org.code] = org;
  if (org.name) acc[org.name] = org;
  if (org.fullName) acc[org.fullName] = org;
  if (org.shortName) acc[org.shortName] = org;
  return acc;
}, {});

const ORGANIZATIONS_LOWER_MAP = Object.entries(ORGANIZATIONS_MAP).reduce<
  Record<string, OrganizationUnit>
>((acc, [key, value]) => {
  acc[key.toLocaleLowerCase("pl")] = value;
  return acc;
}, {});

/** Bezpieczny resolver jednostki przyjmujący dowolny identyfikator lub nazwę */
export function getOrganizationUnit(
  identifier: string | null | undefined
): OrganizationUnit | null {
  if (!identifier) return null;
  const trimmed = identifier.trim();
  if (!trimmed) return null;
  return (
    ORGANIZATIONS_MAP[trimmed] ||
    ORGANIZATIONS_LOWER_MAP[trimmed.toLocaleLowerCase("pl")] ||
    null
  );
}

// --------------------------------------------------------------------------
// WARSTWA KOMPATYBILNOŚCI DLA SPRYTNYCH KARTECZEK (BAZA SUPABASE + CRM)
// --------------------------------------------------------------------------

export const ALL_VIEWS_UNIT = {
  lp: null,
  tenant_id: "all",
  aliases: ["wszystkie"],
  name: "Wszystkie widoki",
  short_name: "Wszystkie",
  badge_code: "WSZYSTKIE",
  icon_name: "LayoutGrid",
  emoji: "🗂️",
  primary_hex: "#0F172A",
  light_bg_hex: "#F1F5F9",
  tailwind_accent: "slate",
  sort_order: 0,
} as const;

export interface WskzUnitCatalogEntry {
  lp: string | null;
  tenant_id: string;
  form_unit_id: string;
  unit_type: "admin" | "club";
  club_number: number | null;
  name: string;
  list_name: string;
  short_name: string;
  badge_code: string;
  email: string | null;
  icon_name: string;
  emoji: string;
  primary_hex: string;
  light_bg_hex: string;
  tailwind_accent: string;
  crm_system: CrmSystem;
  sort_order: number;
}

export const WSKZ_ORGANIZATIONS_CATALOG: WskzUnitCatalogEntry[] =
  ORGANIZATIONS_CONFIG.map((unit, idx) => ({
    lp:
      unit.clubNumber !== undefined
        ? String(unit.clubNumber).padStart(2, "0")
        : null,
    tenant_id: unit.slug,
    form_unit_id: unit.id,
    unit_type: unit.type,
    club_number: unit.clubNumber ?? null,
    name: unit.fullName,
    list_name: unit.name,
    short_name: unit.shortName,
    badge_code: unit.code,
    email: unit.email ?? null,
    icon_name: unit.icon,
    emoji: unit.emoji,
    primary_hex: unit.color,
    light_bg_hex: unit.bgLight,
    tailwind_accent: unit.accentColor,
    crm_system:
      unit.type === "admin" ? "samorzad_kancelaria" : "crm_kola_naukowe",
    sort_order: unit.clubNumber !== undefined ? 9 + unit.clubNumber : idx + 1,
  }));

const CATALOG_BY_TENANT = new Map(
  WSKZ_ORGANIZATIONS_CATALOG.map((unit) => [unit.tenant_id, unit])
);

export interface ResolvedUnitMeta {
  tenant_id: string;
  form_unit_id: string;
  unit_type: "admin" | "club";
  club_number: number | null;
  name: string;
  list_name: string;
  short_name: string;
  badge_code: string;
  email: string | null;
  icon_name: string;
  emoji: string;
  primary_hex: string;
  light_bg_hex: string;
  tailwind_accent: string;
  sort_order: number;
}

export function resolveOrganizationMeta(
  org: Partial<OrganizationRecord> & { tenant_id: string; name?: string }
): ResolvedUnitMeta {
  const unit =
    getOrganizationUnit(org.tenant_id) ??
    getOrganizationUnit(org.form_unit_id) ??
    getOrganizationUnit(org.name);
  const catalog = unit ? CATALOG_BY_TENANT.get(unit.slug) : CATALOG_BY_TENANT.get(org.tenant_id);

  return {
    tenant_id: unit?.slug ?? org.tenant_id,
    form_unit_id:
      org.form_unit_id ?? catalog?.form_unit_id ?? org.name ?? org.tenant_id,
    unit_type: org.unit_type ?? catalog?.unit_type ?? "club",
    club_number: org.club_number ?? catalog?.club_number ?? null,
    name: org.full_name ?? catalog?.name ?? org.name ?? org.tenant_id,
    list_name: org.list_name ?? catalog?.list_name ?? org.name ?? org.tenant_id,
    short_name:
      catalog?.short_name ?? org.short_name ?? org.name ?? org.tenant_id,
    badge_code:
      catalog?.badge_code ??
      org.badge_code ??
      org.tenant_id.slice(0, 12).toUpperCase(),
    email: org.email ?? catalog?.email ?? null,
    icon_name: catalog?.icon_name ?? org.icon_name ?? "Sparkles",
    emoji: catalog?.emoji ?? org.emoji ?? "📌",
    primary_hex: catalog?.primary_hex ?? org.primary_hex ?? "#1C1917",
    light_bg_hex: catalog?.light_bg_hex ?? org.light_bg_hex ?? "#F5F5F4",
    tailwind_accent: catalog?.tailwind_accent ?? org.tailwind_accent ?? "stone",
    sort_order: org.sort_order ?? catalog?.sort_order ?? 100,
  };
}
