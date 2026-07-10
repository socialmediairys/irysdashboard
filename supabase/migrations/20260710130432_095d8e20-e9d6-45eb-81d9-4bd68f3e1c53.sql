DROP POLICY IF EXISTS "Fases públicas" ON public.fases;
DROP POLICY IF EXISTS "Tópicos públicos" ON public.topicos_fase;

CREATE POLICY "Fases visíveis para autenticados" ON public.fases
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Tópicos visíveis para autenticados" ON public.topicos_fase
  FOR SELECT TO authenticated USING (true);

REVOKE SELECT ON public.fases FROM anon;
REVOKE SELECT ON public.topicos_fase FROM anon;