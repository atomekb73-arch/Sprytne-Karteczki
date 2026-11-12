export const NOTE_COLORS = ["yellow", "blue", "green", "pink", "purple"] as const;

export type NoteColor = (typeof NOTE_COLORS)[number];

export type ColorLegend = Record<NoteColor, string>;

export type CrmSystem = "samorzad_kancelaria" | "crm_kola_naukowe";

export interface NoteColorTheme {
  id: NoteColor;
  hex: string;
  bgClass: string;
  tapeClass: string;
  borderClass: string;
  chipClass: string;
  ringClass: string;
  printBg: string;
  printBorder: string;
  defaultLabel: string;
}

export const DEFAULT_COLOR_LEGEND: ColorLegend = {
  yellow: "Luźny pomysł / inspiracja",
  blue: "Wydarzenie / warsztat / konferencja",
  green: "Badania / literatura / publikacja",
  pink: "Problem do rozwiązania / sprawa pilna",
  purple: "Kwestia organizacyjna / promocja",
};

export const NOTE_COLOR_THEMES: Record<NoteColor, NoteColorTheme> = {
  yellow: {
    id: "yellow",
    hex: "#FEF08A",
    bgClass: "bg-[#FEF08A]",
    tapeClass: "bg-amber-300/65",
    borderClass: "border-amber-300/80",
    chipClass: "bg-amber-950/10 text-stone-900 border-amber-900/20",
    ringClass: "focus-visible:ring-amber-600",
    printBg: "#FEF08A",
    printBorder: "#EAB308",
    defaultLabel: DEFAULT_COLOR_LEGEND.yellow,
  },
  blue: {
    id: "blue",
    hex: "#BAE6FD",
    bgClass: "bg-[#BAE6FD]",
    tapeClass: "bg-sky-300/65",
    borderClass: "border-sky-300/80",
    chipClass: "bg-sky-950/10 text-stone-900 border-sky-900/20",
    ringClass: "focus-visible:ring-sky-700",
    printBg: "#BAE6FD",
    printBorder: "#0284C7",
    defaultLabel: DEFAULT_COLOR_LEGEND.blue,
  },
  green: {
    id: "green",
    hex: "#BBF7D0",
    bgClass: "bg-[#BBF7D0]",
    tapeClass: "bg-emerald-300/65",
    borderClass: "border-emerald-300/80",
    chipClass: "bg-emerald-950/10 text-stone-900 border-emerald-900/20",
    ringClass: "focus-visible:ring-emerald-700",
    printBg: "#BBF7D0",
    printBorder: "#16A34A",
    defaultLabel: DEFAULT_COLOR_LEGEND.green,
  },
  pink: {
    id: "pink",
    hex: "#FBCFE8",
    bgClass: "bg-[#FBCFE8]",
    tapeClass: "bg-pink-300/65",
    borderClass: "border-pink-300/80",
    chipClass: "bg-pink-950/10 text-stone-900 border-pink-900/20",
    ringClass: "focus-visible:ring-pink-700",
    printBg: "#FBCFE8",
    printBorder: "#DB2777",
    defaultLabel: DEFAULT_COLOR_LEGEND.pink,
  },
  purple: {
    id: "purple",
    hex: "#E9D5FF",
    bgClass: "bg-[#E9D5FF]",
    tapeClass: "bg-purple-300/65",
    borderClass: "border-purple-300/80",
    chipClass: "bg-purple-950/10 text-stone-900 border-purple-900/20",
    ringClass: "focus-visible:ring-purple-700",
    printBg: "#E9D5FF",
    printBorder: "#9333EA",
    defaultLabel: DEFAULT_COLOR_LEGEND.purple,
  },
};

export const CRM_SYSTEM_LABELS: Record<CrmSystem, string> = {
  samorzad_kancelaria: "CRM Kancelarii Samorządu Studenckiego WSKZ",
  crm_kola_naukowe: "CRM Kół Naukowych WSKZ",
};

export const MAX_NOTE_CONTENT_LENGTH = 400;
export const MAX_AUTHOR_LENGTH = 80;
export const MAX_PINNED_NOTES = 4;

export const AUTHOR_STORAGE_KEY = "wskz_sticky_author";
export const UPVOTED_NOTES_STORAGE_KEY = "wskz_upvoted_notes";
export const OWNED_NOTES_STORAGE_KEY = "wskz_owned_notes";
export const ADMIN_TOKEN_SESSION_PREFIX = "wskz_admin_token:";
export const OFFLINE_BOARD_CACHE_PREFIX = "wskz_offline_board:";
export const OFFLINE_BOARD_INDEX_KEY = "wskz_offline_boards_index";

export const RODO_CLAUSE =
  "Tablica służy do zbierania pomysłów i zagadnień merytorycznych – nie wpisuj tu numerów albumów, PESEL-i ani prywatnych danych kontaktowych studentów.";

export function normalizeColorLegend(raw: unknown): ColorLegend {
  if (!raw || typeof raw !== "object") {
    return { ...DEFAULT_COLOR_LEGEND };
  }
  const source = raw as Record<string, unknown>;
  return {
    yellow:
      typeof source.yellow === "string" && source.yellow.trim()
        ? source.yellow.trim()
        : DEFAULT_COLOR_LEGEND.yellow,
    blue:
      typeof source.blue === "string" && source.blue.trim()
        ? source.blue.trim()
        : DEFAULT_COLOR_LEGEND.blue,
    green:
      typeof source.green === "string" && source.green.trim()
        ? source.green.trim()
        : DEFAULT_COLOR_LEGEND.green,
    pink:
      typeof source.pink === "string" && source.pink.trim()
        ? source.pink.trim()
        : DEFAULT_COLOR_LEGEND.pink,
    purple:
      typeof source.purple === "string" && source.purple.trim()
        ? source.purple.trim()
        : DEFAULT_COLOR_LEGEND.purple,
  };
}

export function generateStableRotationDeg(): number {
  const raw = Math.random() * 2 - 1;
  return Math.round(raw * 100) / 100;
}
