-- ============================================================================
-- Sprytne Karteczki (Karteczki WSKZ) — Schemat bazy danych Supabase / PostgreSQL
-- Wersja: 2026-11-12
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS extensions;
CREATE SCHEMA IF NOT EXISTS private;

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- ----------------------------------------------------------------------------
-- 1. Funkcje pomocnicze i prywatne
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION private.hash_admin_token(p_token text)
RETURNS text
LANGUAGE sql
IMMUTABLE
STRICT
SET search_path = ''
AS $$
  SELECT encode(extensions.digest(convert_to(btrim(p_token), 'UTF8'), 'sha256'), 'hex');
$$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- ----------------------------------------------------------------------------
-- 2. Wspólna tabela organizacji ekosystemu WSKZ (ten sam tenant_id co Generator Formularzy i CRM)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL UNIQUE CHECK (char_length(btrim(tenant_id)) BETWEEN 2 AND 80),
  name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 2 AND 160),
  icon_name text NOT NULL DEFAULT 'Sparkles',
  crm_system text NOT NULL CHECK (crm_system IN ('samorzad_kancelaria', 'crm_kola_naukowe')),
  short_name text NULL,
  badge_code text NULL,
  emoji text NULL,
  primary_hex text NULL,
  light_bg_hex text NULL,
  tailwind_accent text NULL,
  sort_order integer NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Bezpieczne dodanie opcjonalnych kolumn wizualnych, jeśli tabela organizations istnieje już w ekosystemie WSKZ
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS short_name text NULL;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS badge_code text NULL;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS emoji text NULL;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS primary_hex text NULL;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS light_bg_hex text NULL;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS tailwind_accent text NULL;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 100;

-- ----------------------------------------------------------------------------
-- 3. Uprawnienia członków Zarządu (Multi-Tenant Switcher)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.admin_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id text NOT NULL REFERENCES public.organizations(tenant_id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'board_admin' CHECK (role IN ('owner', 'board_admin', 'editor')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_admin_permissions_user_id
  ON public.admin_permissions (user_id);

CREATE INDEX IF NOT EXISTS idx_admin_permissions_tenant_id
  ON public.admin_permissions (tenant_id);

-- ----------------------------------------------------------------------------
-- 4. Tablice pomysłów (Boards)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.boards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL REFERENCES public.organizations(tenant_id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(btrim(title)) BETWEEN 2 AND 180),
  description text NOT NULL DEFAULT '',
  access_slug text NOT NULL UNIQUE CHECK (access_slug ~ '^[a-z0-9][a-z0-9-]{2,90}$'),
  color_legend jsonb NOT NULL DEFAULT '{
    "yellow": "Luźny pomysł / inspiracja",
    "blue": "Wydarzenie / warsztat / konferencja",
    "green": "Badania / literatura / publikacja",
    "pink": "Problem do rozwiązania / sprawa pilna",
    "purple": "Kwestia organizacyjna / promocja"
  }'::jsonb CHECK (
    jsonb_typeof(color_legend) = 'object'
    AND color_legend ?& array['yellow', 'blue', 'green', 'pink', 'purple']
  ),
  is_locked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_boards_tenant_created
  ON public.boards (tenant_id, created_at DESC);

DROP TRIGGER IF EXISTS trg_boards_updated_at ON public.boards;
CREATE TRIGGER trg_boards_updated_at
  BEFORE UPDATE ON public.boards
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 5. Hashe awaryjnych kluczy Zarządu (?admin=KLUCZ_ZARZADU) w prywatnym schemacie
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS private.board_admin_secrets (
  board_id uuid PRIMARY KEY REFERENCES public.boards(id) ON DELETE CASCADE,
  admin_token_hash text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_board_admin_secrets_updated_at ON private.board_admin_secrets;
CREATE TRIGGER trg_board_admin_secrets_updated_at
  BEFORE UPDATE ON private.board_admin_secrets
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 6. Karteczki samoprzylepne (Sticky Notes)
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.sticky_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id uuid NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
  tenant_id text NOT NULL REFERENCES public.organizations(tenant_id) ON DELETE CASCADE,
  content text NOT NULL CHECK (char_length(btrim(content)) BETWEEN 1 AND 400),
  author_name text NOT NULL DEFAULT 'Anonimowy Student'
    CHECK (char_length(btrim(author_name)) BETWEEN 1 AND 80),
  color text NOT NULL CHECK (color IN ('yellow', 'blue', 'green', 'pink', 'purple')),
  rotation_deg numeric(4, 2) NOT NULL DEFAULT round((random() * 2 - 1)::numeric, 2)
    CHECK (rotation_deg >= -1.00 AND rotation_deg <= 1.00),
  upvotes integer NOT NULL DEFAULT 0 CHECK (upvotes >= 0),
  is_pinned boolean NOT NULL DEFAULT false,
  pinned_at timestamptz NULL,
  sent_to_crm boolean NOT NULL DEFAULT false,
  sent_to_crm_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sticky_notes_board_stream
  ON public.sticky_notes (board_id, is_pinned, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sticky_notes_board_pinned
  ON public.sticky_notes (board_id, pinned_at ASC)
  WHERE is_pinned = true;

CREATE INDEX IF NOT EXISTS idx_sticky_notes_board_upvotes
  ON public.sticky_notes (board_id, upvotes DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sticky_notes_crm_import
  ON public.sticky_notes (tenant_id, upvotes DESC, created_at DESC);

-- Synchronizacja tenant_id z boards oraz limit maksymalnie 4 przypiętych karteczek na tablicę
CREATE OR REPLACE FUNCTION public.enforce_sticky_note_rules()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_board_tenant text;
  v_pinned_count integer;
BEGIN
  SELECT b.tenant_id INTO v_board_tenant
  FROM public.boards b
  WHERE b.id = NEW.board_id;

  IF v_board_tenant IS NULL THEN
    RAISE EXCEPTION 'Nie znaleziono wskazanej tablicy.';
  END IF;

  NEW.tenant_id := v_board_tenant;
  NEW.content := btrim(NEW.content);
  NEW.author_name := COALESCE(NULLIF(btrim(NEW.author_name), ''), 'Anonimowy Student');

  IF NEW.is_pinned = true AND (TG_OP = 'INSERT' OR COALESCE(OLD.is_pinned, false) = false) THEN
    PERFORM pg_advisory_xact_lock(hashtext(NEW.board_id::text));

    SELECT count(*) INTO v_pinned_count
    FROM public.sticky_notes sn
    WHERE sn.board_id = NEW.board_id
      AND sn.is_pinned = true
      AND (TG_OP = 'INSERT' OR sn.id <> NEW.id);

    IF v_pinned_count >= 4 THEN
      RAISE EXCEPTION 'Strefa „Przypięte przez Zarząd” może zawierać maksymalnie 4 karteczki.'
        USING ERRCODE = 'P0001';
    END IF;

    NEW.pinned_at := COALESCE(NEW.pinned_at, now());
  ELSIF NEW.is_pinned = false THEN
    NEW.pinned_at := NULL;
  END IF;

  IF NEW.sent_to_crm = true AND NEW.sent_to_crm_at IS NULL THEN
    NEW.sent_to_crm_at := now();
  ELSIF NEW.sent_to_crm = false THEN
    NEW.sent_to_crm_at := NULL;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sticky_notes_rules ON public.sticky_notes;
CREATE TRIGGER trg_sticky_notes_rules
  BEFORE INSERT OR UPDATE ON public.sticky_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_sticky_note_rules();

DROP TRIGGER IF EXISTS trg_sticky_notes_updated_at ON public.sticky_notes;
CREATE TRIGGER trg_sticky_notes_updated_at
  BEFORE UPDATE ON public.sticky_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ----------------------------------------------------------------------------
-- 7. Konfiguracja Realtime (DELETE events wymagają REPLICA IDENTITY FULL)
-- ----------------------------------------------------------------------------

ALTER TABLE public.sticky_notes REPLICA IDENTITY FULL;
ALTER TABLE public.boards REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'sticky_notes'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.sticky_notes;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'boards'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.boards;
    END IF;
  END IF;
END
$$;

-- ----------------------------------------------------------------------------
-- 8. Row Level Security (RLS)
-- ----------------------------------------------------------------------------

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sticky_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE private.board_admin_secrets ENABLE ROW LEVEL SECURITY;

-- ORGANIZATIONS: publiczny odczyt nazw i ikon dla widoku tablicy / wydruku
DROP POLICY IF EXISTS "organizations_select_public" ON public.organizations;
CREATE POLICY "organizations_select_public"
  ON public.organizations
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- ADMIN_PERMISSIONS: wyłącznie odczyt własnych ról przez zalogowanego użytkownika
DROP POLICY IF EXISTS "admin_permissions_select_own" ON public.admin_permissions;
CREATE POLICY "admin_permissions_select_own"
  ON public.admin_permissions
  FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

-- BOARDS: odczyt publiczny po znajomości access_slug, zapis tylko dla uprawnionego Zarządu
DROP POLICY IF EXISTS "boards_select_public" ON public.boards;
CREATE POLICY "boards_select_public"
  ON public.boards
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "boards_insert_admin" ON public.boards;
CREATE POLICY "boards_insert_admin"
  ON public.boards
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.admin_permissions ap
      WHERE ap.user_id = (select auth.uid())
        AND ap.tenant_id = boards.tenant_id
    )
  );

DROP POLICY IF EXISTS "boards_update_admin" ON public.boards;
CREATE POLICY "boards_update_admin"
  ON public.boards
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.admin_permissions ap
      WHERE ap.user_id = (select auth.uid())
        AND ap.tenant_id = boards.tenant_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.admin_permissions ap
      WHERE ap.user_id = (select auth.uid())
        AND ap.tenant_id = boards.tenant_id
    )
  );

DROP POLICY IF EXISTS "boards_delete_admin" ON public.boards;
CREATE POLICY "boards_delete_admin"
  ON public.boards
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.admin_permissions ap
      WHERE ap.user_id = (select auth.uid())
        AND ap.tenant_id = boards.tenant_id
    )
  );

-- STICKY_NOTES: odczyt publiczny; dodawanie bez logowania gdy tablica nie jest zablokowana;
-- edycja i usuwanie przez zalogowanych adminów (lub awaryjnie przez RPC admin_token_action).
DROP POLICY IF EXISTS "sticky_notes_select_public" ON public.sticky_notes;
CREATE POLICY "sticky_notes_select_public"
  ON public.sticky_notes
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "sticky_notes_insert_members_or_admin" ON public.sticky_notes;
CREATE POLICY "sticky_notes_insert_members_or_admin"
  ON public.sticky_notes
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    (
      upvotes = 0
      AND is_pinned = false
      AND sent_to_crm = false
      AND EXISTS (
        SELECT 1
        FROM public.boards b
        WHERE b.id = sticky_notes.board_id
          AND b.tenant_id = sticky_notes.tenant_id
          AND b.is_locked = false
      )
    )
    OR EXISTS (
      SELECT 1
      FROM public.admin_permissions ap
      WHERE ap.user_id = (select auth.uid())
        AND ap.tenant_id = sticky_notes.tenant_id
    )
  );

DROP POLICY IF EXISTS "sticky_notes_update_admin" ON public.sticky_notes;
CREATE POLICY "sticky_notes_update_admin"
  ON public.sticky_notes
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.admin_permissions ap
      WHERE ap.user_id = (select auth.uid())
        AND ap.tenant_id = sticky_notes.tenant_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.admin_permissions ap
      WHERE ap.user_id = (select auth.uid())
        AND ap.tenant_id = sticky_notes.tenant_id
    )
  );

DROP POLICY IF EXISTS "sticky_notes_delete_admin" ON public.sticky_notes;
CREATE POLICY "sticky_notes_delete_admin"
  ON public.sticky_notes
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.admin_permissions ap
      WHERE ap.user_id = (select auth.uid())
        AND ap.tenant_id = sticky_notes.tenant_id
    )
  );

-- ----------------------------------------------------------------------------
-- 9. Funkcje RPC (upvote_sticky_note, admin_token_action, rotate_board_admin_token)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.upvote_sticky_note(p_note_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_upvotes integer;
  v_is_locked boolean;
BEGIN
  SELECT b.is_locked
  INTO v_is_locked
  FROM public.sticky_notes sn
  JOIN public.boards b ON b.id = sn.board_id
  WHERE sn.id = p_note_id;

  IF v_is_locked IS NULL THEN
    RAISE EXCEPTION 'Nie znaleziono karteczki.' USING ERRCODE = 'P0002';
  END IF;

  IF v_is_locked = true THEN
    RAISE EXCEPTION 'Tablica jest zablokowana (tryb tylko do odczytu).' USING ERRCODE = '42501';
  END IF;

  UPDATE public.sticky_notes
  SET upvotes = upvotes + 1
  WHERE id = p_note_id
  RETURNING upvotes INTO v_upvotes;

  RETURN v_upvotes;
END;
$$;

REVOKE ALL ON FUNCTION public.upvote_sticky_note(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upvote_sticky_note(uuid) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.verify_admin_token(
  p_board_id uuid,
  p_token text
)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT CASE
    WHEN p_token IS NULL OR btrim(p_token) = '' THEN false
    ELSE EXISTS (
      SELECT 1
      FROM private.board_admin_secrets s
      WHERE s.board_id = p_board_id
        AND s.admin_token_hash = private.hash_admin_token(p_token)
    )
  END;
$$;

REVOKE ALL ON FUNCTION public.verify_admin_token(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_admin_token(uuid, text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.admin_token_action(
  p_board_id uuid,
  p_token text,
  p_action text,
  p_note_id uuid DEFAULT NULL,
  p_payload jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_valid boolean;
  v_note public.sticky_notes%ROWTYPE;
  v_board public.boards%ROWTYPE;
  v_new_pinned boolean;
  v_new_locked boolean;
  v_new_slug text;
  v_note_ids uuid[];
  v_deleted_count integer;
BEGIN
  v_valid := public.verify_admin_token(p_board_id, p_token);
  IF NOT v_valid THEN
    RAISE EXCEPTION 'Nieprawidłowy awaryjny token Zarządu.' USING ERRCODE = '42501';
  END IF;

  IF p_action = 'verify' THEN
    RETURN jsonb_build_object('ok', true, 'action', 'verify');
  END IF;

  IF p_action = 'toggle_pin' THEN
    IF p_note_id IS NULL THEN
      RAISE EXCEPTION 'Brak identyfikatora karteczki (p_note_id).' USING ERRCODE = '22023';
    END IF;

    SELECT NOT sn.is_pinned INTO v_new_pinned
    FROM public.sticky_notes sn
    WHERE sn.id = p_note_id AND sn.board_id = p_board_id;

    IF v_new_pinned IS NULL THEN
      RAISE EXCEPTION 'Karteczka nie należy do tej tablicy.' USING ERRCODE = 'P0002';
    END IF;

    UPDATE public.sticky_notes
    SET is_pinned = v_new_pinned
    WHERE id = p_note_id AND board_id = p_board_id
    RETURNING * INTO v_note;

    RETURN jsonb_build_object(
      'ok', true,
      'action', 'toggle_pin',
      'note', to_jsonb(v_note)
    );
  END IF;

  IF p_action = 'delete_note' THEN
    IF p_note_id IS NULL THEN
      RAISE EXCEPTION 'Brak identyfikatora karteczki (p_note_id).' USING ERRCODE = '22023';
    END IF;

    DELETE FROM public.sticky_notes
    WHERE id = p_note_id AND board_id = p_board_id;

    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RETURN jsonb_build_object(
      'ok', v_deleted_count > 0,
      'action', 'delete_note',
      'deleted_count', v_deleted_count
    );
  END IF;

  IF p_action = 'delete_notes_bulk' THEN
    SELECT COALESCE(array_agg(elem::uuid), ARRAY[]::uuid[])
    INTO v_note_ids
    FROM jsonb_array_elements_text(COALESCE(p_payload->'note_ids', '[]'::jsonb)) AS elem;

    DELETE FROM public.sticky_notes
    WHERE board_id = p_board_id
      AND id = ANY(v_note_ids);

    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    RETURN jsonb_build_object(
      'ok', true,
      'action', 'delete_notes_bulk',
      'deleted_count', v_deleted_count
    );
  END IF;

  IF p_action = 'toggle_lock' THEN
    IF p_payload ? 'is_locked' THEN
      v_new_locked := (p_payload->>'is_locked')::boolean;
    ELSE
      SELECT NOT b.is_locked INTO v_new_locked
      FROM public.boards b
      WHERE b.id = p_board_id;
    END IF;

    UPDATE public.boards
    SET is_locked = v_new_locked
    WHERE id = p_board_id
    RETURNING * INTO v_board;

    RETURN jsonb_build_object(
      'ok', true,
      'action', 'toggle_lock',
      'board', to_jsonb(v_board)
    );
  END IF;

  IF p_action = 'update_legend' THEN
    IF NOT (p_payload ? 'color_legend') THEN
      RAISE EXCEPTION 'Brak obiektu color_legend w payloadzie.' USING ERRCODE = '22023';
    END IF;

    UPDATE public.boards
    SET color_legend = p_payload->'color_legend',
        title = COALESCE(NULLIF(btrim(p_payload->>'title'), ''), title),
        description = COALESCE(p_payload->>'description', description)
    WHERE id = p_board_id
    RETURNING * INTO v_board;

    RETURN jsonb_build_object(
      'ok', true,
      'action', 'update_legend',
      'board', to_jsonb(v_board)
    );
  END IF;

  IF p_action = 'regenerate_slug' THEN
    v_new_slug := lower(
      regexp_replace(
        COALESCE(NULLIF(btrim(p_payload->>'prefix'), ''), 'wskz-board'),
        '[^a-z0-9-]+',
        '-',
        'g'
      )
    ) || '-' || substr(encode(extensions.gen_random_bytes(3), 'hex'), 1, 6);

    UPDATE public.boards
    SET access_slug = v_new_slug
    WHERE id = p_board_id
    RETURNING * INTO v_board;

    RETURN jsonb_build_object(
      'ok', true,
      'action', 'regenerate_slug',
      'board', to_jsonb(v_board)
    );
  END IF;

  RAISE EXCEPTION 'Nieobsługiwana akcja administratora: %', p_action USING ERRCODE = '22023';
END;
$$;

REVOKE ALL ON FUNCTION public.admin_token_action(uuid, text, text, uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_token_action(uuid, text, text, uuid, jsonb) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.rotate_board_admin_token(
  p_board_id uuid,
  p_new_token text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_tenant_id text;
  v_is_admin boolean;
BEGIN
  IF p_new_token IS NULL OR char_length(btrim(p_new_token)) < 8 THEN
    RAISE EXCEPTION 'Awaryjny klucz Zarządu musi mieć co najmniej 8 znaków.' USING ERRCODE = '22023';
  END IF;

  SELECT b.tenant_id INTO v_tenant_id
  FROM public.boards b
  WHERE b.id = p_board_id;

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Nie znaleziono tablicy.' USING ERRCODE = 'P0002';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.admin_permissions ap
    WHERE ap.user_id = (select auth.uid())
      AND ap.tenant_id = v_tenant_id
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Brak uprawnień Zarządu dla tej organizacji.' USING ERRCODE = '42501';
  END IF;

  INSERT INTO private.board_admin_secrets (board_id, admin_token_hash)
  VALUES (p_board_id, private.hash_admin_token(p_new_token))
  ON CONFLICT (board_id)
  DO UPDATE SET admin_token_hash = EXCLUDED.admin_token_hash;
END;
$$;

REVOKE ALL ON FUNCTION public.rotate_board_admin_token(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rotate_board_admin_token(uuid, text) TO authenticated;
