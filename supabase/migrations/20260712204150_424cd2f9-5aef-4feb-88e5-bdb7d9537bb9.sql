
-- =========================================================
-- 1. organizations
-- =========================================================
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo_url TEXT,
  primary_color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.organizations TO authenticated;
GRANT ALL ON public.organizations TO service_role;

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- trigger updated_at
DROP TRIGGER IF EXISTS set_organizations_updated_at ON public.organizations;
CREATE TRIGGER set_organizations_updated_at
BEFORE UPDATE ON public.organizations
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- 2. memberships
-- =========================================================
CREATE TABLE IF NOT EXISTS public.memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'cliente',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, org_id, role)
);

CREATE INDEX IF NOT EXISTS idx_memberships_user ON public.memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_org ON public.memberships(org_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.memberships TO authenticated;
GRANT ALL ON public.memberships TO service_role;

ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

-- =========================================================
-- 3. Helper functions (security definer, no recursion)
-- =========================================================
CREATE OR REPLACE FUNCTION public.is_org_member(_org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.memberships
    WHERE org_id = _org_id AND user_id = auth.uid()
  )
$$;

CREATE OR REPLACE FUNCTION public.has_org_role(_org_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.memberships
    WHERE org_id = _org_id AND user_id = auth.uid() AND role = _role
  )
$$;

-- =========================================================
-- 4. RLS on organizations / memberships
-- =========================================================
DROP POLICY IF EXISTS "Membros veem sua organização" ON public.organizations;
CREATE POLICY "Membros veem sua organização"
  ON public.organizations FOR SELECT
  TO authenticated
  USING (public.is_org_member(id) OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admin da org gerencia organização" ON public.organizations;
CREATE POLICY "Admin da org gerencia organização"
  ON public.organizations FOR ALL
  TO authenticated
  USING (public.has_org_role(id, 'admin') OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_org_role(id, 'admin') OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Usuário vê próprias memberships" ON public.memberships;
CREATE POLICY "Usuário vê próprias memberships"
  ON public.memberships FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.has_org_role(org_id, 'admin') OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admin da org gerencia memberships" ON public.memberships;
CREATE POLICY "Admin da org gerencia memberships"
  ON public.memberships FOR ALL
  TO authenticated
  USING (public.has_org_role(org_id, 'admin') OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_org_role(org_id, 'admin') OR public.has_role(auth.uid(), 'admin'));

-- =========================================================
-- 5. Backfill: uma organização por usuário existente
-- =========================================================
DO $$
DECLARE
  u RECORD;
  new_org_id UUID;
BEGIN
  FOR u IN
    SELECT p.id, COALESCE(p.nome, p.email, 'Organização') AS nome
    FROM public.profiles p
    WHERE NOT EXISTS (
      SELECT 1 FROM public.memberships m WHERE m.user_id = p.id
    )
  LOOP
    INSERT INTO public.organizations (name)
    VALUES (u.nome || ' — Org')
    RETURNING id INTO new_org_id;

    INSERT INTO public.memberships (user_id, org_id, role)
    VALUES (u.id, new_org_id, 'admin')
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- =========================================================
-- 6. org_id nas tabelas com dono via user_id / auth_user_id
-- =========================================================

-- clientes (dono via auth_user_id)
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_clientes_org ON public.clientes(org_id);

UPDATE public.clientes c
SET org_id = m.org_id
FROM public.memberships m
WHERE c.org_id IS NULL
  AND c.auth_user_id IS NOT NULL
  AND m.user_id = c.auth_user_id
  AND m.role = 'admin';

-- google_calendar_tokens (dono via user_id)
ALTER TABLE public.google_calendar_tokens ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_gct_org ON public.google_calendar_tokens(org_id);

UPDATE public.google_calendar_tokens t
SET org_id = m.org_id
FROM public.memberships m
WHERE t.org_id IS NULL
  AND m.user_id = t.user_id
  AND m.role = 'admin';

-- meta_business_pages (dono via user_id)
ALTER TABLE public.meta_business_pages ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_mbp_org ON public.meta_business_pages(org_id);

UPDATE public.meta_business_pages t
SET org_id = m.org_id
FROM public.memberships m
WHERE t.org_id IS NULL
  AND m.user_id = t.user_id
  AND m.role = 'admin';

-- whatsapp_connections (dono via user_id)
ALTER TABLE public.whatsapp_connections ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_wac_org ON public.whatsapp_connections(org_id);

UPDATE public.whatsapp_connections t
SET org_id = m.org_id
FROM public.memberships m
WHERE t.org_id IS NULL
  AND m.user_id = t.user_id
  AND m.role = 'admin';

-- whatsapp_envios (dono via user_id)
ALTER TABLE public.whatsapp_envios ADD COLUMN IF NOT EXISTS org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_wae_org ON public.whatsapp_envios(org_id);

UPDATE public.whatsapp_envios t
SET org_id = m.org_id
FROM public.memberships m
WHERE t.org_id IS NULL
  AND m.user_id = t.user_id
  AND m.role = 'admin';

-- =========================================================
-- 7. Substituir policies user_id => org membership
-- =========================================================

-- google_calendar_tokens
DROP POLICY IF EXISTS "own tokens select" ON public.google_calendar_tokens;
DROP POLICY IF EXISTS "own tokens insert" ON public.google_calendar_tokens;
DROP POLICY IF EXISTS "own tokens update" ON public.google_calendar_tokens;
DROP POLICY IF EXISTS "own tokens delete" ON public.google_calendar_tokens;

CREATE POLICY "gct_select_org" ON public.google_calendar_tokens
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR (org_id IS NOT NULL AND public.is_org_member(org_id)));

CREATE POLICY "gct_insert_org" ON public.google_calendar_tokens
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND (org_id IS NULL OR public.is_org_member(org_id)));

CREATE POLICY "gct_update_org" ON public.google_calendar_tokens
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR (org_id IS NOT NULL AND public.has_org_role(org_id, 'admin')))
  WITH CHECK (auth.uid() = user_id OR (org_id IS NOT NULL AND public.has_org_role(org_id, 'admin')));

CREATE POLICY "gct_delete_org" ON public.google_calendar_tokens
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR (org_id IS NOT NULL AND public.has_org_role(org_id, 'admin')));

-- meta_business_pages
DROP POLICY IF EXISTS "Users manage their own meta pages" ON public.meta_business_pages;

CREATE POLICY "mbp_manage_org" ON public.meta_business_pages
  FOR ALL TO authenticated
  USING (auth.uid() = user_id OR (org_id IS NOT NULL AND public.is_org_member(org_id)))
  WITH CHECK (auth.uid() = user_id OR (org_id IS NOT NULL AND public.is_org_member(org_id)));

-- whatsapp_connections
DROP POLICY IF EXISTS "Users manage their own whatsapp connection" ON public.whatsapp_connections;

CREATE POLICY "wac_manage_org" ON public.whatsapp_connections
  FOR ALL TO authenticated
  USING (auth.uid() = user_id OR (org_id IS NOT NULL AND public.is_org_member(org_id)))
  WITH CHECK (auth.uid() = user_id OR (org_id IS NOT NULL AND public.is_org_member(org_id)));

-- whatsapp_envios
DROP POLICY IF EXISTS "Usuário vê seus próprios envios" ON public.whatsapp_envios;
DROP POLICY IF EXISTS "Usuário cria seus próprios envios" ON public.whatsapp_envios;

CREATE POLICY "wae_select_org" ON public.whatsapp_envios
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR (org_id IS NOT NULL AND public.is_org_member(org_id)));

CREATE POLICY "wae_insert_org" ON public.whatsapp_envios
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND (org_id IS NULL OR public.is_org_member(org_id)));

-- clientes: manter policies existentes (admin/self) e adicionar acesso por org
DROP POLICY IF EXISTS "Membros da org veem clientes" ON public.clientes;
CREATE POLICY "Membros da org veem clientes"
  ON public.clientes FOR SELECT
  TO authenticated
  USING (org_id IS NOT NULL AND public.is_org_member(org_id));
