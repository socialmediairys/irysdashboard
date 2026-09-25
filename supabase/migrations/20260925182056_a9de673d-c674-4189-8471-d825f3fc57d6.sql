ALTER TABLE public.tarefas ADD COLUMN IF NOT EXISTS conteudo_id uuid REFERENCES public.conteudos(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS tarefas_conteudo_idx ON public.tarefas(conteudo_id);

-- Leitura do cliente: somente próprios conteúdos já enviados
CREATE POLICY conteudos_cliente_read ON public.conteudos FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'cliente') AND cliente_id = public.current_cliente_id()
         AND status IN ('com_cliente','alteracao_solicitada','aprovado','agendado','publicado'));
CREATE POLICY conteudo_versoes_cliente_read ON public.conteudo_versoes FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'cliente') AND EXISTS (
    SELECT 1 FROM public.conteudos c WHERE c.id = conteudo_versoes.conteudo_id AND c.cliente_id = public.current_cliente_id()));
GRANT SELECT ON public.conteudo_versoes TO authenticated;

-- Mídias no armazenamento: cliente lê só arquivos referenciados por versões enviadas dos próprios conteúdos
CREATE POLICY midias_conteudo_cliente_read ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'midias-conteudo' AND public.has_role(auth.uid(),'cliente') AND EXISTS (
    SELECT 1 FROM public.conteudo_versoes v JOIN public.conteudos c ON c.id = v.conteudo_id
    WHERE c.cliente_id = public.current_cliente_id()
      AND v.midias @> jsonb_build_array(jsonb_build_object('storage_path', storage.objects.name))));

-- Ao gerar nova versão enviada, Arte/Legenda voltam a pendente
CREATE OR REPLACE FUNCTION private.conteudos_workflow()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_sent boolean;
BEGIN
  SELECT EXISTS (SELECT 1 FROM public.conteudo_versoes WHERE conteudo_id = NEW.id AND numero = OLD.versao_atual) INTO v_sent;
  IF v_sent AND (NEW.legenda IS DISTINCT FROM OLD.legenda OR NEW.hashtags IS DISTINCT FROM OLD.hashtags) AND NEW.versao_atual = OLD.versao_atual THEN
    NEW.versao_atual := OLD.versao_atual + 1;
    NEW.status_arte := 'pendente'; NEW.status_legenda := 'pendente';
    INSERT INTO public.conteudo_eventos(org_id, conteudo_id, tipo, detalhe) VALUES (NEW.org_id, NEW.id, 'nova_versao', 'V' || NEW.versao_atual);
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.conteudo_eventos(org_id, conteudo_id, tipo, de, para) VALUES (NEW.org_id, NEW.id, 'status', OLD.status, NEW.status);
    IF NEW.status = 'com_cliente' THEN
      IF EXISTS (SELECT 1 FROM public.conteudo_versoes WHERE conteudo_id = NEW.id AND numero = NEW.versao_atual) THEN
        NEW.versao_atual := NEW.versao_atual + 1;
      END IF;
      INSERT INTO public.conteudo_versoes(org_id, conteudo_id, numero, legenda, hashtags, midias)
      SELECT NEW.org_id, NEW.id, NEW.versao_atual, NEW.legenda, NEW.hashtags,
        COALESCE((SELECT jsonb_agg(jsonb_build_object('id', m.id, 'bucket', m.bucket, 'storage_path', m.storage_path, 'tipo', m.tipo, 'ordem', m.ordem) ORDER BY m.ordem) FROM public.conteudo_midias m WHERE m.conteudo_id = NEW.id), '[]'::jsonb);
      NEW.enviado_cliente_em := now();
      NEW.status_arte := 'pendente'; NEW.status_legenda := 'pendente';
    END IF;
    IF NEW.status = 'publicado' AND NEW.publicado_em IS NULL THEN NEW.publicado_em := now(); END IF;
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION private.conteudos_workflow() FROM PUBLIC, anon, authenticated;

-- Avaliação do cliente (única forma de o cliente alterar dados de conteúdo)
CREATE OR REPLACE FUNCTION public.cliente_avaliar_conteudo(_versao_id uuid, _parte text, _decisao text, _comentario text DEFAULT NULL)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v public.conteudo_versoes; c public.conteudos; arte text; leg text; geral text;
BEGIN
  IF NOT public.has_role(auth.uid(),'cliente') THEN RAISE EXCEPTION 'Apenas clientes podem avaliar'; END IF;
  IF _parte NOT IN ('arte','legenda') OR _decisao NOT IN ('aprovado','alteracao_solicitada') THEN RAISE EXCEPTION 'Parâmetros inválidos'; END IF;
  IF _decisao = 'alteracao_solicitada' AND coalesce(btrim(_comentario),'') = '' THEN RAISE EXCEPTION 'Comentário obrigatório ao solicitar alteração'; END IF;
  SELECT * INTO v FROM public.conteudo_versoes WHERE id = _versao_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Versão não encontrada'; END IF;
  SELECT * INTO c FROM public.conteudos WHERE id = v.conteudo_id FOR UPDATE;
  IF c.cliente_id IS DISTINCT FROM public.current_cliente_id() THEN RAISE EXCEPTION 'Sem permissão'; END IF;
  IF v.numero <> c.versao_atual OR c.status NOT IN ('com_cliente','alteracao_solicitada') THEN RAISE EXCEPTION 'Esta versão não está aguardando avaliação'; END IF;

  arte := CASE WHEN _parte = 'arte' THEN _decisao ELSE v.status_arte END;
  leg  := CASE WHEN _parte = 'legenda' THEN _decisao ELSE v.status_legenda END;
  geral := CASE WHEN arte = 'alteracao_solicitada' OR leg = 'alteracao_solicitada' THEN 'alteracao_solicitada'
                WHEN arte = 'aprovado' AND leg = 'aprovado' THEN 'aprovado' ELSE NULL END;

  UPDATE public.conteudo_versoes SET status_arte = arte, status_legenda = leg,
    status = CASE geral WHEN 'aprovado' THEN 'aprovada' WHEN 'alteracao_solicitada' THEN 'alteracao_solicitada' ELSE status END,
    recebida_por = coalesce(recebida_por, auth.uid()), recebida_em = coalesce(recebida_em, now())
  WHERE id = v.id;
  UPDATE public.conteudos SET status_arte = arte, status_legenda = leg,
    status = CASE geral WHEN 'aprovado' THEN 'aprovado' WHEN 'alteracao_solicitada' THEN 'alteracao_solicitada' ELSE status END
  WHERE id = c.id;
  IF coalesce(btrim(_comentario),'') <> '' THEN
    INSERT INTO public.conteudo_comentarios(org_id, conteudo_id, cliente_id, versao_id, tipo, alvo, texto)
    VALUES (c.org_id, c.id, c.cliente_id, v.id, 'cliente', _parte, btrim(_comentario));
  END IF;
  INSERT INTO public.conteudo_eventos(org_id, conteudo_id, tipo, detalhe)
  VALUES (c.org_id, c.id, 'avaliacao_cliente', 'V' || v.numero || ' · ' || _parte || ': ' || _decisao);
  RETURN coalesce(geral, c.status);
END $$;
REVOKE ALL ON FUNCTION public.cliente_avaliar_conteudo(uuid, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cliente_avaliar_conteudo(uuid, text, text, text) TO authenticated;