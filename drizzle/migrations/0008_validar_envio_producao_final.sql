CREATE OR REPLACE FUNCTION private.producao_faltando(_conteudo_id uuid, _formato text, _legenda text)
RETURNS text LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE f text := lower(coalesce(_formato, '')); n_img int; n_vid int;
BEGIN
  SELECT count(*) FILTER (WHERE m.tipo = 'imagem'), count(*) FILTER (WHERE m.tipo = 'video')
    INTO n_img, n_vid
  FROM public.conteudo_midias m
  WHERE m.conteudo_id = _conteudo_id
    AND EXISTS (SELECT 1 FROM storage.objects o WHERE o.bucket_id = m.bucket AND o.name = m.storage_path);
  IF f IN ('post', 'carrossel') AND n_img = 0 THEN RETURN 'Adicione a arte antes de enviar a produção final.'; END IF;
  IF f IN ('reels', 'vídeo', 'video') AND n_vid = 0 THEN RETURN 'Adicione o vídeo antes de enviar a produção final.'; END IF;
  IF f NOT IN ('post', 'carrossel', 'reels', 'vídeo', 'video', 'live') AND n_img + n_vid = 0 THEN RETURN 'Adicione a arte antes de enviar a produção final.'; END IF;
  IF f <> 'live' AND coalesce(btrim(_legenda), '') = '' THEN RETURN 'Preencha a legenda da publicação antes de enviar.'; END IF;
  RETURN NULL;
END $$;
REVOKE ALL ON FUNCTION private.producao_faltando(uuid, text, text) FROM PUBLIC;

CREATE OR REPLACE FUNCTION private.conteudos_workflow()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE v_sent boolean; v_falta text;
BEGIN
  SELECT EXISTS (SELECT 1 FROM public.conteudo_versoes WHERE conteudo_id = NEW.id AND numero = OLD.versao_atual) INTO v_sent;
  IF v_sent AND (NEW.legenda IS DISTINCT FROM OLD.legenda OR NEW.hashtags IS DISTINCT FROM OLD.hashtags) AND NEW.versao_atual = OLD.versao_atual THEN
    NEW.versao_atual := OLD.versao_atual + 1;
    NEW.status_arte := 'pendente'; NEW.status_legenda := 'pendente';
    INSERT INTO public.conteudo_eventos(org_id, conteudo_id, tipo, detalhe) VALUES (NEW.org_id, NEW.id, 'nova_versao', 'V' || NEW.versao_atual);
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'com_cliente' THEN
      v_falta := private.producao_faltando(NEW.id, NEW.formato, NEW.legenda);
      IF v_falta IS NOT NULL THEN RAISE EXCEPTION '%', v_falta USING ERRCODE = 'P0001'; END IF;
    END IF;
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
END $function$;