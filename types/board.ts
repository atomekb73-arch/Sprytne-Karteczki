import type { ColorLegend, CrmSystem, NoteColor } from "@/lib/constants";

export interface OrganizationRecord {
  id: string;
  tenant_id: string;
  name: string;
  icon_name: string;
  crm_system: CrmSystem;
  form_unit_id?: string | null;
  unit_type?: "admin" | "club" | null;
  club_number?: number | null;
  full_name?: string | null;
  list_name?: string | null;
  short_name?: string | null;
  badge_code?: string | null;
  email?: string | null;
  emoji?: string | null;
  primary_hex?: string | null;
  light_bg_hex?: string | null;
  tailwind_accent?: string | null;
  sort_order?: number | null;
  created_at: string;
}

export interface BoardRecord {
  id: string;
  tenant_id: string;
  title: string;
  description: string;
  access_slug: string;
  color_legend: ColorLegend;
  is_locked: boolean;
  pin_code?: string | null;
  pin_updated_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface StickyNoteRecord {
  id: string;
  board_id: string;
  tenant_id: string;
  content: string;
  author_name: string;
  color: NoteColor;
  rotation_deg: number;
  upvotes: number;
  is_pinned: boolean;
  pinned_at: string | null;
  sent_to_crm: boolean;
  sent_to_crm_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminTenantSummary {
  tenant_id: string;
  role: "owner" | "board_admin" | "editor";
  organization: OrganizationRecord;
  boards: Pick<BoardRecord, "id" | "title" | "access_slug" | "is_locked" | "updated_at">[];
}

export interface BoardPageBundle {
  board: BoardRecord;
  organization: OrganizationRecord;
  notes: StickyNoteRecord[];
  isAuthenticatedAdmin: boolean;
  userEmail: string | null;
  adminTenants: AdminTenantSummary[];
  isDemoMode?: boolean;
}

export type SortMode = "lifo" | "upvotes";
