CREATE TYPE public.pipeline_etapa AS ENUM ('estrategia','linha_editorial','design','copy','metricas');
CREATE TYPE public.pipeline_status_valor AS ENUM ('nao_iniciado','em_andamento','concluido','travado');

CREATE TABLE public.pipeline_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  mes date NOT NULL,
  etapa public.pipeline_etapa NOT NULL,
  status public.pipeline_status_valor NOT NULL DEFAULT 'nao_iniciado',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (cliente_id, mes, etapa)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.pipeline_status TO authenticated;
GRANT ALL ON public.pipeline_status TO service_role;

ALTER TABLE public.pipeline_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY org_pipeline_status_staff ON public.pipeline_status FOR ALL TO authenticated
  USING (private.is_org_member(org_id) AND NOT has_role(auth.uid(), 'cliente'::app_role))
  WITH CHECK (private.is_org_member(org_id) AND NOT has_role(auth.uid(), 'cliente'::app_role));

CREATE POLICY org_pipeline_status_cliente_read ON public.pipeline_status FOR SELECT TO authenticated
  USING (org_id = private.current_org_id() AND cliente_id = public.current_cliente_id());

CREATE TRIGGER set_pipeline_status_updated_at BEFORE UPDATE ON public.pipeline_status
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX pipeline_status_org_mes_idx ON public.pipeline_status (org_id, mes);