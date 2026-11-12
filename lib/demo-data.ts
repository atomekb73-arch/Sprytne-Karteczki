import { DEFAULT_COLOR_LEGEND } from "@/lib/constants";
import { WSKZ_ORGANIZATIONS_CATALOG } from "@/lib/organizations";
import type {
  BoardPageBundle,
  BoardRecord,
  OrganizationRecord,
  StickyNoteRecord,
} from "@/types/board";

export const DEMO_EMERGENCY_ADMIN_TOKEN = "WSKZ-ZARZAD-2026";

export const DEMO_ORGANIZATIONS: OrganizationRecord[] =
  WSKZ_ORGANIZATIONS_CATALOG.map((unit, idx) => ({
    id: `00000000-0000-4000-8000-${String(idx + 1).padStart(12, "0")}`,
    tenant_id: unit.tenant_id,
    form_unit_id: unit.form_unit_id,
    unit_type: unit.unit_type,
    club_number: unit.club_number,
    name: unit.name,
    full_name: unit.name,
    list_name: unit.list_name,
    short_name: unit.short_name,
    badge_code: unit.badge_code,
    email: unit.email,
    icon_name: unit.icon_name,
    emoji: unit.emoji,
    primary_hex: unit.primary_hex,
    light_bg_hex: unit.light_bg_hex,
    tailwind_accent: unit.tailwind_accent,
    crm_system: unit.crm_system,
    sort_order: unit.sort_order,
    created_at: "2026-10-01T10:00:00.000Z",
  }));

const BOARD_OVERRIDES: Record<
  string,
  { title: string; description: string; access_slug: string }
> = {
  "skn-seksuologii": {
    title: "Burza mózgów — Semestr Letni 2026",
    description:
      "Otwarta tablica pomysłów na badania, konferencje i integrację członków Koła Naukowego Seksuologii.",
    access_slug: "skn-seksuologii-8f92",
  },
  "samorzad-studencki": {
    title: "Kancelaria Samorządu — Postulaty i Wydarzenia 2026",
    description:
      "Tablica inicjatyw studenckich, spraw pilnych oraz projektów Juwenaliów i Dni Adaptacyjnych.",
    access_slug: "samorzad-studencki-2026",
  },
  "biuro-dziekana": {
    title: "Inicjatywy Jakości Kształcenia i Sprawy Dziekańskie",
    description:
      "Przestrzeń na usprawnienia organizacyjne, dydaktyczne oraz komunikację ze studentami WSKZ.",
    access_slug: "biuro-dziekana-2026",
  },
  "wydarzenia-ogolnewydzialowe": {
    title: "Sympozja i Konferencje Ogólnowydziałowe WSKZ",
    description:
      "Koordynacja tematów wspólnych wydarzeń międzykołowych, debat i dni otwartych.",
    access_slug: "wydarzenia-ogolne-2026",
  },
  "skn-psychologii-klinicznej": {
    title: "Plan Pracy Naukowej i Warsztatów Klinicznych",
    description:
      "Zbieramy tematy case studies, przeglądów systematycznych oraz warsztatów diagnostycznych.",
    access_slug: "skn-psychologii-klinicznej-4c18",
  },
};

export const DEMO_BOARDS: BoardRecord[] = WSKZ_ORGANIZATIONS_CATALOG.map(
  (unit, idx) => {
    const custom = BOARD_OVERRIDES[unit.tenant_id];
    const fallbackSlug = `${unit.tenant_id.slice(0, 32)}-2026`;
    return {
      id: `11111111-1111-4111-8111-${String(idx + 1).padStart(12, "0")}`,
      tenant_id: unit.tenant_id,
      title: custom?.title ?? `Tablica pomysłów — ${unit.list_name}`,
      description:
        custom?.description ??
        `Przestrzeń na pomysły badawcze, warsztaty i działania organizacyjne jednostki ${unit.name}.`,
      access_slug: custom?.access_slug ?? fallbackSlug,
      color_legend: { ...DEFAULT_COLOR_LEGEND },
      is_locked: false,
      pin_code: "123456",
      pin_updated_at: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000).toISOString(), // 22 days ago -> 8 days remaining to expire!
      created_at: "2026-11-01T09:00:00.000Z",
      updated_at: "2026-11-12T12:00:00.000Z",
    };
  }
);

const seksuologiaBoardId =
  DEMO_BOARDS.find((b) => b.tenant_id === "skn-seksuologii")?.id ??
  DEMO_BOARDS[0].id;
const samorzadBoardId =
  DEMO_BOARDS.find((b) => b.tenant_id === "samorzad-studencki")?.id ??
  DEMO_BOARDS[1].id;
const klinicznaBoardId =
  DEMO_BOARDS.find((b) => b.tenant_id === "skn-psychologii-klinicznej")?.id ??
  DEMO_BOARDS[3].id;
const startupBoardId =
  DEMO_BOARDS.find((b) => b.tenant_id === "skn-startupow")?.id ??
  DEMO_BOARDS[DEMO_BOARDS.length - 1].id;

export const DEMO_NOTES: StickyNoteRecord[] = [
  {
    id: "22222222-2222-4222-8222-222222222201",
    board_id: seksuologiaBoardId,
    tenant_id: "skn-seksuologii",
    content:
      "Priorytet semestru: Ogólnopolska Studencka Konferencja Interdyscyplinarna w maju. Zbieramy propozycje paneli eksperckich i abstraktów do końca miesiąca!",
    author_name: "Zarząd SKN (Zofia K.)",
    color: "blue",
    rotation_deg: -0.55,
    upvotes: 18,
    is_pinned: true,
    pinned_at: "2026-11-06T12:00:00.000Z",
    sent_to_crm: true,
    sent_to_crm_at: "2026-11-10T12:00:00.000Z",
    created_at: "2026-11-06T12:00:00.000Z",
    updated_at: "2026-11-10T12:00:00.000Z",
  },
  {
    id: "22222222-2222-4222-8222-222222222202",
    board_id: seksuologiaBoardId,
    tenant_id: "skn-seksuologii",
    content:
      "Potrzebujemy 3 osób do redakcji i korekty nowej broszury psychoedukacyjnej o komunikacji w relacjach — wpiszcie w treści lub na spotkaniu Meet w czwartek.",
    author_name: "Marek Zieliński",
    color: "purple",
    rotation_deg: 0.62,
    upvotes: 12,
    is_pinned: true,
    pinned_at: "2026-11-07T14:00:00.000Z",
    sent_to_crm: false,
    sent_to_crm_at: null,
    created_at: "2026-11-07T14:00:00.000Z",
    updated_at: "2026-11-07T14:00:00.000Z",
  },
  {
    id: "22222222-2222-4222-8222-222222222205",
    board_id: seksuologiaBoardId,
    tenant_id: "skn-seksuologii",
    content:
      "A gdyby zrobić cykl krótkich rolek Q&A z obalaniem najczęstszych mitów naukowych na Instagramie Koła? Mogę przygotować pierwszą listę pytań.",
    author_name: "Jakub S.",
    color: "yellow",
    rotation_deg: -0.75,
    upvotes: 7,
    is_pinned: false,
    pinned_at: null,
    sent_to_crm: false,
    sent_to_crm_at: null,
    created_at: "2026-11-12T08:00:00.000Z",
    updated_at: "2026-11-12T08:00:00.000Z",
  },
  {
    id: "22222222-2222-4222-8222-222222222204",
    board_id: seksuologiaBoardId,
    tenant_id: "skn-seksuologii",
    content:
      "Część nowych członków ma problem ze znalezieniem linków do nagrań spotkań Google Meet — przydałby się jeden przypięty indeks na dysku Koła.",
    author_name: "Karolina W.",
    color: "pink",
    rotation_deg: 0.85,
    upvotes: 9,
    is_pinned: false,
    pinned_at: null,
    sent_to_crm: false,
    sent_to_crm_at: null,
    created_at: "2026-11-10T16:30:00.000Z",
    updated_at: "2026-11-10T16:30:00.000Z",
  },
  {
    id: "22222222-2222-4222-8222-222222222203",
    board_id: seksuologiaBoardId,
    tenant_id: "skn-seksuologii",
    content:
      "Przegląd literatury: wpływ mediów społecznościowych na obraz ciała i intymność u młodych dorosłych (artykuł przeglądowy do zeszytu naukowego WSKZ).",
    author_name: "dr n. społ. Anna Nowak (opiekun)",
    color: "green",
    rotation_deg: -0.3,
    upvotes: 15,
    is_pinned: false,
    pinned_at: null,
    sent_to_crm: true,
    sent_to_crm_at: "2026-11-11T10:15:00.000Z",
    created_at: "2026-11-09T11:00:00.000Z",
    updated_at: "2026-11-11T10:15:00.000Z",
  },
  {
    id: "22222222-2222-4222-8222-222222222206",
    board_id: samorzadBoardId,
    tenant_id: "samorzad-studencki",
    content:
      "Uruchomienie cyklicznych dyżurów online Kancelarii Samorządu w każdy wtorek o 18:00 — wniosek po ankiecie satysfakcji studentów.",
    author_name: "Prezydium Samorządu",
    color: "blue",
    rotation_deg: 0.4,
    upvotes: 24,
    is_pinned: true,
    pinned_at: "2026-11-08T10:00:00.000Z",
    sent_to_crm: true,
    sent_to_crm_at: "2026-11-11T09:00:00.000Z",
    created_at: "2026-11-08T10:00:00.000Z",
    updated_at: "2026-11-11T09:00:00.000Z",
  },
  {
    id: "22222222-2222-4222-8222-222222222207",
    board_id: samorzadBoardId,
    tenant_id: "samorzad-studencki",
    content:
      "Prośba o doprecyzowanie zasad rozliczania mikrograntów dla Kół Naukowych przed konferencjami wyjazdowymi.",
    author_name: "Julia K.",
    color: "pink",
    rotation_deg: -0.45,
    upvotes: 14,
    is_pinned: false,
    pinned_at: null,
    sent_to_crm: false,
    sent_to_crm_at: null,
    created_at: "2026-11-11T15:20:00.000Z",
    updated_at: "2026-11-11T15:20:00.000Z",
  },
  {
    id: "22222222-2222-4222-8222-222222222208",
    board_id: klinicznaBoardId,
    tenant_id: "skn-psychologii-klinicznej",
    content:
      "Warsztat praktyczny z analizy wybranych skal kwestionariuszowych w psychologii klinicznej + omówienie anonimowego studium przypadku.",
    author_name: "Natalia P.",
    color: "blue",
    rotation_deg: -0.35,
    upvotes: 11,
    is_pinned: true,
    pinned_at: "2026-11-09T12:00:00.000Z",
    sent_to_crm: false,
    sent_to_crm_at: null,
    created_at: "2026-11-09T12:00:00.000Z",
    updated_at: "2026-11-09T12:00:00.000Z",
  },
  {
    id: "22222222-2222-4222-8222-222222222209",
    board_id: startupBoardId,
    tenant_id: "skn-startupow",
    content:
      "Hackathon WSKZ „AI w usługach edukacyjnych i wellbeingu” — poszukujemy partnerów biznesowych i mentorów na finał pitchingu.",
    author_name: "Michał D.",
    color: "yellow",
    rotation_deg: 0.5,
    upvotes: 16,
    is_pinned: true,
    pinned_at: "2026-11-10T10:00:00.000Z",
    sent_to_crm: true,
    sent_to_crm_at: "2026-11-11T14:00:00.000Z",
    created_at: "2026-11-10T10:00:00.000Z",
    updated_at: "2026-11-11T14:00:00.000Z",
  },
];

export function findDemoBoardBundleBySlug(
  accessSlug: string
): BoardPageBundle | null {
  const board = DEMO_BOARDS.find((b) => b.access_slug === accessSlug);
  if (!board) return null;

  const organization = DEMO_ORGANIZATIONS.find(
    (o) => o.tenant_id === board.tenant_id
  );
  if (!organization) return null;

  const notes = DEMO_NOTES.filter((n) => n.board_id === board.id).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return {
    board,
    organization,
    notes,
    isAuthenticatedAdmin: false,
    userEmail: null,
    adminTenants: [],
    isDemoMode: true,
  };
}
