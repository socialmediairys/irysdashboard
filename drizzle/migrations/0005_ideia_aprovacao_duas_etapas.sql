ALTER TABLE public.conteudos
  ADD COLUMN IF NOT EXISTS desenvolvimento text,
  ADD COLUMN IF NOT EXISTS status_ideia text NOT NULL DEFAULT 'nao_enviada',
  ADD COLUMN IF NOT EXISTS ideia_versao_atual integer NOT NULL DEFAULT 0;

-- Backfill seguro e repetível: só conteúdos que nunca tiveram versão enviada.
UPDATE public.conteudos c SET desenvolvimento = c.legenda
 WHERE c.desenvolvimento IS NULL AND coalesce(btrim(c.legenda),'') <> ''
   AND c.status IN ('ideia','planejado','em_producao','revisao_interna')
   AND NOT EXISTS (SELECT 1 FROM public.conteudo_versoes v WHERE v.conteudo_id = c.id);
UPDATE public.conteudos c SET legenda = NULL
 WHERE c.legenda IS NOT NULL AND c.desenvolvimento = c.legenda
   AND c.status IN ('ideia','planejado','em_producao','revisao_interna')
   AND NOT EXISTS (SELECT 1 FROM public.conteudo_versoes v WHERE v.conteudo_id = c.id);

ALTER TABLE public.conteudos DROP CONSTRAINT IF EXISTS conteudos_status_ideia_chk;
ALTER TABLE public.conteudos ADD CONSTRAINT conteudos_status_ideia_chk CHECK (status_ideia IN ('nao_enviada','aguardando','alteracao_solicitada','aprovada'));

CREATE TABLE IF NOT EXISTS public.conteudo_ideia_versoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid,
  conteudo_id uuid NOT NULL REFERENCES public.conteudos(id) ON DELETE CASCADE,
  cliente_id uuid NOT NULL,
  numero integer NOT NULL,
  titulo text NOT NULL DEFAULT '',
  desenvolvimento text,
  formato text,
  status text NOT NULL DEFAULT 'aguardando' CHECK (status IN ('aguardando','alteracao_solicitada','aprovada')),
  comentario text,
  enviada_em timestamptz NOT NULL DEFAULT now(),
  enviada_por uuid DEFAULT auth.uid(),
  avaliada_em timestamptz,
  avaliada_por uuid,
  UNIQUE (conteudo_id, numero)
);
GRANT SELECT ON public.conteudo_ideia_versoes TO authenticated;
GRANT ALL ON public.conteudo_ideia_versoes TO service_role;
ALTER TABLE public.conteudo_ideia_versoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY ideia_versoes_team_select ON public.conteudo_ideia_versoes FOR SELECT TO authenticated
  USING (private.is_org_member(org_id) AND NOT public.has_role(auth.uid(),'cliente'));
CREATE POLICY ideia_versoes_cliente_select ON public.conteudo_ideia_versoes FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'cliente') AND cliente_id = public.current_cliente_id());

DROP POLICY IF EXISTS conteudos_cliente_read ON public.conteudos;
CREATE POLICY conteudos_cliente_read ON public.conteudos FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'cliente') AND cliente_id = public.current_cliente_id()
    AND (status IN ('com_cliente','alteracao_solicitada','aprovado','agendado','publicado')
         OR status_ideia IN ('aguardando','alteracao_solicitada','aprovada')));

CREATE OR REPLACE FUNCTION public.enviar_ideia(_conteudo_id uuid)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c public.conteudos; n integer;
BEGIN
  IF public.has_role(auth.uid(),'cliente') THEN RAISE EXCEPTION 'Sem permissão'; END IF;
  SELECT * INTO c FROM public.conteudos WHERE id = _conteudo_id FOR UPDATE;
  IF NOT FOUND OR NOT private.is_org_member(c.org_id) THEN RAISE EXCEPTION 'Sem permissão'; END IF;
  IF c.status_ideia NOT IN ('nao_enviada','alteracao_solicitada') THEN RAISE EXCEPTION 'A ideia já está com a cliente ou aprovada'; END IF;
  IF coalesce(btrim(c.titulo),'') = '' AND coalesce(btrim(c.desenvolvimento),'') = '' THEN RAISE EXCEPTION 'Preencha a headline ou o desenvolvimento'; END IF;
  n := c.ideia_versao_atual + 1;
  INSERT INTO public.conteudo_ideia_versoes(org_id, conteudo_id, cliente_id, numero, titulo, desenvolvimento, formato)
  VALUES (c.org_id, c.id, c.cliente_id, n, c.titulo, c.desenvolvimento, c.formato);
  UPDATE public.conteudos SET status_ideia = 'aguardando', ideia_versao_atual = n WHERE id = c.id;
  INSERT INTO public.conteudo_eventos(org_id, conteudo_id, tipo, detalhe) VALUES (c.org_id, c.id, 'ideia_enviada', 'Ideia V' || n);
  RETURN n;
END $$;
REVOKE ALL ON FUNCTION public.enviar_ideia(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.enviar_ideia(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.cliente_avaliar_ideia(_versao_id uuid, _decisao text, _comentario text DEFAULT NULL)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v public.conteudo_ideia_versoes; c public.conteudos;
BEGIN
  IF NOT public.has_role(auth.uid(),'cliente') THEN RAISE EXCEPTION 'Apenas clientes podem avaliar'; END IF;
  IF _decisao NOT IN ('aprovada','alteracao_solicitada') THEN RAISE EXCEPTION 'Parâmetros inválidos'; END IF;
  IF _decisao = 'alteracao_solicitada' AND coalesce(btrim(_comentario),'') = '' THEN RAISE EXCEPTION 'Comentário obrigatório ao solicitar alteração'; END IF;
  SELECT * INTO v FROM public.conteudo_ideia_versoes WHERE id = _versao_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Versão não encontrada'; END IF;
  SELECT * INTO c FROM public.conteudos WHERE id = v.conteudo_id FOR UPDATE;
  IF c.cliente_id IS DISTINCT FROM public.current_cliente_id() THEN RAISE EXCEPTION 'Sem permissão'; END IF;
  IF v.numero <> c.ideia_versao_atual OR c.status_ideia <> 'aguardando' THEN RAISE EXCEPTION 'Esta ideia não está aguardando avaliação'; END IF;
  UPDATE public.conteudo_ideia_versoes SET status = _decisao, comentario = nullif(btrim(_comentario),''), avaliada_em = now(), avaliada_por = auth.uid() WHERE id = v.id;
  UPDATE public.conteudos SET status_ideia = _decisao WHERE id = c.id;
  IF coalesce(btrim(_comentario),'') <> '' THEN
    INSERT INTO public.conteudo_comentarios(org_id, conteudo_id, cliente_id, tipo, alvo, texto)
    VALUES (c.org_id, c.id, c.cliente_id, 'cliente', 'ideia', btrim(_comentario));
  END IF;
  INSERT INTO public.conteudo_eventos(org_id, conteudo_id, tipo, detalhe) VALUES (c.org_id, c.id, 'avaliacao_ideia', 'Ideia V' || v.numero || ': ' || _decisao);
  RETURN _decisao;
END $$;
REVOKE ALL ON FUNCTION public.cliente_avaliar_ideia(uuid, text, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.cliente_avaliar_ideia(uuid, text, text) TO authenticated;