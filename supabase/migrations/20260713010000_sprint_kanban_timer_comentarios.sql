-- =========================================================
-- Sprint (Calendário) — Kanban: timer de trabalho + comentários
-- =========================================================

-- ---------- Timer de trabalho na tarefa ----------
-- tempo_total_segundos: acumulado de tempo já registrado (persistido a cada pausa)
-- timer_iniciado_em: timestamp de quando o timer foi iniciado; null = parado
ALTER TABLE public.tarefas
  ADD COLUMN IF NOT EXISTS tempo_total_segundos integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS timer_iniciado_em timestamptz;

-- =========================================================
-- TAREFA_COMENTARIOS (comentários em cada card do Sprint)
-- =========================================================
CREATE TABLE IF NOT EXISTS public.tarefa_comentarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tarefa_id uuid NOT NULL REFERENCES public.tarefas(id) ON DELETE CASCADE,
  autor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  conteudo text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tarefa_comentarios TO authenticated;
GRANT ALL ON public.tarefa_comentarios TO service_role;

ALTER TABLE public.tarefa_comentarios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/team pode gerenciar comentarios de tarefas"
  ON public.tarefa_comentarios FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'gestor')
    OR public.has_role(auth.uid(), 'editor')
    OR public.has_role(auth.uid(), 'social')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'gestor')
    OR public.has_role(auth.uid(), 'editor')
    OR public.has_role(auth.uid(), 'social')
  );

CREATE INDEX IF NOT EXISTS tarefa_comentarios_tarefa_idx ON public.tarefa_comentarios(tarefa_id);
