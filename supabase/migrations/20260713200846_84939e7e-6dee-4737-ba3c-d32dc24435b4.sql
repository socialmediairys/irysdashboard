
-- Contas fixas (recurring templates)
CREATE TABLE public.contas_fixas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  descricao text NOT NULL,
  valor numeric(14,2) NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('receita','despesa')),
  categoria text,
  cliente_id uuid REFERENCES public.clientes(id) ON DELETE SET NULL,
  frequencia text NOT NULL DEFAULT 'mensal' CHECK (frequencia IN ('mensal')),
  dia_vencimento integer NOT NULL CHECK (dia_vencimento BETWEEN 1 AND 31),
  data_inicio date NOT NULL,
  data_fim date,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.contas_fixas TO authenticated;
GRANT ALL ON public.contas_fixas TO service_role;

ALTER TABLE public.contas_fixas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/financeiro gerencia contas_fixas"
  ON public.contas_fixas FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'financeiro'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'financeiro'::app_role));

CREATE TRIGGER trg_contas_fixas_updated_at
  BEFORE UPDATE ON public.contas_fixas
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Link generated occurrences back to the template
ALTER TABLE public.entradas_financeiras
  ADD COLUMN IF NOT EXISTS conta_fixa_id uuid REFERENCES public.contas_fixas(id) ON DELETE SET NULL;

ALTER TABLE public.saidas_financeiras
  ADD COLUMN IF NOT EXISTS conta_fixa_id uuid REFERENCES public.contas_fixas(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_entradas_conta_fixa ON public.entradas_financeiras(conta_fixa_id);
CREATE INDEX IF NOT EXISTS idx_saidas_conta_fixa ON public.saidas_financeiras(conta_fixa_id);
