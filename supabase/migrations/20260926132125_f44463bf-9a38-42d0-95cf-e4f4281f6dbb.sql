
ALTER TABLE public.tarefas ADD COLUMN IF NOT EXISTS tempo_estimado_minutos integer,
  ADD COLUMN IF NOT EXISTS timer_acumulado_segundos integer NOT NULL DEFAULT 0;
ALTER TABLE public.tarefas ALTER COLUMN status SET DEFAULT 'not_started';
UPDATE public.tarefas SET status = CASE
  WHEN lower(status) IN ('in_progress','em_andamento','doing') THEN 'in_progress'
  WHEN lower(status) IN ('in_review','em_revisao','em_revisão','review','revisao') THEN 'in_review'
  WHEN lower(status) IN ('done','concluida','concluído','concluido') THEN 'done'
  ELSE 'not_started' END
WHERE status NOT IN ('not_started','in_progress','in_review','done');

CREATE TABLE public.tarefa_tempo_registros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL DEFAULT private.current_org_id() REFERENCES public.organizations(id),
  tarefa_id uuid NOT NULL REFERENCES public.tarefas(id) ON DELETE CASCADE,
  user_id uuid DEFAULT auth.uid(),
  duracao_segundos integer NOT NULL,
  origem text NOT NULL DEFAULT 'manual' CHECK (origem IN ('cronometro','manual','ajuste')),
  data date NOT NULL DEFAULT current_date,
  observacao text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.tarefa_tempo_registros(tarefa_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tarefa_tempo_registros TO authenticated;
GRANT ALL ON public.tarefa_tempo_registros TO service_role;
ALTER TABLE public.tarefa_tempo_registros ENABLE ROW LEVEL SECURITY;
CREATE POLICY org_tempo ON public.tarefa_tempo_registros FOR ALL TO authenticated
  USING (private.is_org_member(org_id) AND NOT has_role(auth.uid(),'cliente'))
  WITH CHECK (private.is_org_member(org_id) AND NOT has_role(auth.uid(),'cliente')
    AND EXISTS (SELECT 1 FROM public.tarefas t WHERE t.id = tarefa_id AND t.org_id = tarefa_tempo_registros.org_id));

-- backfill tempo existente como registro manual
INSERT INTO public.tarefa_tempo_registros (org_id, tarefa_id, user_id, duracao_segundos, origem, data, observacao)
SELECT org_id, id, assignee_id, tempo_total_segundos, 'manual', created_at::date, 'Tempo registrado antes da migração'
FROM public.tarefas WHERE tempo_total_segundos > 0 AND org_id IS NOT NULL;
-- sessões abertas: preservam o acumulado na sessão (o total fica nos registros)
UPDATE public.tarefas SET timer_acumulado_segundos = 0 WHERE timer_status <> 'stopped';

CREATE OR REPLACE FUNCTION private.sync_tarefa_tempo() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE tid uuid := COALESCE(NEW.tarefa_id, OLD.tarefa_id);
BEGIN
  UPDATE public.tarefas SET tempo_total_segundos = GREATEST(0, COALESCE((SELECT sum(duracao_segundos) FROM public.tarefa_tempo_registros WHERE tarefa_id = tid),0))
  WHERE id = tid;
  RETURN NULL;
END $$;
CREATE TRIGGER tarefa_tempo_sync AFTER INSERT OR UPDATE OR DELETE ON public.tarefa_tempo_registros
  FOR EACH ROW EXECUTE FUNCTION private.sync_tarefa_tempo();

CREATE TABLE public.tarefa_subtarefas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL DEFAULT private.current_org_id() REFERENCES public.organizations(id),
  tarefa_id uuid NOT NULL REFERENCES public.tarefas(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  concluida boolean NOT NULL DEFAULT false,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ON public.tarefa_subtarefas(tarefa_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tarefa_subtarefas TO authenticated;
GRANT ALL ON public.tarefa_subtarefas TO service_role;
ALTER TABLE public.tarefa_subtarefas ENABLE ROW LEVEL SECURITY;
CREATE POLICY org_subtarefas ON public.tarefa_subtarefas FOR ALL TO authenticated
  USING (private.is_org_member(org_id) AND NOT has_role(auth.uid(),'cliente'))
  WITH CHECK (private.is_org_member(org_id) AND NOT has_role(auth.uid(),'cliente')
    AND EXISTS (SELECT 1 FROM public.tarefas t WHERE t.id = tarefa_id AND t.org_id = tarefa_subtarefas.org_id));
CREATE TRIGGER tarefa_subtarefas_updated BEFORE UPDATE ON public.tarefa_subtarefas FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.task_comments
  ADD COLUMN IF NOT EXISTS attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS mentions uuid[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.task_comments(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS edited_at timestamptz;
DROP POLICY IF EXISTS org_task_comments ON public.task_comments;
CREATE POLICY task_comments_read ON public.task_comments FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.tarefas t WHERE t.id = task_id AND private.is_org_member(t.org_id) AND NOT has_role(auth.uid(),'cliente')));
CREATE POLICY task_comments_insert ON public.task_comments FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid() AND EXISTS (SELECT 1 FROM public.tarefas t WHERE t.id = task_id AND private.is_org_member(t.org_id) AND NOT has_role(auth.uid(),'cliente')));
CREATE POLICY task_comments_update_own ON public.task_comments FOR UPDATE TO authenticated
  USING (author_id = auth.uid() AND EXISTS (SELECT 1 FROM public.tarefas t WHERE t.id = task_id AND private.is_org_member(t.org_id)))
  WITH CHECK (author_id = auth.uid());
CREATE POLICY task_comments_delete_own ON public.task_comments FOR DELETE TO authenticated
  USING (author_id = auth.uid() AND EXISTS (SELECT 1 FROM public.tarefas t WHERE t.id = task_id AND private.is_org_member(t.org_id)));

CREATE OR REPLACE FUNCTION public.list_team_members() RETURNS TABLE(id uuid, nome text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p.id, COALESCE(p.nome, p.email, 'Sem nome')
  FROM public.memberships m JOIN public.profiles p ON p.id = m.user_id
  WHERE m.org_id = private.current_org_id() AND m.role <> 'cliente'
    AND NOT has_role(auth.uid(),'cliente') AND private.is_org_member(m.org_id)
  GROUP BY p.id, p.nome, p.email ORDER BY 2;
$$;
REVOKE EXECUTE ON FUNCTION public.list_team_members() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_team_members() TO authenticated;

CREATE POLICY tarefas_anexos_staff ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'tarefas-anexos' AND (storage.foldername(name))[1] = private.current_org_id()::text AND NOT public.has_role(auth.uid(),'cliente'))
  WITH CHECK (bucket_id = 'tarefas-anexos' AND (storage.foldername(name))[1] = private.current_org_id()::text AND NOT public.has_role(auth.uid(),'cliente'));
