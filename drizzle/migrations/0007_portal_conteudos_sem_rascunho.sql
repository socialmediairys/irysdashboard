CREATE OR REPLACE FUNCTION private.cliente_tem_conteudo(_conteudo_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.conteudos c WHERE c.id = _conteudo_id AND c.cliente_id = public.current_cliente_id()
    AND (c.status IN ('com_cliente','alteracao_solicitada','aprovado','agendado','publicado') OR c.status_ideia IN ('aguardando','alteracao_solicitada','aprovada')))
$$;
REVOKE ALL ON FUNCTION private.cliente_tem_conteudo(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION private.cliente_tem_conteudo(uuid) TO authenticated;

-- Cliente deixa de ler a tabela de conteúdos (que guarda legenda/desenvolvimento em rascunho).
DROP POLICY IF EXISTS conteudos_cliente_read ON public.conteudos;

DROP POLICY IF EXISTS conteudo_versoes_cliente_read ON public.conteudo_versoes;
CREATE POLICY conteudo_versoes_cliente_read ON public.conteudo_versoes FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'cliente') AND private.cliente_tem_conteudo(conteudo_id));

DROP POLICY IF EXISTS midias_conteudo_cliente_read ON storage.objects;
CREATE POLICY midias_conteudo_cliente_read ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'midias-conteudo' AND public.has_role(auth.uid(),'cliente') AND EXISTS (
    SELECT 1 FROM public.conteudo_versoes v WHERE private.cliente_tem_conteudo(v.conteudo_id)
      AND v.midias @> jsonb_build_array(jsonb_build_object('storage_path', objects.name))));

-- Leitura do Portal: só colunas seguras. Cliente vê apenas os próprios conteúdos enviados; equipe da organização vê a prévia.
CREATE OR REPLACE FUNCTION public.portal_conteudos(_cliente_id uuid)
RETURNS TABLE (id uuid, titulo text, desenvolvimento text, canal text, formato text, data_prevista date, pipeline_mes date,
  ordem double precision, created_at timestamptz, status text, versao_atual integer, status_ideia text, ideia_versao_atual integer,
  publicacao_url text, publicado_em timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE is_cli boolean := public.has_role(auth.uid(),'cliente');
BEGIN
  IF is_cli THEN
    IF _cliente_id IS DISTINCT FROM public.current_cliente_id() THEN RETURN; END IF;
    RETURN QUERY
    SELECT c.id,
      CASE WHEN prod THEN c.titulo ELSE coalesce(iv.titulo, c.titulo) END,
      NULL::text, c.canal,
      CASE WHEN prod THEN c.formato ELSE coalesce(iv.formato, c.formato) END,
      c.data_prevista, c.pipeline_mes, c.ordem, c.created_at,
      CASE WHEN prod THEN c.status ELSE 'planejado' END,
      CASE WHEN prod THEN c.versao_atual ELSE 0 END,
      c.status_ideia, c.ideia_versao_atual,
      CASE WHEN prod THEN c.publicacao_url END, CASE WHEN prod THEN c.publicado_em END
    FROM public.conteudos c
    CROSS JOIN LATERAL (SELECT c.status IN ('com_cliente','alteracao_solicitada','aprovado','agendado','publicado') AS prod) p
    LEFT JOIN public.conteudo_ideia_versoes iv ON iv.conteudo_id = c.id AND iv.numero = c.ideia_versao_atual
    WHERE c.cliente_id = _cliente_id AND (p.prod OR c.status_ideia IN ('aguardando','alteracao_solicitada','aprovada'));
  ELSE
    RETURN QUERY
    SELECT c.id, c.titulo, c.desenvolvimento, c.canal, c.formato, c.data_prevista, c.pipeline_mes, c.ordem, c.created_at,
      c.status, c.versao_atual, c.status_ideia, c.ideia_versao_atual, c.publicacao_url, c.publicado_em
    FROM public.conteudos c WHERE c.cliente_id = _cliente_id AND private.is_org_member(c.org_id);
  END IF;
END $$;
REVOKE ALL ON FUNCTION public.portal_conteudos(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.portal_conteudos(uuid) TO authenticated;