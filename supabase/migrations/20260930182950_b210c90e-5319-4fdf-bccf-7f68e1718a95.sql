ALTER TABLE public.estrategia_concorrentes ADD COLUMN IF NOT EXISTS publico text, ADD COLUMN IF NOT EXISTS cta text;

CREATE TABLE public.ai_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL DEFAULT private.current_org_id(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  cliente_id uuid,
  modulo text NOT NULL,
  acao text NOT NULL,
  modelo text NOT NULL,
  input_tokens integer,
  output_tokens integer,
  sucesso boolean NOT NULL,
  erro text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.ai_usage_logs TO authenticated;
GRANT ALL ON public.ai_usage_logs TO service_role;
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY ai_usage_logs_insert ON public.ai_usage_logs FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND private.is_org_member(org_id) AND (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'gestor')));
CREATE POLICY ai_usage_logs_select ON public.ai_usage_logs FOR SELECT TO authenticated
  USING (private.is_org_member(org_id) AND has_role(auth.uid(),'admin'));
CREATE INDEX ai_usage_logs_org_idx ON public.ai_usage_logs(org_id, created_at DESC);