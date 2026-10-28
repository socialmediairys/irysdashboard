CREATE OR REPLACE FUNCTION private.can_read_portal_catalog()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role <> 'cliente')
      OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND cliente_id IS NOT NULL)
$$;
GRANT EXECUTE ON FUNCTION private.can_read_portal_catalog() TO authenticated;

DROP POLICY IF EXISTS "Fases visíveis para autenticados" ON public.fases;
CREATE POLICY "Fases visíveis para equipe e clientes" ON public.fases FOR SELECT TO authenticated USING (private.can_read_portal_catalog());
DROP POLICY IF EXISTS "Tópicos visíveis para autenticados" ON public.topicos_fase;
CREATE POLICY "Tópicos visíveis para equipe e clientes" ON public.topicos_fase FOR SELECT TO authenticated USING (private.can_read_portal_catalog());
DROP POLICY IF EXISTS "Authenticated can read global content" ON public.conteudos_globais;
CREATE POLICY "Equipe e clientes leem conteúdo global" ON public.conteudos_globais FOR SELECT TO authenticated USING (private.can_read_portal_catalog());