-- ============================================================================
-- Sprytne Karteczki (Karteczki WSKZ) — Edycja i usuwanie wyłącznie własnych karteczek
-- Wersja: 2026-11-12
-- ============================================================================

CREATE TABLE IF NOT EXISTS private.sticky_note_owner_secrets (
  note_id uuid PRIMARY KEY REFERENCES public.sticky_notes(id) ON DELETE CASCADE,
  owner_token_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE private.sticky_note_owner_secrets ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION private.verify_note_owner_token(
  p_note_id uuid,
  p_owner_token text
)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT CASE
    WHEN p_note_id IS NULL
      OR p_owner_token IS NULL
      OR char_length(btrim(p_owner_token)) < 16 THEN false
    ELSE EXISTS (
      SELECT 1
      FROM private.sticky_note_owner_secrets s
      WHERE s.note_id = p_note_id
        AND s.owner_token_hash = private.hash_admin_token(p_owner_token)
    )
  END;
$$;

REVOKE ALL ON FUNCTION private.verify_note_owner_token(uuid, text) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.create_sticky_note(
  p_board_id uuid,
  p_content text,
  p_author_name text,
  p_color text,
  p_rotation_deg numeric DEFAULT 0,
  p_owner_token text DEFAULT NULL
)
RETURNS public.sticky_notes
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_board public.boards%ROWTYPE;
  v_is_admin boolean := false;
  v_note public.sticky_notes%ROWTYPE;
  v_clean_content text;
  v_clean_author text;
BEGIN
  SELECT * INTO v_board
  FROM public.boards b
  WHERE b.id = p_board_id;

  IF v_board.id IS NULL THEN
    RAISE EXCEPTION 'Nie znaleziono wskazanej tablicy.' USING ERRCODE = 'P0002';
  END IF;

  IF (select auth.uid()) IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1
      FROM public.admin_permissions ap
      WHERE ap.user_id = (select auth.uid())
        AND ap.tenant_id = v_board.tenant_id
    ) INTO v_is_admin;
  END IF;

  IF v_board.is_locked = true AND NOT v_is_admin THEN
    RAISE EXCEPTION 'Tablica jest zablokowana (tryb tylko do odczytu).' USING ERRCODE = '42501';
  END IF;

  v_clean_content := btrim(COALESCE(p_content, ''));
  IF char_length(v_clean_content) < 1 OR char_length(v_clean_content) > 400 THEN
    RAISE EXCEPTION 'Treść karteczki musi mieć od 1 do 400 znaków.' USING ERRCODE = '22023';
  END IF;

  IF p_color NOT IN ('yellow', 'blue', 'green', 'pink', 'purple') THEN
    RAISE EXCEPTION 'Nieprawidłowy kolor karteczki.' USING ERRCODE = '22023';
  END IF;

  v_clean_author := COALESCE(NULLIF(btrim(COALESCE(p_author_name, '')), ''), 'Anonimowy Student');
  IF char_length(v_clean_author) > 80 THEN
    v_clean_author := substr(v_clean_author, 1, 80);
  END IF;

  INSERT INTO public.sticky_notes (
    board_id,
    tenant_id,
    content,
    author_name,
    color,
    rotation_deg,
    upvotes,
    is_pinned,
    sent_to_crm
  )
  VALUES (
    v_board.id,
    v_board.tenant_id,
    v_clean_content,
    v_clean_author,
    p_color,
    GREATEST(-1.00, LEAST(1.00, COALESCE(p_rotation_deg, 0))),
    0,
    false,
    false
  )
  RETURNING * INTO v_note;

  IF p_owner_token IS NOT NULL AND char_length(btrim(p_owner_token)) >= 16 THEN
    INSERT INTO private.sticky_note_owner_secrets (note_id, owner_token_hash)
    VALUES (v_note.id, private.hash_admin_token(p_owner_token))
    ON CONFLICT (note_id) DO NOTHING;
  END IF;

  RETURN v_note;
END;
$$;

REVOKE ALL ON FUNCTION public.create_sticky_note(uuid, text, text, text, numeric, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_sticky_note(uuid, text, text, text, numeric, text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.owner_update_sticky_note(
  p_note_id uuid,
  p_owner_token text,
  p_content text,
  p_color text,
  p_author_name text DEFAULT NULL
)
RETURNS public.sticky_notes
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_note public.sticky_notes%ROWTYPE;
  v_is_locked boolean;
  v_clean_content text;
  v_clean_author text;
BEGIN
  IF NOT private.verify_note_owner_token(p_note_id, p_owner_token) THEN
    RAISE EXCEPTION 'Brak uprawnień — możesz edytować wyłącznie własną karteczkę.' USING ERRCODE = '42501';
  END IF;

  SELECT b.is_locked INTO v_is_locked
  FROM public.sticky_notes sn
  JOIN public.boards b ON b.id = sn.board_id
  WHERE sn.id = p_note_id;

  IF v_is_locked IS NULL THEN
    RAISE EXCEPTION 'Nie znaleziono karteczki.' USING ERRCODE = 'P0002';
  END IF;

  IF v_is_locked = true THEN
    RAISE EXCEPTION 'Tablica jest zablokowana (tryb tylko do odczytu).' USING ERRCODE = '42501';
  END IF;

  v_clean_content := btrim(COALESCE(p_content, ''));
  IF char_length(v_clean_content) < 1 OR char_length(v_clean_content) > 400 THEN
    RAISE EXCEPTION 'Treść karteczki musi mieć od 1 do 400 znaków.' USING ERRCODE = '22023';
  END IF;

  IF p_color NOT IN ('yellow', 'blue', 'green', 'pink', 'purple') THEN
    RAISE EXCEPTION 'Nieprawidłowy kolor karteczki.' USING ERRCODE = '22023';
  END IF;

  IF p_author_name IS NOT NULL THEN
    v_clean_author := COALESCE(NULLIF(btrim(p_author_name), ''), 'Anonimowy Student');
    IF char_length(v_clean_author) > 80 THEN
      v_clean_author := substr(v_clean_author, 1, 80);
    END IF;
  END IF;

  UPDATE public.sticky_notes sn
  SET content = v_clean_content,
      color = p_color,
      author_name = COALESCE(v_clean_author, sn.author_name)
  WHERE sn.id = p_note_id
  RETURNING * INTO v_note;

  RETURN v_note;
END;
$$;

REVOKE ALL ON FUNCTION public.owner_update_sticky_note(uuid, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.owner_update_sticky_note(uuid, text, text, text, text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.owner_delete_sticky_note(
  p_note_id uuid,
  p_owner_token text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_is_locked boolean;
  v_deleted_count integer;
BEGIN
  IF NOT private.verify_note_owner_token(p_note_id, p_owner_token) THEN
    RAISE EXCEPTION 'Brak uprawnień — możesz usunąć wyłącznie własną karteczkę.' USING ERRCODE = '42501';
  END IF;

  SELECT b.is_locked INTO v_is_locked
  FROM public.sticky_notes sn
  JOIN public.boards b ON b.id = sn.board_id
  WHERE sn.id = p_note_id;

  IF v_is_locked IS NULL THEN
    RAISE EXCEPTION 'Nie znaleziono karteczki.' USING ERRCODE = 'P0002';
  END IF;

  IF v_is_locked = true THEN
    RAISE EXCEPTION 'Tablica jest zablokowana (tryb tylko do odczytu).' USING ERRCODE = '42501';
  END IF;

  DELETE FROM public.sticky_notes
  WHERE id = p_note_id;

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count > 0;
END;
$$;

REVOKE ALL ON FUNCTION public.owner_delete_sticky_note(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.owner_delete_sticky_note(uuid, text) TO anon, authenticated;
