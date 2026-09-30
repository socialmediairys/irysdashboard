-- Minimal, privacy-conscious usage telemetry for the Strategy Copilot.
CREATE TABLE IF NOT EXISTS public.estrategia_ai_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL DEFAULT private.current_org_id() REFERENCES public.organizations(id),
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  acao text NOT NULL,
  modelo text,
  tokens_entrada integer,
  tokens_saida integer,
  sucesso boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.estrategia_ai_logs ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT ON public.estrategia_ai_logs TO authenticated;
GRANT ALL ON public.estrategia_ai_logs TO service_role;
DROP POLICY IF EXISTS estrategia_ai_logs_staff ON public.estrategia_ai_logs;
CREATE POLICY estrategia_ai_logs_staff ON public.estrategia_ai_logs FOR ALL TO authenticated
USING (private.is_org_member(org_id) AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gestor')))
WITH CHECK (private.is_org_member(org_id) AND user_id = auth.uid() AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gestor')));
DROP TRIGGER IF EXISTS trg_estrategia_ai_logs_set_org_id ON public.estrategia_ai_logs;
CREATE TRIGGER trg_estrategia_ai_logs_set_org_id BEFORE INSERT ON public.estrategia_ai_logs FOR EACH ROW EXECUTE FUNCTION private.set_org_id_from_profile();
CREATE INDEX IF NOT EXISTS idx_estrategia_ai_logs_org_created ON public.estrategia_ai_logs(org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_estrategia_ai_logs_cliente_created ON public.estrategia_ai_logs(cliente_id, created_at DESC);
