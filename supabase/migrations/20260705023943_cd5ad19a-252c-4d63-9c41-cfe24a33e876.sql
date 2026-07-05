
-- =========================================================
-- Fase 2 · Fundação de CRUD
-- Novas tabelas + colunas complementares p/ tarefas, estratégias,
-- referências, prompts, ferramentas e enriquecimento de leads/clientes/finanças.
-- =========================================================

-- ---------- Coluna livre para exibição do plano do cliente ----------
ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS plano_label text;

-- ---------- Enriquecimento da tabela leads ----------
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS etapa text NOT NULL DEFAULT 'lead',
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS telefone text,
  ADD COLUMN IF NOT EXISTS proxima_acao text,
  ADD COLUMN IF NOT EXISTS data_proxima_acao date;

-- ---------- Enriquecimento da tabela financas_administrativas ----------
ALTER TABLE public.financas_administrativas
  ADD COLUMN IF NOT EXISTS categoria_livre text,
  ADD COLUMN IF NOT EXISTS cliente_id uuid REFERENCES public.clientes(id) ON DELETE SET NULL;

-- =========================================================
-- TAREFAS (Criação & Aprovação de conteúdo)
-- =========================================================
CREATE TABLE IF NOT EXISTS public.tarefas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  cliente_id uuid REFERENCES public.clientes(id) ON DELETE SET NULL,
  tipo text NOT NULL DEFAULT 'outro',
  status text NOT NULL DEFAULT 'backlog',
  prioridade text NOT NULL DEFAULT 'media',
  prazo date,
  descricao text,
  arquivo_url text,
  criado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tarefas TO authenticated;
GRANT ALL ON public.tarefas TO service_role;

ALTER TABLE public.tarefas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/team pode gerenciar tarefas"
  ON public.tarefas FOR ALL TO authenticated
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

CREATE TRIGGER tarefas_set_updated_at
  BEFORE UPDATE ON public.tarefas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- ESTRATEGIAS (Estratégia por cliente)
-- =========================================================
CREATE TABLE IF NOT EXISTS public.estrategias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  pilares jsonb NOT NULL DEFAULT '[]'::jsonb,
  formatos jsonb NOT NULL DEFAULT '[]'::jsonb,
  qtd_entregaveis integer NOT NULL DEFAULT 0,
  objetivo text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.estrategias TO authenticated;
GRANT ALL ON public.estrategias TO service_role;

ALTER TABLE public.estrategias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/team pode gerenciar estrategias"
  ON public.estrategias FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'gestor')
    OR public.has_role(auth.uid(), 'social')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'gestor')
    OR public.has_role(auth.uid(), 'social')
  );

CREATE TRIGGER estrategias_set_updated_at
  BEFORE UPDATE ON public.estrategias
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- REFERENCIAS (Biblioteca — Referências / Swipe file)
-- =========================================================
CREATE TABLE IF NOT EXISTS public.referencias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  categoria text NOT NULL DEFAULT 'outro',
  url text NOT NULL,
  descricao text,
  criado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.referencias TO authenticated;
GRANT ALL ON public.referencias TO service_role;

ALTER TABLE public.referencias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Time interno pode gerenciar referencias"
  ON public.referencias FOR ALL TO authenticated
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

CREATE TRIGGER referencias_set_updated_at
  BEFORE UPDATE ON public.referencias
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- PROMPTS (Biblioteca — Prompts IA)
-- =========================================================
CREATE TABLE IF NOT EXISTS public.prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo text NOT NULL,
  categoria text NOT NULL DEFAULT 'outro',
  conteudo text NOT NULL,
  criado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.prompts TO authenticated;
GRANT ALL ON public.prompts TO service_role;

ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Time interno pode gerenciar prompts"
  ON public.prompts FOR ALL TO authenticated
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

CREATE TRIGGER prompts_set_updated_at
  BEFORE UPDATE ON public.prompts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================================================
-- FERRAMENTAS (Biblioteca — Ferramentas / stack)
-- =========================================================
CREATE TABLE IF NOT EXISTS public.ferramentas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  url text NOT NULL,
  custo_mensal numeric NOT NULL DEFAULT 0,
  categoria text NOT NULL DEFAULT 'outro',
  criado_por uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ferramentas TO authenticated;
GRANT ALL ON public.ferramentas TO service_role;

ALTER TABLE public.ferramentas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Time interno pode gerenciar ferramentas"
  ON public.ferramentas FOR ALL TO authenticated
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

CREATE TRIGGER ferramentas_set_updated_at
  BEFORE UPDATE ON public.ferramentas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
