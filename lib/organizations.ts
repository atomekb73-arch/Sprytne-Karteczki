import type { CrmSystem } from "@/lib/constants";
import type { OrganizationRecord } from "@/types/board";

/**
 * WSKZ Ecosystem - Shared Organizations & Academic Clubs Configuration
 *
 * Wspólny słownik jednostek wydziałowych i Studenckich Kół Naukowych (SKN)
 * dla aplikacji: Generator Formularzy, CRM Kancelarii, CRM Kół Naukowych, Sprytne Karteczki.
 */

export interface OrganizationUnit {
  id: string;              // Identyfikator systemowy zgodny z formularzami i bazą danych
  slug: string;            // URL-friendly unikalny identyfikator
  clubNumber?: number;     // Numer koła (1-14) lub undefined dla jednostek wydziałowych
  type: "admin" | "club";  // Typ jednostki
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
  // STUDENCKIE KOŁA NAUKOWE (SKN 01 - 14)
  // --------------------------------------------------------------------------
  {
    id: "SKN Psychologii Klinicznej",
    slug: "skn-psychologii-klinicznej",
    clubNumber: 1,
    type: "club",
    name: "01 SKN Psychologii Klinicznej",
    fullName: "Koło Naukowe Psychologii Klinicznej",
    shortName: "SKN Psychologii Klinicznej",
    code: "KLINICZNA",
    email: "kolo.kliniczna@wskz.pl",
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
    name: "02 SKN Psychotraumatologii",
    fullName: "Koło Naukowe Psychotraumatologii - Integrum",
    shortName: "SKN Psychotraumatologii",
    code: "INTEGRUM",
    email: "kolo.psychotraumatologii@wskz.pl",
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
    name: "03 SKN Psychoterapii",
    fullName: "Koło Naukowe Psychoterapii",
    shortName: "SKN Psychoterapii",
    code: "TERAPII",
    email: "kolo.psychoterapii@wskz.pl",
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
    name: "04 SKN Psychologii Kryminalnej",
    fullName: "Koło Naukowe Psychologii Kryminalnej",
    shortName: "SKN Psychologii Kryminalnej",
    code: "KRYMINALNA",
    email: "kolo.kryminalna@wskz.pl",
    icon: "Search",
    emoji: "🔍",
    color: "#B45309",
    bgLight: "#FEF3C7",
    accentColor: "amber",
  },
  {
    id: "SKN Psychologii Zachowań Ryzykownych",
    slug: "skn-psychologii-zachowan-ryzykownych",
    clubNumber: 5,
    type: "club",
    name: "05 SKN Zachowań Ryzykownych",
    fullName: "Koło Naukowe Psychologii Zachowań Ryzykownych",
    shortName: "SKN Zachowań Ryzykownych",
    code: "UZALEŻNIEŃ",
    email: "kolo.ryzykowne@wskz.pl",
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
    name: "06 SKN Społecznej i Ewolucyjnej",
    fullName: "Koło Naukowe Psychologii Społecznej i Ewolucyjnej",
    shortName: "SKN Społecznej i Ewolucyjnej",
    code: "EWOLUCYJNA",
    email: "kolo.spoleczna@wskz.pl",
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
    name: "07 SKN Psychoonkologii",
    fullName: "Koło Naukowe Psychoonkologii",
    shortName: "SKN Psychoonkologii",
    code: "ONKOLOGII",
    email: "kolo.psychoonkologii@wskz.pl",
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
    name: "08 SKN Psychofizjologii",
    fullName: "Koło Naukowe Psychofizjologii",
    shortName: "SKN Psychofizjologii",
    code: "FIZJOLOGII",
    email: "kolo.psychofizjologii@wskz.pl",
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
    name: "09 SKN Zdrowia i Środowiska",
    fullName: "Koło Naukowe Psychologii Zdrowia i Środowiska",
    shortName: "SKN Zdrowia i Środowiska",
    code: "ZDROWIA",
    email: "kolo.zdrowia@wskz.pl",
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
    name: "10 SKN Seksuologii",
    fullName: "Koło Naukowe Seksuologii",
    shortName: "SKN Seksuologii",
    code: "SEKSUOLOGII",
    email: "kn.seksuologii@wskz.pl",
    icon: "Heart",
    emoji: "💚",
    color: "#16A34A",
    bgLight: "#DCFCE7",
    accentColor: "green",
  },
  {
    id: "SKN Rozwoju Dzieci i Młodzieży",
    slug: "skn-rozwoju-dzieci-i-mlodziezy",
    clubNumber: 11,
    type: "club",
    name: "11 SKN Rozwoju Dzieci",
    fullName: "Koło Naukowe Rozwoju Dzieci i Młodzieży",
    shortName: "SKN Rozwoju Dzieci",
    code: "ROZWOJU",
    email: "kolo.rozwojudzieci@wskz.pl",
    icon: "Sparkles",
    emoji: "🪁",
    color: "#A21CAF",
    bgLight: "#FAE8FF",
    accentColor: "fuchsia",
  },
  {
    id: "SKN Krytycznego Myślenia",
    slug: "skn-krytycznego-myslenia",
    clubNumber: 12,
    type: "club",
    name: "12 SKN Krytycznego Myślenia",
    fullName: "Koło Naukowe Krytycznego Myślenia",
    shortName: "SKN Krytycznego Myślenia",
    code: "MYŚLENIA",
    email: "kolo.krytycznegomyslenia@wskz.pl",
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
    name: "13 SKN Reklamy, PR i Marketingu",
    fullName: "Koło Naukowe Reklamy, PR i Marketingu",
    shortName: "SKN Reklamy, PR i Marketingu",
    code: "REKLAMY",
    email: "kolo.reklamy@wskz.pl",
    icon: "Target",
    emoji: "🎯",
    color: "#E11D48",
    bgLight: "#FFE4E6",
    accentColor: "rose",
  },
  {
    id: "SKN Start-upów",
    slug: "skn-startupow",
    clubNumber: 14,
    type: "club",
    name: "14 SKN Start-upów",
    fullName: "Koło Naukowe Nowoczesnego Zarządzania i Start-upów",
    shortName: "14 SKN Start-upów",
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

/** Tylko koła naukowe (SKN 1-14) */
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
