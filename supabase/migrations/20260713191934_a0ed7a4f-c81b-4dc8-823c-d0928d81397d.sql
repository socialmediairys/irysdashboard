-- Sprint / Kanban schema additions
-- Note: existing 'tarefas' table is the tasks table; we only add missing columns.

-- 1) sprints
CREATE TABLE IF NOT EXISTS public.sprints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  status text NOT NULL CHECK (status IN ('current','next','future')),
  start_date date,
  end_date date,
  org_id uuid REFERENCES public.organizations(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sprints TO authenticated;
GRANT ALL ON public.sprints TO service_role;
ALTER TABLE public.sprints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso isolado por org_id" ON public.sprints
  USING (org_id = (SELECT profiles.org_id FROM public.profiles WHERE profiles.id = auth.uid()));
CREATE POLICY "Admin/team pode gerenciar sprints" ON public.sprints
  TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'gestor'::app_role) OR has_role(auth.uid(),'editor'::app_role) OR has_role(auth.uid(),'social'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'gestor'::app_role) OR has_role(auth.uid(),'editor'::app_role) OR has_role(auth.uid(),'social'::app_role));

-- 2) tarefas: add missing columns only
ALTER TABLE public.tarefas
  ADD COLUMN IF NOT EXISTS sprint_id uuid REFERENCES public.sprints(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assignee_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS timer_status text CHECK (timer_status IN ('stopped','running','paused')) DEFAULT 'stopped';

-- 3) tags
CREATE TABLE IF NOT EXISTS public.tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  color text DEFAULT '#94a3b8'
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tags TO authenticated;
GRANT ALL ON public.tags TO service_role;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin/team pode gerenciar tags" ON public.tags
  TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'gestor'::app_role) OR has_role(auth.uid(),'editor'::app_role) OR has_role(auth.uid(),'social'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'gestor'::app_role) OR has_role(auth.uid(),'editor'::app_role) OR has_role(auth.uid(),'social'::app_role));

-- 4) task_tags
CREATE TABLE IF NOT EXISTS public.task_tags (
  task_id uuid NOT NULL REFERENCES public.tarefas(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, tag_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.task_tags TO authenticated;
GRANT ALL ON public.task_tags TO service_role;
ALTER TABLE public.task_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso isolado por org_id" ON public.task_tags
  USING (EXISTS (SELECT 1 FROM public.tarefas t WHERE t.id = task_tags.task_id AND t.org_id = (SELECT profiles.org_id FROM public.profiles WHERE profiles.id = auth.uid())));
CREATE POLICY "Admin/team pode gerenciar task_tags" ON public.task_tags
  TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'gestor'::app_role) OR has_role(auth.uid(),'editor'::app_role) OR has_role(auth.uid(),'social'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'gestor'::app_role) OR has_role(auth.uid(),'editor'::app_role) OR has_role(auth.uid(),'social'::app_role));

-- 5) task_comments (new English-named table per spec; existing tarefa_comentarios kept intact)
CREATE TABLE IF NOT EXISTS public.task_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tarefas(id) ON DELETE CASCADE,
  author_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.task_comments TO authenticated;
GRANT ALL ON public.task_comments TO service_role;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acesso isolado por org_id" ON public.task_comments
  USING (EXISTS (SELECT 1 FROM public.tarefas t WHERE t.id = task_comments.task_id AND t.org_id = (SELECT profiles.org_id FROM public.profiles WHERE profiles.id = auth.uid())));
CREATE POLICY "Admin/team pode gerenciar task_comments" ON public.task_comments
  TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'gestor'::app_role) OR has_role(auth.uid(),'editor'::app_role) OR has_role(auth.uid(),'social'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role) OR has_role(auth.uid(),'gestor'::app_role) OR has_role(auth.uid(),'editor'::app_role) OR has_role(auth.uid(),'social'::app_role));