
-- 1. Slug único no cliente para o link personalizado do portal
ALTER TABLE public.clientes ADD COLUMN IF NOT EXISTS slug text;
UPDATE public.clientes SET slug = substr(encode(gen_random_bytes(6),'hex'),1,12) WHERE slug IS NULL;
ALTER TABLE public.clientes ALTER COLUMN slug SET NOT NULL;
ALTER TABLE public.clientes ALTER COLUMN slug SET DEFAULT substr(encode(gen_random_bytes(6),'hex'),1,12);
CREATE UNIQUE INDEX IF NOT EXISTS clientes_slug_unique ON public.clientes(slug);

-- 2. Fases (fixas)
CREATE TABLE IF NOT EXISTS public.fases (
  id smallint PRIMARY KEY,
  nome text NOT NULL,
  descricao text
);
GRANT SELECT ON public.fases TO anon, authenticated;
GRANT ALL ON public.fases TO service_role;
ALTER TABLE public.fases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Fases públicas" ON public.fases;
CREATE POLICY "Fases públicas" ON public.fases FOR SELECT TO anon, authenticated USING (true);

INSERT INTO public.fases (id, nome, descricao) VALUES
(1, 'Onboarding & Alinhamento Base', 'Assinatura do contrato, liberação de acessos no cofre e alinhamento inicial.'),
(2, 'Diagnóstico de Perfil & Análise de Concorrentes', 'Investigação profunda do seu mercado, auditoria de Instagram e mapeamento.'),
(3, 'Universo Visual & Identidade Verbal', 'Definição da estética da sua marca pessoal (cores, tipografias, fotos premium) e tom de voz.'),
(4, 'Estratégia de Conteúdo & Funil de Vendas', 'Criação do primeiro cronograma oficial estruturado para gerar desejo.'),
(5, 'Produção, Gravações & Aprovação', 'Envio de roteiros rápidos, edição impecável e validação final.'),
(6, 'Análise de Métricas & Próximo Ciclo', 'Reunião mensal de fechamento. Análise do crescimento e desenho do próximo mês.')
ON CONFLICT (id) DO UPDATE SET nome = EXCLUDED.nome, descricao = EXCLUDED.descricao;

-- 3. Tópicos por fase
CREATE TABLE IF NOT EXISTS public.topicos_fase (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fase_id smallint NOT NULL REFERENCES public.fases(id) ON DELETE CASCADE,
  nome text NOT NULL,
  ordem int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE (fase_id, nome)
);
GRANT SELECT ON public.topicos_fase TO anon, authenticated;
GRANT ALL ON public.topicos_fase TO service_role;
ALTER TABLE public.topicos_fase ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Tópicos públicos" ON public.topicos_fase;
CREATE POLICY "Tópicos públicos" ON public.topicos_fase FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Admin gerencia tópicos" ON public.topicos_fase;
CREATE POLICY "Admin gerencia tópicos" ON public.topicos_fase FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

INSERT INTO public.topicos_fase (fase_id, nome, ordem) VALUES
(1,'Contrato',0),(1,'Cofre',1),(1,'Briefing',2),(1,'Onboarding',3),
(2,'Diagnóstico de Perfil',0),(2,'Análise de Concorrentes',1),
(3,'Estética',0),(3,'Tom de Voz',1),(3,'Drive',2),
(4,'Cronograma 1',0),(4,'Funil de Vendas',1),
(5,'Roteiros',0),(5,'Edição',1),(5,'Vídeos',2),
(6,'Reunião 1',0),(6,'Apresentação',1)
ON CONFLICT (fase_id, nome) DO NOTHING;

-- 4. Conteúdos por cliente
CREATE TABLE IF NOT EXISTS public.conteudos_cliente (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  topico_id uuid NOT NULL REFERENCES public.topicos_fase(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('video','audio','documento')),
  titulo text,
  url text,
  storage_path text,
  storage_bucket text,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS conteudos_cliente_cliente_topico_idx ON public.conteudos_cliente(cliente_id, topico_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conteudos_cliente TO authenticated;
GRANT ALL ON public.conteudos_cliente TO service_role;
ALTER TABLE public.conteudos_cliente ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admin gerencia conteúdos" ON public.conteudos_cliente;
CREATE POLICY "Admin gerencia conteúdos" ON public.conteudos_cliente FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "Cliente vê próprios conteúdos" ON public.conteudos_cliente;
CREATE POLICY "Cliente vê próprios conteúdos" ON public.conteudos_cliente FOR SELECT TO authenticated
  USING (cliente_id = current_cliente_id());
