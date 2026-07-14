
-- Tighten org-wide RLS policies to fix cross-tenant/PII/credential exposure

-- agenda_itens: drop org-wide ALL policy; keep staff/responsavel policy
DROP POLICY IF EXISTS "Acesso restrito por organização" ON public.agenda_itens;

-- sprints: drop org-wide ALL policy; keep staff role policy
DROP POLICY IF EXISTS "Acesso isolado por org_id" ON public.sprints;

-- tarefas: drop org-wide ALL policy; keep staff role policy
DROP POLICY IF EXISTS "Acesso isolado por org_id" ON public.tarefas;

-- task_comments: drop org-wide ALL policy; keep staff role policy
DROP POLICY IF EXISTS "Acesso isolado por org_id" ON public.task_comments;

-- task_tags: drop org-wide ALL policy; keep staff role policy
DROP POLICY IF EXISTS "Acesso isolado por org_id" ON public.task_tags;

-- clientes: drop org-wide SELECT; add staff-only SELECT policy
DROP POLICY IF EXISTS "Membros da org veem clientes" ON public.clientes;
CREATE POLICY "Equipe vê clientes da org"
ON public.clientes FOR SELECT
USING (
  (org_id IS NOT NULL AND private.is_org_member(org_id))
  AND (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'gestor'::app_role)
    OR public.has_role(auth.uid(), 'financeiro'::app_role)
    OR public.has_role(auth.uid(), 'social'::app_role)
    OR public.has_role(auth.uid(), 'editor'::app_role)
  )
);

-- google_calendar_tokens: restrict SELECT to owner or org admin
DROP POLICY IF EXISTS gct_select_org ON public.google_calendar_tokens;
CREATE POLICY gct_select_owner_or_admin
ON public.google_calendar_tokens FOR SELECT
USING (
  auth.uid() = user_id
  OR (org_id IS NOT NULL AND private.has_org_role(org_id, 'admin'::app_role))
);

-- meta_business_pages: restrict to owner or org admin
DROP POLICY IF EXISTS mbp_manage_org ON public.meta_business_pages;
CREATE POLICY mbp_manage_owner_or_admin
ON public.meta_business_pages FOR ALL
USING (
  auth.uid() = user_id
  OR (org_id IS NOT NULL AND private.has_org_role(org_id, 'admin'::app_role))
)
WITH CHECK (
  auth.uid() = user_id
  OR (org_id IS NOT NULL AND private.has_org_role(org_id, 'admin'::app_role))
);

-- whatsapp_connections: restrict to owner or org admin
DROP POLICY IF EXISTS wac_manage_org ON public.whatsapp_connections;
CREATE POLICY wac_manage_owner_or_admin
ON public.whatsapp_connections FOR ALL
USING (
  auth.uid() = user_id
  OR (org_id IS NOT NULL AND private.has_org_role(org_id, 'admin'::app_role))
)
WITH CHECK (
  auth.uid() = user_id
  OR (org_id IS NOT NULL AND private.has_org_role(org_id, 'admin'::app_role))
);

-- whatsapp_envios: restrict SELECT to owner or org admin
DROP POLICY IF EXISTS wae_select_org ON public.whatsapp_envios;
CREATE POLICY wae_select_owner_or_admin
ON public.whatsapp_envios FOR SELECT
USING (
  auth.uid() = user_id
  OR (org_id IS NOT NULL AND private.has_org_role(org_id, 'admin'::app_role))
);
