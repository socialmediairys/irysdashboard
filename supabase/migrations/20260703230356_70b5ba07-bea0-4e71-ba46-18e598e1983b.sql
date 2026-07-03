
-- LEADS (pipeline)
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  valor NUMERIC(10,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'frio', -- frio, quente, negociando, proposta, ganho, perdido
  origem TEXT,
  potencial TEXT, -- Baixo, Médio, Alto, Altíssimo
  observacoes TEXT,
  responsavel_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT ALL ON public.leads TO service_role;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin/gestor gerencia leads" ON public.leads FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gestor'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gestor'));
CREATE TRIGGER trg_leads_updated BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ENTRADAS FINANCEIRAS
CREATE TABLE public.entradas_financeiras (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  descricao TEXT NOT NULL,
  categoria TEXT,
  valor NUMERIC(10,2) NOT NULL,
  data_ref DATE NOT NULL DEFAULT CURRENT_DATE,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  status_pagamento TEXT NOT NULL DEFAULT 'pago', -- pago, pendente, atrasado
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.entradas_financeiras TO authenticated;
GRANT ALL ON public.entradas_financeiras TO service_role;
ALTER TABLE public.entradas_financeiras ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin/financeiro gerencia entradas" ON public.entradas_financeiras FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'financeiro'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'financeiro'));
CREATE TRIGGER trg_entradas_updated BEFORE UPDATE ON public.entradas_financeiras FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- SAIDAS FINANCEIRAS
CREATE TABLE public.saidas_financeiras (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  descricao TEXT NOT NULL,
  categoria TEXT,
  valor NUMERIC(10,2) NOT NULL,
  data_ref DATE NOT NULL DEFAULT CURRENT_DATE,
  recorrente BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saidas_financeiras TO authenticated;
GRANT ALL ON public.saidas_financeiras TO service_role;
ALTER TABLE public.saidas_financeiras ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin/financeiro gerencia saidas" ON public.saidas_financeiras FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'financeiro'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'financeiro'));
CREATE TRIGGER trg_saidas_updated BEFORE UPDATE ON public.saidas_financeiras FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- AGENDA ITENS
CREATE TABLE public.agenda_itens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  descricao TEXT,
  data_hora TIMESTAMPTZ NOT NULL,
  duracao_min INT DEFAULT 60,
  prioridade TEXT DEFAULT 'normal', -- normal, alta, urgente
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  responsavel_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  concluido BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agenda_itens TO authenticated;
GRANT ALL ON public.agenda_itens TO service_role;
ALTER TABLE public.agenda_itens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Equipe gerencia agenda" ON public.agenda_itens FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gestor')
    OR public.has_role(auth.uid(),'social') OR public.has_role(auth.uid(),'editor')
    OR responsavel_id = auth.uid()
  )
  WITH CHECK (
    public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gestor')
    OR public.has_role(auth.uid(),'social') OR public.has_role(auth.uid(),'editor')
    OR responsavel_id = auth.uid()
  );
CREATE TRIGGER trg_agenda_updated BEFORE UPDATE ON public.agenda_itens FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
