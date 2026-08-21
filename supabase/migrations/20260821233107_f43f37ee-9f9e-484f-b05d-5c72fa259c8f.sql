-- ---------- ETAPA A ----------
UPDATE public.organizations SET name = 'Irys' WHERE id = '1c6d3cbc-1e65-4f3f-be49-f3fb95fd189b';

UPDATE public.clientes SET org_id = '1c6d3cbc-1e65-4f3f-be49-f3fb95fd189b' WHERE org_id IS DISTINCT FROM '1c6d3cbc-1e65-4f3f-be49-f3fb95fd189b';
UPDATE public.profiles SET org_id = '1c6d3cbc-1e65-4f3f-be49-f3fb95fd189b' WHERE org_id IS DISTINCT FROM '1c6d3cbc-1e65-4f3f-be49-f3fb95fd189b';
UPDATE public.agenda_itens SET org_id = '1c6d3cbc-1e65-4f3f-be49-f3fb95fd189b' WHERE org_id IS DISTINCT FROM '1c6d3cbc-1e65-4f3f-be49-f3fb95fd189b';
UPDATE public.tarefas SET org_id = '1c6d3cbc-1e65-4f3f-be49-f3fb95fd189b' WHERE org_id IS DISTINCT FROM '1c6d3cbc-1e65-4f3f-be49-f3fb95fd189b';
UPDATE public.sprints SET org_id = '1c6d3cbc-1e65-4f3f-be49-f3fb95fd189b' WHERE org_id IS DISTINCT FROM '1c6d3cbc-1e65-4f3f-be49-f3fb95fd189b';
UPDATE public.financeiro SET org_id = '1c6d3cbc-1e65-4f3f-be49-f3fb95fd189b' WHERE org_id IS DISTINCT FROM '1c6d3cbc-1e65-4f3f-be49-f3fb95fd189b';
UPDATE public.google_calendar_tokens SET org_id = '1c6d3cbc-1e65-4f3f-be49-f3fb95fd189b' WHERE org_id IS DISTINCT FROM '1c6d3cbc-1e65-4f3f-be49-f3fb95fd189b';
UPDATE public.meta_business_pages SET org_id = '1c6d3cbc-1e65-4f3f-be49-f3fb95fd189b' WHERE org_id IS DISTINCT FROM '1c6d3cbc-1e65-4f3f-be49-f3fb95fd189b';
UPDATE public.whatsapp_connections SET org_id = '1c6d3cbc-1e65-4f3f-be49-f3fb95fd189b' WHERE org_id IS DISTINCT FROM '1c6d3cbc-1e65-4f3f-be49-f3fb95fd189b';
UPDATE public.whatsapp_envios SET org_id = '1c6d3cbc-1e65-4f3f-be49-f3fb95fd189b' WHERE org_id IS DISTINCT FROM '1c6d3cbc-1e65-4f3f-be49-f3fb95fd189b';

DELETE FROM public.memberships WHERE org_id = '99f488e1-c27d-4d41-9d56-ab16db79a48f';
DELETE FROM public.organizations WHERE id = '99f488e1-c27d-4d41-9d56-ab16db79a48f';

-- ---------- Helpers ----------
CREATE OR REPLACE FUNCTION private.current_org_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $fn$
  SELECT org_id FROM public.profiles WHERE id = auth.uid()
$fn$;
REVOKE ALL ON FUNCTION private.current_org_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.current_org_id() TO authenticated;

CREATE OR REPLACE FUNCTION private.set_org_id_from_profile()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
BEGIN
  IF NEW.org_id IS NULL THEN
    NEW.org_id := private.current_org_id();
  END IF;
  RETURN NEW;
END;
$fn$;
REVOKE ALL ON FUNCTION private.set_org_id_from_profile() FROM PUBLIC;

-- ---------- ETAPA B1: coluna nullable -> backfill -> NOT NULL ----------
DO $do$
DECLARE
  irys uuid := '1c6d3cbc-1e65-4f3f-be49-f3fb95fd189b';
  arr text[] := ARRAY[
    'leads:', 'entradas_financeiras:cliente_id', 'saidas_financeiras:',
    'contas_fixas:cliente_id', 'financas_administrativas:cliente_id',
    'ferramentas:', 'prompts:', 'referencias:', 'tags:',
    'arquivos:cliente_id', 'estrategias:cliente_id', 'conteudos_cliente:cliente_id',
    'documentos_juridicos:cliente_id', 'onboarding_checklist:cliente_id',
    'progresso_audio:cliente_id', 'suporte_tickets:cliente_id',
    'social_accounts:client_id'
  ];
  spec text; tbl text; col text;
BEGIN
  FOREACH spec IN ARRAY arr LOOP
    tbl := split_part(spec, ':', 1);
    col := NULLIF(split_part(spec, ':', 2), '');

    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id)', tbl);

    IF col IS NOT NULL THEN
      EXECUTE format('UPDATE public.%I x SET org_id = c.org_id FROM public.clientes c WHERE x.%I = c.id AND x.org_id IS NULL AND c.org_id IS NOT NULL', tbl, col);
    END IF;
    EXECUTE format('UPDATE public.%I SET org_id = %L WHERE org_id IS NULL', tbl, irys);

    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN org_id SET NOT NULL', tbl);
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I (org_id)', tbl || '_org_id_idx', tbl);

    EXECUTE format('DROP TRIGGER IF EXISTS trg_%s_set_org_id ON public.%I', tbl, tbl);
    EXECUTE format('CREATE TRIGGER trg_%s_set_org_id BEFORE INSERT ON public.%I FOR EACH ROW EXECUTE FUNCTION private.set_org_id_from_profile()', tbl, tbl);
  END LOOP;
END $do$;

ALTER TABLE public.solicitacoes_cadastro ADD COLUMN IF NOT EXISTS org_id uuid REFERENCES public.organizations(id);
UPDATE public.solicitacoes_cadastro s SET org_id = c.org_id FROM public.clientes c WHERE s.cliente_id = c.id AND s.org_id IS NULL;

-- ---------- ETAPA C: policies ----------
DROP POLICY IF EXISTS "Admin/financeiro gerencia entradas" ON public.entradas_financeiras;
CREATE POLICY "org_financeiro_entradas" ON public.entradas_financeiras FOR ALL TO authenticated
  USING (private.is_org_member(org_id) AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'financeiro')))
  WITH CHECK (private.is_org_member(org_id) AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'financeiro')));

DROP POLICY IF EXISTS "Admin/financeiro gerencia saidas" ON public.saidas_financeiras;
CREATE POLICY "org_financeiro_saidas" ON public.saidas_financeiras FOR ALL TO authenticated
  USING (private.is_org_member(org_id) AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'financeiro')))
  WITH CHECK (private.is_org_member(org_id) AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'financeiro')));

DROP POLICY IF EXISTS "Admin/financeiro gerencia contas_fixas" ON public.contas_fixas;
CREATE POLICY "org_financeiro_contas_fixas" ON public.contas_fixas FOR ALL TO authenticated
  USING (private.is_org_member(org_id) AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'financeiro')))
  WITH CHECK (private.is_org_member(org_id) AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'financeiro')));

DROP POLICY IF EXISTS "Admin gerencia finanças" ON public.financas_administrativas;
CREATE POLICY "org_admin_financas_administrativas" ON public.financas_administrativas FOR ALL TO authenticated
  USING (private.is_org_member(org_id) AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'financeiro')))
  WITH CHECK (private.is_org_member(org_id) AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'financeiro')));

DROP POLICY IF EXISTS "Admin/gestor gerencia leads" ON public.leads;
CREATE POLICY "org_leads" ON public.leads FOR ALL TO authenticated
  USING (private.is_org_member(org_id) AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gestor')))
  WITH CHECK (private.is_org_member(org_id) AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gestor')));

DROP POLICY IF EXISTS "Time interno pode gerenciar ferramentas" ON public.ferramentas;
CREATE POLICY "org_ferramentas" ON public.ferramentas FOR ALL TO authenticated
  USING (private.is_org_member(org_id) AND NOT public.has_role(auth.uid(),'cliente'))
  WITH CHECK (private.is_org_member(org_id) AND NOT public.has_role(auth.uid(),'cliente'));

DROP POLICY IF EXISTS "Time interno pode gerenciar prompts" ON public.prompts;
CREATE POLICY "org_prompts" ON public.prompts FOR ALL TO authenticated
  USING (private.is_org_member(org_id) AND NOT public.has_role(auth.uid(),'cliente'))
  WITH CHECK (private.is_org_member(org_id) AND NOT public.has_role(auth.uid(),'cliente'));

DROP POLICY IF EXISTS "Time interno pode gerenciar referencias" ON public.referencias;
CREATE POLICY "org_referencias" ON public.referencias FOR ALL TO authenticated
  USING (private.is_org_member(org_id) AND NOT public.has_role(auth.uid(),'cliente'))
  WITH CHECK (private.is_org_member(org_id) AND NOT public.has_role(auth.uid(),'cliente'));

DROP POLICY IF EXISTS "Admin/team pode gerenciar tags" ON public.tags;
CREATE POLICY "org_tags" ON public.tags FOR ALL TO authenticated
  USING (private.is_org_member(org_id) AND NOT public.has_role(auth.uid(),'cliente'))
  WITH CHECK (private.is_org_member(org_id) AND NOT public.has_role(auth.uid(),'cliente'));

DROP POLICY IF EXISTS "Admin/team pode gerenciar estrategias" ON public.estrategias;
CREATE POLICY "org_estrategias" ON public.estrategias FOR ALL TO authenticated
  USING (private.is_org_member(org_id) AND NOT public.has_role(auth.uid(),'cliente'))
  WITH CHECK (private.is_org_member(org_id) AND NOT public.has_role(auth.uid(),'cliente'));

DROP POLICY IF EXISTS arquivos_admin_all ON public.arquivos;
DROP POLICY IF EXISTS arquivos_cliente_read ON public.arquivos;
CREATE POLICY "org_arquivos_staff" ON public.arquivos FOR ALL TO authenticated
  USING (private.is_org_member(org_id) AND public.has_role(auth.uid(),'admin'))
  WITH CHECK (private.is_org_member(org_id) AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "org_arquivos_cliente_read" ON public.arquivos FOR SELECT TO authenticated
  USING (org_id = private.current_org_id() AND cliente_id = public.current_cliente_id() AND visivel_cliente = true);

DROP POLICY IF EXISTS "Admin gerencia conteúdos" ON public.conteudos_cliente;
DROP POLICY IF EXISTS "Cliente vê próprios conteúdos" ON public.conteudos_cliente;
CREATE POLICY "org_conteudos_cliente_staff" ON public.conteudos_cliente FOR ALL TO authenticated
  USING (private.is_org_member(org_id) AND public.has_role(auth.uid(),'admin'))
  WITH CHECK (private.is_org_member(org_id) AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "org_conteudos_cliente_self" ON public.conteudos_cliente FOR SELECT TO authenticated
  USING (org_id = private.current_org_id() AND cliente_id = public.current_cliente_id());

DROP POLICY IF EXISTS "Admin gerencia documentos" ON public.documentos_juridicos;
DROP POLICY IF EXISTS "Cliente vê próprios docs ou públicos" ON public.documentos_juridicos;
CREATE POLICY "org_documentos_staff" ON public.documentos_juridicos FOR ALL TO authenticated
  USING (private.is_org_member(org_id) AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'juridico')))
  WITH CHECK (private.is_org_member(org_id) AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'juridico')));
CREATE POLICY "org_documentos_cliente_read" ON public.documentos_juridicos FOR SELECT TO authenticated
  USING (org_id = private.current_org_id() AND (publico = true OR cliente_id = public.current_cliente_id()));

DROP POLICY IF EXISTS "Admin gerencia checklist" ON public.onboarding_checklist;
DROP POLICY IF EXISTS "Cliente vê próprio checklist" ON public.onboarding_checklist;
DROP POLICY IF EXISTS "Cliente marca próprio checklist" ON public.onboarding_checklist;
CREATE POLICY "org_checklist_staff" ON public.onboarding_checklist FOR ALL TO authenticated
  USING (private.is_org_member(org_id) AND public.has_role(auth.uid(),'admin'))
  WITH CHECK (private.is_org_member(org_id) AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "org_checklist_cliente_read" ON public.onboarding_checklist FOR SELECT TO authenticated
  USING (org_id = private.current_org_id() AND cliente_id = public.current_cliente_id());
CREATE POLICY "org_checklist_cliente_update" ON public.onboarding_checklist FOR UPDATE TO authenticated
  USING (org_id = private.current_org_id() AND cliente_id = public.current_cliente_id() AND responsavel = 'cliente')
  WITH CHECK (org_id = private.current_org_id() AND cliente_id = public.current_cliente_id() AND responsavel = 'cliente');

DROP POLICY IF EXISTS progresso_audio_admin_all ON public.progresso_audio;
DROP POLICY IF EXISTS progresso_audio_cliente_rw ON public.progresso_audio;
CREATE POLICY "org_progresso_staff" ON public.progresso_audio FOR ALL TO authenticated
  USING (private.is_org_member(org_id) AND public.has_role(auth.uid(),'admin'))
  WITH CHECK (private.is_org_member(org_id) AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "org_progresso_cliente_rw" ON public.progresso_audio FOR ALL TO authenticated
  USING (org_id = private.current_org_id() AND cliente_id = public.current_cliente_id())
  WITH CHECK (org_id = private.current_org_id() AND cliente_id = public.current_cliente_id());

DROP POLICY IF EXISTS "Admin gerencia tickets" ON public.suporte_tickets;
DROP POLICY IF EXISTS "Cliente vê próprios tickets" ON public.suporte_tickets;
DROP POLICY IF EXISTS "Cliente cria próprios tickets" ON public.suporte_tickets;
CREATE POLICY "org_tickets_staff" ON public.suporte_tickets FOR ALL TO authenticated
  USING (private.is_org_member(org_id) AND NOT public.has_role(auth.uid(),'cliente'))
  WITH CHECK (private.is_org_member(org_id) AND NOT public.has_role(auth.uid(),'cliente'));
CREATE POLICY "org_tickets_cliente_read" ON public.suporte_tickets FOR SELECT TO authenticated
  USING (org_id = private.current_org_id() AND cliente_id = public.current_cliente_id());
CREATE POLICY "org_tickets_cliente_insert" ON public.suporte_tickets FOR INSERT TO authenticated
  WITH CHECK (org_id = private.current_org_id() AND cliente_id = public.current_cliente_id());

DROP POLICY IF EXISTS "Admin gerencia solicitações" ON public.solicitacoes_cadastro;
CREATE POLICY "org_solicitacoes_admin" ON public.solicitacoes_cadastro FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') AND (org_id IS NULL OR private.is_org_member(org_id)))
  WITH CHECK (public.has_role(auth.uid(),'admin') AND (org_id IS NULL OR private.is_org_member(org_id)));

DROP POLICY IF EXISTS "Admin/team manage social accounts" ON public.social_accounts;
DROP POLICY IF EXISTS "Client sees own social accounts" ON public.social_accounts;
CREATE POLICY "org_social_accounts_staff" ON public.social_accounts FOR ALL TO authenticated
  USING (private.is_org_member(org_id) AND NOT public.has_role(auth.uid(),'cliente'))
  WITH CHECK (private.is_org_member(org_id) AND NOT public.has_role(auth.uid(),'cliente'));
CREATE POLICY "org_social_accounts_cliente_read" ON public.social_accounts FOR SELECT TO authenticated
  USING (org_id = private.current_org_id() AND client_id = public.current_cliente_id());

DROP POLICY IF EXISTS "Admin/team manage social goals" ON public.social_goals;
DROP POLICY IF EXISTS "Client sees own social goals" ON public.social_goals;
CREATE POLICY "org_social_goals" ON public.social_goals FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.social_accounts sa WHERE sa.id = social_goals.social_account_id AND private.is_org_member(sa.org_id) AND NOT public.has_role(auth.uid(),'cliente')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.social_accounts sa WHERE sa.id = social_goals.social_account_id AND private.is_org_member(sa.org_id) AND NOT public.has_role(auth.uid(),'cliente')));
CREATE POLICY "org_social_goals_cliente_read" ON public.social_goals FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.social_accounts sa WHERE sa.id = social_goals.social_account_id AND sa.org_id = private.current_org_id() AND sa.client_id = public.current_cliente_id()));

DROP POLICY IF EXISTS "Admin/team manage social snapshots" ON public.social_metrics_snapshots;
DROP POLICY IF EXISTS "Client sees own social snapshots" ON public.social_metrics_snapshots;
CREATE POLICY "org_social_snapshots" ON public.social_metrics_snapshots FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.social_accounts sa WHERE sa.id = social_metrics_snapshots.social_account_id AND private.is_org_member(sa.org_id) AND NOT public.has_role(auth.uid(),'cliente')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.social_accounts sa WHERE sa.id = social_metrics_snapshots.social_account_id AND private.is_org_member(sa.org_id) AND NOT public.has_role(auth.uid(),'cliente')));
CREATE POLICY "org_social_snapshots_cliente_read" ON public.social_metrics_snapshots FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.social_accounts sa WHERE sa.id = social_metrics_snapshots.social_account_id AND sa.org_id = private.current_org_id() AND sa.client_id = public.current_cliente_id()));

-- ---------- ETAPA B2: derivadas ----------
DROP POLICY IF EXISTS "Admin/team pode gerenciar task_tags" ON public.task_tags;
CREATE POLICY "org_task_tags" ON public.task_tags FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.tarefas t WHERE t.id = task_tags.task_id AND private.is_org_member(t.org_id) AND NOT public.has_role(auth.uid(),'cliente')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.tarefas t WHERE t.id = task_tags.task_id AND private.is_org_member(t.org_id) AND NOT public.has_role(auth.uid(),'cliente')));

DROP POLICY IF EXISTS "Admin/team pode gerenciar task_comments" ON public.task_comments;
CREATE POLICY "org_task_comments" ON public.task_comments FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.tarefas t WHERE t.id = task_comments.task_id AND private.is_org_member(t.org_id) AND NOT public.has_role(auth.uid(),'cliente')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.tarefas t WHERE t.id = task_comments.task_id AND private.is_org_member(t.org_id) AND NOT public.has_role(auth.uid(),'cliente')));

DROP POLICY IF EXISTS "Admin/team pode gerenciar comentarios de tarefas" ON public.tarefa_comentarios;
CREATE POLICY "org_tarefa_comentarios" ON public.tarefa_comentarios FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.tarefas t WHERE t.id = tarefa_comentarios.tarefa_id AND private.is_org_member(t.org_id) AND NOT public.has_role(auth.uid(),'cliente')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.tarefas t WHERE t.id = tarefa_comentarios.tarefa_id AND private.is_org_member(t.org_id) AND NOT public.has_role(auth.uid(),'cliente')));

-- ---------- ETAPA D: modulo Estrategia ----------
CREATE TABLE IF NOT EXISTS public.estrategia_briefing (
  cliente_id uuid PRIMARY KEY REFERENCES public.clientes(id) ON DELETE CASCADE,
  org_id     uuid NOT NULL REFERENCES public.organizations(id),
  mapa       jsonb NOT NULL DEFAULT '{}'::jsonb,
  scores     jsonb NOT NULL DEFAULT '{}'::jsonb,
  lacunas    text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.estrategia_evidencias (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id    uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  org_id        uuid NOT NULL REFERENCES public.organizations(id),
  informacao    text NOT NULL,
  classificacao text NOT NULL DEFAULT 'Fato',
  muda          text,
  evidencia     text,
  validar       text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.estrategia_briefing TO authenticated;
GRANT ALL ON public.estrategia_briefing TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.estrategia_evidencias TO authenticated;
GRANT ALL ON public.estrategia_evidencias TO service_role;

ALTER TABLE public.estrategia_briefing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estrategia_evidencias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_estrategia_briefing" ON public.estrategia_briefing FOR ALL TO authenticated
  USING (private.is_org_member(org_id) AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gestor')))
  WITH CHECK (private.is_org_member(org_id) AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gestor')));

CREATE POLICY "org_estrategia_evidencias" ON public.estrategia_evidencias FOR ALL TO authenticated
  USING (private.is_org_member(org_id) AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gestor')))
  WITH CHECK (private.is_org_member(org_id) AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gestor')));

CREATE INDEX IF NOT EXISTS estrategia_evidencias_cliente_idx ON public.estrategia_evidencias (cliente_id);
CREATE INDEX IF NOT EXISTS estrategia_briefing_org_idx ON public.estrategia_briefing (org_id);
CREATE INDEX IF NOT EXISTS estrategia_evidencias_org_idx ON public.estrategia_evidencias (org_id);

CREATE TRIGGER trg_estrategia_briefing_set_org_id BEFORE INSERT ON public.estrategia_briefing
  FOR EACH ROW EXECUTE FUNCTION private.set_org_id_from_profile();
CREATE TRIGGER trg_estrategia_evidencias_set_org_id BEFORE INSERT ON public.estrategia_evidencias
  FOR EACH ROW EXECUTE FUNCTION private.set_org_id_from_profile();
CREATE TRIGGER trg_estrategia_briefing_updated BEFORE UPDATE ON public.estrategia_briefing
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();