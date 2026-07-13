
-- 1) Financeiro: substitui política aberta por restrição admin/financeiro
DROP POLICY IF EXISTS "Usuário autenticado pode gerenciar financeiro" ON public.financeiro;

CREATE POLICY "Admin/financeiro gerencia financeiro"
ON public.financeiro
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'financeiro'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'financeiro'::app_role));

-- 2) Mover has_org_role e is_org_member para schema privado (fora da API PostgREST)
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO postgres, service_role;

CREATE OR REPLACE FUNCTION private.has_org_role(_org_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.memberships
    WHERE org_id = _org_id AND user_id = auth.uid() AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION private.is_org_member(_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.memberships
    WHERE org_id = _org_id AND user_id = auth.uid()
  )
$$;

REVOKE ALL ON FUNCTION private.has_org_role(uuid, public.app_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.is_org_member(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.has_org_role(uuid, public.app_role) TO postgres, service_role;
GRANT EXECUTE ON FUNCTION private.is_org_member(uuid) TO postgres, service_role;

-- 3) Recriar policies usando as funções privadas
-- clientes
DROP POLICY IF EXISTS "Membros da org veem clientes" ON public.clientes;
CREATE POLICY "Membros da org veem clientes" ON public.clientes
  FOR SELECT TO authenticated
  USING ((org_id IS NOT NULL) AND private.is_org_member(org_id));

-- organizations
DROP POLICY IF EXISTS "Membros veem sua organização" ON public.organizations;
CREATE POLICY "Membros veem sua organização" ON public.organizations
  FOR SELECT TO authenticated
  USING (private.is_org_member(id) OR public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admin da org gerencia organização" ON public.organizations;
CREATE POLICY "Admin da org gerencia organização" ON public.organizations
  FOR ALL TO authenticated
  USING (private.has_org_role(id, 'admin'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_org_role(id, 'admin'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role));

-- memberships
DROP POLICY IF EXISTS "Usuário vê próprias memberships" ON public.memberships;
CREATE POLICY "Usuário vê próprias memberships" ON public.memberships
  FOR SELECT TO authenticated
  USING ((user_id = auth.uid()) OR private.has_org_role(org_id, 'admin'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admin da org gerencia memberships" ON public.memberships;
CREATE POLICY "Admin da org gerencia memberships" ON public.memberships
  FOR ALL TO authenticated
  USING (private.has_org_role(org_id, 'admin'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_org_role(org_id, 'admin'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role));

-- google_calendar_tokens
DROP POLICY IF EXISTS "gct_select_org" ON public.google_calendar_tokens;
CREATE POLICY "gct_select_org" ON public.google_calendar_tokens
  FOR SELECT TO authenticated
  USING ((auth.uid() = user_id) OR ((org_id IS NOT NULL) AND private.is_org_member(org_id)));

DROP POLICY IF EXISTS "gct_insert_org" ON public.google_calendar_tokens;
CREATE POLICY "gct_insert_org" ON public.google_calendar_tokens
  FOR INSERT TO authenticated
  WITH CHECK ((auth.uid() = user_id) AND ((org_id IS NULL) OR private.is_org_member(org_id)));

DROP POLICY IF EXISTS "gct_update_org" ON public.google_calendar_tokens;
CREATE POLICY "gct_update_org" ON public.google_calendar_tokens
  FOR UPDATE TO authenticated
  USING ((auth.uid() = user_id) OR ((org_id IS NOT NULL) AND private.has_org_role(org_id, 'admin'::app_role)))
  WITH CHECK ((auth.uid() = user_id) OR ((org_id IS NOT NULL) AND private.has_org_role(org_id, 'admin'::app_role)));

DROP POLICY IF EXISTS "gct_delete_org" ON public.google_calendar_tokens;
CREATE POLICY "gct_delete_org" ON public.google_calendar_tokens
  FOR DELETE TO authenticated
  USING ((auth.uid() = user_id) OR ((org_id IS NOT NULL) AND private.has_org_role(org_id, 'admin'::app_role)));

-- meta_business_pages
DROP POLICY IF EXISTS "mbp_manage_org" ON public.meta_business_pages;
CREATE POLICY "mbp_manage_org" ON public.meta_business_pages
  FOR ALL TO authenticated
  USING ((auth.uid() = user_id) OR ((org_id IS NOT NULL) AND private.is_org_member(org_id)))
  WITH CHECK ((auth.uid() = user_id) OR ((org_id IS NOT NULL) AND private.is_org_member(org_id)));

-- whatsapp_connections
DROP POLICY IF EXISTS "wac_manage_org" ON public.whatsapp_connections;
CREATE POLICY "wac_manage_org" ON public.whatsapp_connections
  FOR ALL TO authenticated
  USING ((auth.uid() = user_id) OR ((org_id IS NOT NULL) AND private.is_org_member(org_id)))
  WITH CHECK ((auth.uid() = user_id) OR ((org_id IS NOT NULL) AND private.is_org_member(org_id)));

-- whatsapp_envios
DROP POLICY IF EXISTS "wae_select_org" ON public.whatsapp_envios;
CREATE POLICY "wae_select_org" ON public.whatsapp_envios
  FOR SELECT TO authenticated
  USING ((auth.uid() = user_id) OR ((org_id IS NOT NULL) AND private.is_org_member(org_id)));

DROP POLICY IF EXISTS "wae_insert_org" ON public.whatsapp_envios;
CREATE POLICY "wae_insert_org" ON public.whatsapp_envios
  FOR INSERT TO authenticated
  WITH CHECK ((auth.uid() = user_id) AND ((org_id IS NULL) OR private.is_org_member(org_id)));

-- 4) Remover funções públicas antigas
DROP FUNCTION IF EXISTS public.has_org_role(uuid, public.app_role);
DROP FUNCTION IF EXISTS public.is_org_member(uuid);
