import type { ColorLegend, CrmSystem, NoteColor } from "@/lib/constants";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type OrganizationRow = {
  id: string;
  tenant_id: string;
  name: string;
  icon_name: string;
  crm_system: CrmSystem;
  form_unit_id: string | null;
  unit_type: "admin" | "club" | null;
  club_number: number | null;
  full_name: string | null;
  list_name: string | null;
  short_name: string | null;
  badge_code: string | null;
  email: string | null;
  emoji: string | null;
  primary_hex: string | null;
  light_bg_hex: string | null;
  tailwind_accent: string | null;
  sort_order: number | null;
  created_at: string;
};

export type AdminPermissionRow = {
  id: string;
  user_id: string;
  tenant_id: string;
  role: "owner" | "board_admin" | "editor";
  created_at: string;
};

export type BoardRow = {
  id: string;
  tenant_id: string;
  title: string;
  description: string;
  access_slug: string;
  color_legend: ColorLegend;
  is_locked: boolean;
  pin_code: string | null;
  pin_updated_at: string | null;
  created_at: string;
  updated_at: string;
};

export type StickyNoteRow = {
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
};

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "12";
  };
  public: {
    Tables: {
      organizations: {
        Row: OrganizationRow;
        Insert: {
          id?: string;
          tenant_id: string;
          name: string;
          icon_name?: string;
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
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          name?: string;
          icon_name?: string;
          crm_system?: CrmSystem;
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
          created_at?: string;
        };
        Relationships: [];
      };
      admin_permissions: {
        Row: AdminPermissionRow;
        Insert: {
          id?: string;
          user_id: string;
          tenant_id: string;
          role?: "owner" | "board_admin" | "editor";
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          tenant_id?: string;
          role?: "owner" | "board_admin" | "editor";
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "admin_permissions_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["tenant_id"];
          },
        ];
      };
      boards: {
        Row: BoardRow;
        Insert: {
          id?: string;
          tenant_id: string;
          title: string;
          description?: string;
          access_slug: string;
          color_legend?: ColorLegend;
          is_locked?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          title?: string;
          description?: string;
          access_slug?: string;
          color_legend?: ColorLegend;
          is_locked?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "boards_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["tenant_id"];
          },
        ];
      };
      sticky_notes: {
        Row: StickyNoteRow;
        Insert: {
          id?: string;
          board_id: string;
          tenant_id: string;
          content: string;
          author_name?: string;
          color: NoteColor;
          rotation_deg?: number;
          upvotes?: number;
          is_pinned?: boolean;
          pinned_at?: string | null;
          sent_to_crm?: boolean;
          sent_to_crm_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          board_id?: string;
          tenant_id?: string;
          content?: string;
          author_name?: string;
          color?: NoteColor;
          rotation_deg?: number;
          upvotes?: number;
          is_pinned?: boolean;
          pinned_at?: string | null;
          sent_to_crm?: boolean;
          sent_to_crm_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sticky_notes_board_id_fkey";
            columns: ["board_id"];
            isOneToOne: false;
            referencedRelation: "boards";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sticky_notes_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["tenant_id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      upvote_sticky_note: {
        Args: {
          p_note_id: string;
        };
        Returns: number;
      };
      verify_admin_token: {
        Args: {
          p_board_id: string;
          p_token: string;
        };
        Returns: boolean;
      };
      admin_token_action: {
        Args: {
          p_board_id: string;
          p_token: string;
          p_action: string;
          p_note_id?: string | null;
          p_payload?: Json;
        };
        Returns: Json;
      };
      rotate_board_admin_token: {
        Args: {
          p_board_id: string;
          p_new_token: string;
        };
        Returns: undefined;
      };
      create_sticky_note: {
        Args: {
          p_board_id: string;
          p_content: string;
          p_author_name: string;
          p_color: string;
          p_rotation_deg?: number;
          p_owner_token?: string | null;
        };
        Returns: StickyNoteRow;
      };
      owner_update_sticky_note: {
        Args: {
          p_note_id: string;
          p_owner_token: string;
          p_content: string;
          p_color: string;
          p_author_name?: string | null;
        };
        Returns: StickyNoteRow;
      };
      owner_delete_sticky_note: {
        Args: {
          p_note_id: string;
          p_owner_token: string;
        };
        Returns: boolean;
      };
      merge_sticky_notes: {
        Args: {
          p_source_note_id: string;
          p_target_note_id: string;
          p_board_id: string;
          p_token?: string | null;
        };
        Returns: Json;
      };
      update_board_pin: {
        Args: {
          p_board_id: string;
          p_new_pin: string;
          p_admin_token?: string | null;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
