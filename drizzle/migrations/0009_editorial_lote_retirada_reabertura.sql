ALTER TABLE public.conteudo_ideia_versoes ADD COLUMN IF NOT EXISTS retirada_em timestamptz, ADD COLUMN IF NOT EXISTS retirada_por uuid, ADD COLUMN IF NOT EXISTS retirada_acao text, ADD COLUMN IF NOT EXISTS envio_chave uuid;
ALTER TABLE public.conteudo_versoes ADD COLUMN IF NOT EXISTS retirada_em timestamptz, ADD COLUMN IF NOT EXISTS retirada_por uuid, ADD COLUMN IF NOT EXISTS retirada_acao text, ADD COLUMN IF NOT EXISTS titulo text, ADD COLUMN IF NOT EXISTS formato text;
ALTER TABLE public.conteudos ADD COLUMN IF NOT EXISTS ideia_reaberta_em timestamptz;
UPDATE public.conteudo_versoes v SET titulo=c.titulo,formato=c.formato FROM public.conteudos c WHERE c.id=v.conteudo_id AND v.titulo IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS ideia_envio_chave_unique ON public.conteudo_ideia_versoes(conteudo_id,envio_chave) WHERE envio_chave IS NOT NULL;
CREATE OR REPLACE FUNCTION public.enviar_ideia(_conteudo_id uuid) RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE c public.conteudos; n integer;
BEGIN
 IF auth.uid() IS NULL OR public.has_role(auth.uid(),'cliente') THEN RAISE EXCEPTION 'Sem permissão'; END IF;
 SELECT * INTO c FROM public.conteudos WHERE id=_conteudo_id FOR UPDATE;
 IF NOT FOUND OR NOT private.is_org_member(c.org_id) THEN RAISE EXCEPTION 'Sem permissão'; END IF;
 IF c.status_ideia NOT IN ('nao_enviada','alteracao_solicitada') THEN RAISE EXCEPTION 'A ideia já está com a cliente ou aprovada'; END IF;
 IF coalesce(btrim(c.titulo),'')='' AND coalesce(btrim(c.desenvolvimento),'')='' THEN RAISE EXCEPTION 'Preencha a headline ou o desenvolvimento'; END IF;
 PERFORM set_config('irys.approval_action','true',true);
 n:=c.ideia_versao_atual+1;
 INSERT INTO public.conteudo_ideia_versoes(org_id,conteudo_id,cliente_id,numero,titulo,desenvolvimento,formato) VALUES(c.org_id,c.id,c.cliente_id,n,c.titulo,c.desenvolvimento,c.formato);
 UPDATE public.conteudos SET status_ideia='aguardando',ideia_versao_atual=n WHERE id=c.id;
 INSERT INTO public.conteudo_eventos(org_id,conteudo_id,tipo,detalhe) VALUES(c.org_id,c.id,'ideia_enviada','Ideia V'||n);
 RETURN n;
END $$;
CREATE OR REPLACE FUNCTION public.enviar_ideias_lote(_itens jsonb,_chave uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE item jsonb; c public.conteudos; n int; results jsonb:='[]'; cid uuid; expected int; prior int; seen uuid[]:='{}';
BEGIN
 IF auth.uid() IS NULL OR public.has_role(auth.uid(),'cliente') OR _chave IS NULL THEN RAISE EXCEPTION 'Sem permissão'; END IF;
 IF jsonb_typeof(_itens)<>'array' OR jsonb_array_length(_itens) NOT BETWEEN 1 AND 100 THEN RAISE EXCEPTION 'Selecione de 1 a 100 ideias'; END IF;
 FOR item IN SELECT value FROM jsonb_array_elements(_itens) ORDER BY value->>'id' LOOP
  BEGIN
   cid:=(item->>'id')::uuid; expected:=(item->>'versao')::int;
   IF cid=ANY(seen) THEN CONTINUE; END IF;
   seen:=array_append(seen,cid);
   SELECT * INTO c FROM public.conteudos WHERE id=cid FOR UPDATE;
   IF NOT FOUND OR NOT private.is_org_member(c.org_id) THEN RAISE EXCEPTION 'Conteúdo não disponível'; END IF;
   SELECT numero INTO prior FROM public.conteudo_ideia_versoes WHERE conteudo_id=cid AND envio_chave=_chave;
   IF prior IS NOT NULL THEN n:=prior;
   ELSE
    IF expected IS NULL OR expected<>c.ideia_versao_atual THEN RAISE EXCEPTION 'A versão mudou; atualize a seleção'; END IF;
    n:=public.enviar_ideia(cid);
    UPDATE public.conteudo_ideia_versoes SET envio_chave=_chave WHERE conteudo_id=cid AND numero=n;
   END IF;
   results:=results||jsonb_build_array(jsonb_build_object('id',cid,'ok',true,'versao',n));
  EXCEPTION WHEN OTHERS THEN
   results:=results||jsonb_build_array(jsonb_build_object('id',item->>'id','ok',false,'motivo',CASE WHEN SQLSTATE='P0001' THEN SQLERRM ELSE 'Não foi possível enviar este conteúdo' END));
  END;
 END LOOP;
 RETURN results;
END $$;
REVOKE ALL ON FUNCTION public.enviar_ideias_lote(jsonb,uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.enviar_ideias_lote(jsonb,uuid) TO authenticated;
CREATE OR REPLACE FUNCTION public.retirar_aprovacao(_conteudo_id uuid,_etapa text,_reabrir boolean,_versao int) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE c public.conteudos; action text;
BEGIN
 IF auth.uid() IS NULL OR public.has_role(auth.uid(),'cliente') THEN RAISE EXCEPTION 'Sem permissão'; END IF;
 SELECT * INTO c FROM public.conteudos WHERE id=_conteudo_id FOR UPDATE;
 IF NOT FOUND OR NOT private.is_org_member(c.org_id) THEN RAISE EXCEPTION 'Sem permissão'; END IF;
 IF _etapa NOT IN ('ideia','producao') OR _reabrir IS NULL THEN RAISE EXCEPTION 'Ação inválida'; END IF;
 action:=CASE WHEN _reabrir THEN 'reaberta' ELSE 'retirada' END;
 PERFORM set_config('irys.approval_action','true',true);
 IF _etapa='ideia' THEN
  IF _versao IS DISTINCT FROM c.ideia_versao_atual THEN RAISE EXCEPTION 'A versão mudou; atualize o conteúdo'; END IF;
  IF (_reabrir AND c.status_ideia<>'aprovada') OR (NOT _reabrir AND c.status_ideia NOT IN ('aguardando','alteracao_solicitada')) THEN RAISE EXCEPTION 'Esta ideia não permite esta ação'; END IF;
  UPDATE public.conteudo_ideia_versoes SET retirada_em=now(),retirada_por=auth.uid(),retirada_acao=action WHERE conteudo_id=c.id AND numero=c.ideia_versao_atual;
  UPDATE public.conteudos SET status_ideia='nao_enviada',ideia_reaberta_em=CASE WHEN _reabrir THEN now() ELSE ideia_reaberta_em END WHERE id=c.id;
  IF _reabrir AND c.status IN ('com_cliente','alteracao_solicitada') THEN
   UPDATE public.conteudo_versoes SET retirada_em=now(),retirada_por=auth.uid(),retirada_acao='ideia_reaberta' WHERE conteudo_id=c.id AND numero=c.versao_atual;
   UPDATE public.conteudos SET status='revisao_interna' WHERE id=c.id;
   INSERT INTO public.conteudo_eventos(org_id,conteudo_id,tipo,detalhe) VALUES(c.org_id,c.id,'producao_retirada','Produção V'||c.versao_atual||' retirada: aprovação da ideia reaberta');
  END IF;
 ELSE
  IF _versao IS DISTINCT FROM c.versao_atual THEN RAISE EXCEPTION 'A versão mudou; atualize o conteúdo'; END IF;
  IF (_reabrir AND c.status NOT IN ('aprovado','agendado','publicado')) OR (NOT _reabrir AND c.status NOT IN ('com_cliente','alteracao_solicitada')) THEN RAISE EXCEPTION 'Esta produção não permite esta ação'; END IF;
  UPDATE public.conteudo_versoes SET retirada_em=now(),retirada_por=auth.uid(),retirada_acao=action WHERE conteudo_id=c.id AND numero=c.versao_atual;
  UPDATE public.conteudos SET status='revisao_interna' WHERE id=c.id;
 END IF;
 INSERT INTO public.conteudo_eventos(org_id,conteudo_id,tipo,detalhe) VALUES(c.org_id,c.id,_etapa||'_'||action,(CASE WHEN _etapa='ideia' THEN 'Ideia V'||c.ideia_versao_atual ELSE 'Produção V'||c.versao_atual END)||' '||action);
END $$;
REVOKE ALL ON FUNCTION public.retirar_aprovacao(uuid,text,boolean,int) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.retirar_aprovacao(uuid,text,boolean,int) TO authenticated;
CREATE OR REPLACE FUNCTION public.cliente_avaliar_ideia(_versao_id uuid,_decisao text,_comentario text DEFAULT NULL) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v public.conteudo_ideia_versoes; c public.conteudos;
BEGIN
 IF NOT public.has_role(auth.uid(),'cliente') THEN RAISE EXCEPTION 'Apenas clientes podem avaliar'; END IF;
 IF _decisao NOT IN ('aprovada','alteracao_solicitada') THEN RAISE EXCEPTION 'Parâmetros inválidos'; END IF;
 IF _decisao='alteracao_solicitada' AND coalesce(btrim(_comentario),'')='' THEN RAISE EXCEPTION 'Comentário obrigatório ao solicitar alteração'; END IF;
 SELECT * INTO v FROM public.conteudo_ideia_versoes WHERE id=_versao_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'Versão não encontrada'; END IF;
 SELECT * INTO c FROM public.conteudos WHERE id=v.conteudo_id FOR UPDATE;
 SELECT * INTO v FROM public.conteudo_ideia_versoes WHERE id=_versao_id FOR UPDATE;
 IF c.cliente_id IS DISTINCT FROM public.current_cliente_id() THEN RAISE EXCEPTION 'Sem permissão'; END IF;
 IF v.retirada_em IS NOT NULL THEN RAISE EXCEPTION 'Esta versão foi retirada para revisão'; END IF;
 IF v.numero<>c.ideia_versao_atual OR c.status_ideia<>'aguardando' THEN RAISE EXCEPTION 'Esta ideia não está aguardando avaliação'; END IF;
 PERFORM set_config('irys.approval_action','true',true);
 UPDATE public.conteudo_ideia_versoes SET status=_decisao,comentario=nullif(btrim(_comentario),''),avaliada_em=now(),avaliada_por=auth.uid() WHERE id=v.id;
 UPDATE public.conteudos SET status_ideia=_decisao WHERE id=c.id;
 IF coalesce(btrim(_comentario),'')<>'' THEN INSERT INTO public.conteudo_comentarios(org_id,conteudo_id,cliente_id,tipo,alvo,texto) VALUES(c.org_id,c.id,c.cliente_id,'cliente','ideia',btrim(_comentario)); END IF;
 INSERT INTO public.conteudo_eventos(org_id,conteudo_id,tipo,detalhe) VALUES(c.org_id,c.id,'avaliacao_ideia','Ideia V'||v.numero||': '||_decisao);
 RETURN _decisao;
END $$;
CREATE OR REPLACE FUNCTION public.cliente_avaliar_conteudo(_versao_id uuid,_parte text,_decisao text,_comentario text DEFAULT NULL) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v public.conteudo_versoes; c public.conteudos; arte text; leg text; geral text;
BEGIN
 IF NOT public.has_role(auth.uid(),'cliente') THEN RAISE EXCEPTION 'Apenas clientes podem avaliar'; END IF;
 IF _parte NOT IN ('arte','legenda') OR _decisao NOT IN ('aprovado','alteracao_solicitada') THEN RAISE EXCEPTION 'Parâmetros inválidos'; END IF;
 IF _decisao='alteracao_solicitada' AND coalesce(btrim(_comentario),'')='' THEN RAISE EXCEPTION 'Comentário obrigatório ao solicitar alteração'; END IF;
 SELECT * INTO v FROM public.conteudo_versoes WHERE id=_versao_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'Versão não encontrada'; END IF;
 SELECT * INTO c FROM public.conteudos WHERE id=v.conteudo_id FOR UPDATE;
 SELECT * INTO v FROM public.conteudo_versoes WHERE id=_versao_id FOR UPDATE;
 IF c.cliente_id IS DISTINCT FROM public.current_cliente_id() THEN RAISE EXCEPTION 'Sem permissão'; END IF;
 IF v.retirada_em IS NOT NULL THEN RAISE EXCEPTION 'Esta versão foi retirada para revisão'; END IF;
 IF v.numero<>c.versao_atual OR c.status NOT IN ('com_cliente','alteracao_solicitada') THEN RAISE EXCEPTION 'Esta versão não está aguardando avaliação'; END IF;
 arte:=CASE WHEN _parte='arte' THEN _decisao ELSE v.status_arte END;
 leg:=CASE WHEN _parte='legenda' THEN _decisao ELSE v.status_legenda END;
 geral:=CASE WHEN arte='alteracao_solicitada' OR leg='alteracao_solicitada' THEN 'alteracao_solicitada' WHEN arte='aprovado' AND leg='aprovado' THEN 'aprovado' ELSE NULL END;
 UPDATE public.conteudo_versoes SET status_arte=arte,status_legenda=leg,status=CASE geral WHEN 'aprovado' THEN 'aprovada' WHEN 'alteracao_solicitada' THEN 'alteracao_solicitada' ELSE status END,recebida_por=coalesce(recebida_por,auth.uid()),recebida_em=coalesce(recebida_em,now()) WHERE id=v.id;
 UPDATE public.conteudos SET status_arte=arte,status_legenda=leg,status=CASE geral WHEN 'aprovado' THEN 'aprovado' WHEN 'alteracao_solicitada' THEN 'alteracao_solicitada' ELSE status END WHERE id=c.id;
 IF coalesce(btrim(_comentario),'')<>'' THEN INSERT INTO public.conteudo_comentarios(org_id,conteudo_id,cliente_id,versao_id,tipo,alvo,texto) VALUES(c.org_id,c.id,c.cliente_id,v.id,'cliente',_parte,btrim(_comentario)); END IF;
 INSERT INTO public.conteudo_eventos(org_id,conteudo_id,tipo,detalhe) VALUES(c.org_id,c.id,'avaliacao_cliente','V'||v.numero||' · '||_parte||': '||_decisao);
 RETURN coalesce(geral,c.status);
END $$;
CREATE OR REPLACE FUNCTION private.conteudos_workflow() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_sent boolean; v_falta text;
BEGIN
 IF (NEW.status_ideia IS DISTINCT FROM OLD.status_ideia OR NEW.ideia_versao_atual IS DISTINCT FROM OLD.ideia_versao_atual OR NEW.ideia_reaberta_em IS DISTINCT FROM OLD.ideia_reaberta_em) AND current_setting('irys.approval_action',true) IS DISTINCT FROM 'true' THEN RAISE EXCEPTION 'Use as ações de aprovação da ideia'; END IF;
 IF OLD.status IN ('com_cliente','alteracao_solicitada','aprovado','agendado','publicado') AND NEW.status IN ('ideia','planejado','em_producao','revisao_interna') AND current_setting('irys.approval_action',true) IS DISTINCT FROM 'true' THEN RAISE EXCEPTION 'Retire ou reabra a aprovação antes de voltar à edição'; END IF;
 SELECT EXISTS(SELECT 1 FROM public.conteudo_versoes WHERE conteudo_id=NEW.id AND numero=OLD.versao_atual) INTO v_sent;
 IF v_sent AND (NEW.legenda IS DISTINCT FROM OLD.legenda OR NEW.hashtags IS DISTINCT FROM OLD.hashtags) AND NEW.versao_atual=OLD.versao_atual THEN
  NEW.versao_atual:=OLD.versao_atual+1; NEW.status_arte:='pendente'; NEW.status_legenda:='pendente';
  INSERT INTO public.conteudo_eventos(org_id,conteudo_id,tipo,detalhe) VALUES(NEW.org_id,NEW.id,'nova_versao','V'||NEW.versao_atual);
 END IF;
 IF NEW.status IS DISTINCT FROM OLD.status THEN
  IF NEW.status='com_cliente' THEN
   IF NEW.status_ideia<>'aprovada' AND (NEW.ideia_reaberta_em IS NOT NULL OR NOT EXISTS(SELECT 1 FROM public.conteudo_versoes WHERE conteudo_id=NEW.id)) THEN RAISE EXCEPTION 'Aprove a ideia antes de enviar a produção final'; END IF;
   v_falta:=private.producao_faltando(NEW.id,NEW.formato,NEW.legenda);
   IF v_falta IS NOT NULL THEN RAISE EXCEPTION '%',v_falta; END IF;
  END IF;
  INSERT INTO public.conteudo_eventos(org_id,conteudo_id,tipo,de,para) VALUES(NEW.org_id,NEW.id,'status',OLD.status,NEW.status);
  IF NEW.status='com_cliente' THEN
   IF EXISTS(SELECT 1 FROM public.conteudo_versoes WHERE conteudo_id=NEW.id AND numero=NEW.versao_atual) THEN NEW.versao_atual:=NEW.versao_atual+1; END IF;
   INSERT INTO public.conteudo_versoes(org_id,conteudo_id,numero,legenda,hashtags,midias,titulo,formato) SELECT NEW.org_id,NEW.id,NEW.versao_atual,NEW.legenda,NEW.hashtags,coalesce((SELECT jsonb_agg(jsonb_build_object('id',m.id,'bucket',m.bucket,'storage_path',m.storage_path,'tipo',m.tipo,'ordem',m.ordem) ORDER BY m.ordem) FROM public.conteudo_midias m WHERE m.conteudo_id=NEW.id),'[]'::jsonb),NEW.titulo,NEW.formato;
   NEW.enviado_cliente_em:=now(); NEW.status_arte:='pendente'; NEW.status_legenda:='pendente';
  END IF;
  IF NEW.status='publicado' AND NEW.publicado_em IS NULL THEN NEW.publicado_em:=now(); END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE OR REPLACE FUNCTION public.portal_conteudos(_cliente_id uuid) RETURNS TABLE(id uuid,titulo text,desenvolvimento text,canal text,formato text,data_prevista date,pipeline_mes date,ordem double precision,created_at timestamptz,status text,versao_atual int,status_ideia text,ideia_versao_atual int,publicacao_url text,publicado_em timestamptz) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF public.has_role(auth.uid(),'cliente') THEN
  IF _cliente_id IS DISTINCT FROM public.current_cliente_id() THEN RETURN; END IF;
  RETURN QUERY SELECT c.id,coalesce(iv.titulo,pv.titulo,'Conteúdo'),NULL::text,c.canal,coalesce(iv.formato,pv.formato),c.data_prevista,c.pipeline_mes,c.ordem,c.created_at,c.status,c.versao_atual,c.status_ideia,c.ideia_versao_atual,CASE WHEN c.status IN ('agendado','publicado') THEN c.publicacao_url END,CASE WHEN c.status='publicado' THEN c.publicado_em END
  FROM public.conteudos c LEFT JOIN LATERAL(SELECT v.titulo,v.formato FROM public.conteudo_ideia_versoes v WHERE v.conteudo_id=c.id ORDER BY v.numero DESC LIMIT 1)iv ON true LEFT JOIN LATERAL(SELECT v.titulo,v.formato FROM public.conteudo_versoes v WHERE v.conteudo_id=c.id ORDER BY v.numero DESC LIMIT 1)pv ON true
  WHERE c.cliente_id=_cliente_id AND (EXISTS(SELECT 1 FROM public.conteudo_ideia_versoes h WHERE h.conteudo_id=c.id) OR EXISTS(SELECT 1 FROM public.conteudo_versoes h WHERE h.conteudo_id=c.id));
 ELSE
  RETURN QUERY SELECT c.id,c.titulo,c.desenvolvimento,c.canal,c.formato,c.data_prevista,c.pipeline_mes,c.ordem,c.created_at,c.status,c.versao_atual,c.status_ideia,c.ideia_versao_atual,c.publicacao_url,c.publicado_em FROM public.conteudos c WHERE c.cliente_id=_cliente_id AND private.is_org_member(c.org_id);
 END IF;
END $$;
CREATE OR REPLACE FUNCTION private.cliente_tem_conteudo(_conteudo_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT EXISTS(SELECT 1 FROM public.conteudos c WHERE c.id=_conteudo_id AND c.cliente_id=public.current_cliente_id() AND (EXISTS(SELECT 1 FROM public.conteudo_ideia_versoes v WHERE v.conteudo_id=c.id) OR EXISTS(SELECT 1 FROM public.conteudo_versoes v WHERE v.conteudo_id=c.id))) $$;
CREATE POLICY conteudo_eventos_cliente_lifecycle ON public.conteudo_eventos FOR SELECT TO authenticated USING(public.has_role(auth.uid(),'cliente') AND private.cliente_tem_conteudo(conteudo_id) AND tipo IN ('ideia_enviada','avaliacao_ideia','avaliacao_cliente','ideia_retirada','ideia_reaberta','producao_retirada','producao_reaberta'));
CREATE OR REPLACE FUNCTION private.normalizar_formato_publicacao() RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$ BEGIN IF lower(NEW.formato) IN ('vídeo','video') THEN NEW.formato:='Reels'; END IF; RETURN NEW; END $$;
CREATE TRIGGER normalizar_formato_conteudos BEFORE INSERT OR UPDATE OF formato ON public.conteudos FOR EACH ROW EXECUTE FUNCTION private.normalizar_formato_publicacao();
CREATE TRIGGER normalizar_formato_calendario BEFORE INSERT OR UPDATE OF formato ON public.calendario_estrategico_itens FOR EACH ROW EXECUTE FUNCTION private.normalizar_formato_publicacao();
UPDATE public.conteudos SET formato='Reels' WHERE lower(formato) IN ('vídeo','video');
UPDATE public.calendario_estrategico_itens SET formato='Reels' WHERE lower(formato) IN ('vídeo','video');