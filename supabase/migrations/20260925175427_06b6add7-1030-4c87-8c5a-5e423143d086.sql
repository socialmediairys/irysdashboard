DO $$ BEGIN
  CREATE TYPE public.estrategia_etapa_status AS ENUM ('nao_iniciada','em_andamento','revisar','concluida');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Jornada: controle de estado das 13 etapas por cliente
CREATE TABLE IF NOT EXISTS public.estrategia_etapas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL DEFAULT private.current_org_id() REFERENCES public.organizations(id),
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  etapa smallint NOT NULL CHECK (etapa BETWEEN 1 AND 13),
  status public.estrategia_etapa_status NOT NULL DEFAULT 'nao_iniciada',
  progresso smallint CHECK (progresso BETWEEN 0 AND 100),
  iniciado_em timestamptz,
  concluido_em timestamptz,
  metadados jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (cliente_id, etapa)
);

-- Fontes de investigação
CREATE TABLE IF NOT EXISTS public.estrategia_fontes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL DEFAULT private.current_org_id() REFERENCES public.organizations(id),
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  etapa smallint NOT NULL CHECK (etapa BETWEEN 1 AND 13),
  nome text NOT NULL,
  tipo text NOT NULL DEFAULT 'outro',
  url text,
  status text NOT NULL DEFAULT 'a_analisar',
  data_ref date,
  observacoes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Evidências: reaproveita tabela existente, apenas colunas novas (todas opcionais)
ALTER TABLE public.estrategia_evidencias
  ADD COLUMN IF NOT EXISTS etapa smallint CHECK (etapa BETWEEN 1 AND 13),
  ADD COLUMN IF NOT EXISTS fonte_id uuid REFERENCES public.estrategia_fontes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS categoria text,
  ADD COLUMN IF NOT EXISTS origem text,
  ADD COLUMN IF NOT EXISTS data_ref date,
  ADD COLUMN IF NOT EXISTS observacao text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Concorrentes
CREATE TABLE IF NOT EXISTS public.estrategia_concorrentes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL DEFAULT private.current_org_id() REFERENCES public.organizations(id),
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  nome text NOT NULL,
  posicionamento text, oferta text, preco text, comunicacao text, conteudo text,
  provas text, diferenciais text, oportunidades text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Achados: padrões, tensões, problemas, oportunidades, hipóteses, gargalos e decisões
CREATE TABLE IF NOT EXISTS public.estrategia_achados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL DEFAULT private.current_org_id() REFERENCES public.organizations(id),
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  etapa smallint NOT NULL CHECK (etapa BETWEEN 1 AND 13),
  tipo text NOT NULL CHECK (tipo IN ('padrao','tensao','problema','oportunidade','hipotese','gargalo_principal','gargalo_secundario','decisao')),
  titulo text NOT NULL,
  descricao text,
  status text NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto','validado','descartado','aprovado')),
  origem text NOT NULL DEFAULT 'humano' CHECK (origem IN ('humano','ia')),
  deriva_de uuid REFERENCES public.estrategia_achados(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.estrategia_achado_evidencias (
  achado_id uuid NOT NULL REFERENCES public.estrategia_achados(id) ON DELETE CASCADE,
  evidencia_id uuid NOT NULL REFERENCES public.estrategia_evidencias(id) ON DELETE CASCADE,
  org_id uuid NOT NULL DEFAULT private.current_org_id() REFERENCES public.organizations(id),
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (achado_id, evidencia_id)
);

-- Definições estruturadas das etapas 8–11 (um campo por linha)
CREATE TABLE IF NOT EXISTS public.estrategia_definicoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL DEFAULT private.current_org_id() REFERENCES public.organizations(id),
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  etapa smallint NOT NULL CHECK (etapa BETWEEN 1 AND 13),
  campo text NOT NULL,
  valor text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (cliente_id, etapa, campo)
);

-- Sistema editorial: pilar → tema → mensagem → argumento/prova
CREATE TABLE IF NOT EXISTS public.editorial_pilares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL DEFAULT private.current_org_id() REFERENCES public.organizations(id),
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  nome text NOT NULL, descricao text, ordem int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.editorial_temas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL DEFAULT private.current_org_id() REFERENCES public.organizations(id),
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  pilar_id uuid NOT NULL REFERENCES public.editorial_pilares(id) ON DELETE CASCADE,
  nome text NOT NULL, descricao text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.editorial_mensagens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL DEFAULT private.current_org_id() REFERENCES public.organizations(id),
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  tema_id uuid NOT NULL REFERENCES public.editorial_temas(id) ON DELETE CASCADE,
  mensagem text NOT NULL,
  jornada text, objetivo_psicologico text, cta text, formatos text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.editorial_argumentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL DEFAULT private.current_org_id() REFERENCES public.organizations(id),
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  mensagem_id uuid NOT NULL REFERENCES public.editorial_mensagens(id) ON DELETE CASCADE,
  argumento text NOT NULL,
  prova text,
  evidencia_id uuid REFERENCES public.estrategia_evidencias(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

-- Calendário estratégico (itens planejados; Fase 5 transforma em conteúdos)
CREATE TABLE IF NOT EXISTS public.calendario_estrategico_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL DEFAULT private.current_org_id() REFERENCES public.organizations(id),
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  data date NOT NULL,
  titulo text,
  canal text, formato text,
  pilar_id uuid REFERENCES public.editorial_pilares(id) ON DELETE SET NULL,
  tema_id uuid REFERENCES public.editorial_temas(id) ON DELETE SET NULL,
  mensagem_id uuid REFERENCES public.editorial_mensagens(id) ON DELETE SET NULL,
  argumento_id uuid REFERENCES public.editorial_argumentos(id) ON DELETE SET NULL,
  jornada text, objetivo text, cta text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

-- Sugestões de IA (estrutura preparada; nunca misturadas às evidências)
CREATE TABLE IF NOT EXISTS public.estrategia_sugestoes_ia (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL DEFAULT private.current_org_id() REFERENCES public.organizations(id),
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  etapa smallint CHECK (etapa BETWEEN 1 AND 13),
  tipo text NOT NULL,
  conteudo text NOT NULL,
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','aprovada','descartada')),
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['estrategia_etapas','estrategia_fontes','estrategia_concorrentes','estrategia_achados','estrategia_achado_evidencias','estrategia_definicoes','editorial_pilares','editorial_temas','editorial_mensagens','editorial_argumentos','calendario_estrategico_itens','estrategia_sugestoes_ia']
  LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'org_'||t||'_staff', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (private.is_org_member(org_id) AND (public.has_role(auth.uid(),''admin'') OR public.has_role(auth.uid(),''gestor''))) WITH CHECK (private.is_org_member(org_id) AND (public.has_role(auth.uid(),''admin'') OR public.has_role(auth.uid(),''gestor'')))', 'org_'||t||'_staff', t);
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', 'trg_'||t||'_set_org_id', t);
    EXECUTE format('CREATE TRIGGER %I BEFORE INSERT ON public.%I FOR EACH ROW EXECUTE FUNCTION private.set_org_id_from_profile()', 'trg_'||t||'_set_org_id', t);
    IF t <> 'estrategia_achado_evidencias' THEN
      EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', 'trg_'||t||'_updated_at', t);
      EXECUTE format('CREATE TRIGGER %I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()', 'trg_'||t||'_updated_at', t);
    END IF;
  END LOOP;
END $$;

DROP TRIGGER IF EXISTS trg_estrategia_evidencias_updated_at ON public.estrategia_evidencias;
CREATE TRIGGER trg_estrategia_evidencias_updated_at BEFORE UPDATE ON public.estrategia_evidencias FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX IF NOT EXISTS idx_estrategia_etapas_cliente ON public.estrategia_etapas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_estrategia_fontes_cliente ON public.estrategia_fontes(cliente_id, etapa);
CREATE INDEX IF NOT EXISTS idx_estrategia_evidencias_cliente_etapa ON public.estrategia_evidencias(cliente_id, etapa);
CREATE INDEX IF NOT EXISTS idx_estrategia_achados_cliente ON public.estrategia_achados(cliente_id, etapa);
CREATE INDEX IF NOT EXISTS idx_calendario_estrategico_cliente_data ON public.calendario_estrategico_itens(cliente_id, data);