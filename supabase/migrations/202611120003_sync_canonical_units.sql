-- ============================================================================
-- Sprytne Karteczki (Karteczki WSKZ) — Pełna synchronizacja ze słownikiem
-- Generatora Formularzy i CRM (ORGANIZATIONS_CONFIG / OrganizationUnit)
-- Wersja: 2026-11-12
-- ============================================================================

ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS form_unit_id text NULL;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS unit_type text NULL;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS club_number integer NULL;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS full_name text NULL;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS list_name text NULL;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS email text NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'organizations_unit_type_check'
  ) THEN
    ALTER TABLE public.organizations
      ADD CONSTRAINT organizations_unit_type_check
      CHECK (unit_type IS NULL OR unit_type IN ('admin', 'club'));
  END IF;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_organizations_form_unit_id_unique
  ON public.organizations (form_unit_id)
  WHERE form_unit_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_organizations_sort_order
  ON public.organizations (sort_order ASC, tenant_id ASC);
