-- Migration: 202611130002_user_email_superadmin.sql
-- Description: Align admin_permissions with user_email, superadmin role and RLS

-- 1. Dodaj kolumnę user_email i zaktualizuj rolę
ALTER TABLE public.admin_permissions
  ADD COLUMN IF NOT EXISTS user_email TEXT;

-- Opcjonalnie zmigruj dotychczasowe maile z auth.users
UPDATE public.admin_permissions ap
SET user_email = lower(u.email)
FROM auth.users u
WHERE ap.user_id = u.id AND (ap.user_email IS NULL OR ap.user_email = '');

-- Poluzuj user_id (może być null, jeśli uprawnienie nadano przed rejestracją)
ALTER TABLE public.admin_permissions
  ALTER COLUMN user_id DROP NOT NULL;

-- Dodaj unikalność po (user_email, tenant_id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'admin_permissions_user_email_tenant_id_key'
  ) THEN
    ALTER TABLE public.admin_permissions
      ADD CONSTRAINT admin_permissions_user_email_tenant_id_key
      UNIQUE (user_email, tenant_id);
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- 2. Aktualizacja polityk RLS
ALTER TABLE public.admin_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin widzi swoje uprawnienia" ON public.admin_permissions;
DROP POLICY IF EXISTS "Superadmin zarzadza wszystkimi uprawnieniami" ON public.admin_permissions;
DROP POLICY IF EXISTS "Odczyt uprawnien" ON public.admin_permissions;
DROP POLICY IF EXISTS "Zarzadzanie uprawnieniami przez adminow" ON public.admin_permissions;
DROP POLICY IF EXISTS "admin_permissions_select_own" ON public.admin_permissions;

CREATE POLICY "Odczyt uprawnien"
  ON public.admin_permissions FOR SELECT
  USING (
    lower(user_email) = lower(auth.jwt() ->> 'email')
    OR (auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.admin_permissions ap
      WHERE (lower(ap.user_email) = lower(auth.jwt() ->> 'email') OR ap.user_id = auth.uid())
        AND ap.role = 'superadmin'
    )
  );

CREATE POLICY "Zarzadzanie uprawnieniami przez adminow"
  ON public.admin_permissions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_permissions ap
      WHERE (lower(ap.user_email) = lower(auth.jwt() ->> 'email') OR ap.user_id = auth.uid())
        AND (ap.role = 'superadmin' OR ap.tenant_id = admin_permissions.tenant_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.admin_permissions ap
      WHERE (lower(ap.user_email) = lower(auth.jwt() ->> 'email') OR ap.user_id = auth.uid())
        AND (ap.role = 'superadmin' OR ap.tenant_id = admin_permissions.tenant_id)
    )
  );

-- 3. Funkcja pomocnicza is_tenant_admin
CREATE OR REPLACE FUNCTION public.is_tenant_admin(check_tenant_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.admin_permissions
    WHERE (lower(user_email) = lower(auth.jwt() ->> 'email') OR (auth.uid() IS NOT NULL AND user_id = auth.uid()))
      AND (tenant_id = check_tenant_id OR role = 'superadmin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Przypisanie Superadmina atomekb73@gmail.com
INSERT INTO public.admin_permissions (user_email, tenant_id, role)
SELECT 'atomekb73@gmail.com', tenant_id, 'superadmin'
FROM public.organizations
ON CONFLICT (user_email, tenant_id) DO UPDATE SET role = 'superadmin';
