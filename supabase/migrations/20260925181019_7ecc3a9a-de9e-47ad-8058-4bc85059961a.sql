CREATE TABLE public.conteudos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id),
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  titulo text NOT NULL DEFAULT '',
  data_prevista date,
  horario time,
  canal text,
  formato text,
  status text NOT NULL DEFAULT 'planejado' CHECK (status IN ('ideia','planejado','em_producao','revisao_interna','com_cliente','alteracao_solicitada','aprovado','agendado','publicado')),
  origem text NOT NULL DEFAULT 'avulso' CHECK (origem IN ('avulso','ideia','calendario_estrategico','planejamento')),
  calendario_item_id uuid REFERENCES public.calendario_estrategico_itens(id) ON DELETE SET NULL,
  pipeline_mes date,
  pilar_id uuid REFERENCES public.editorial_pilares(id) ON DELETE SET NULL,
  tema_id uuid REFERENCES public.editorial_temas(id) ON DELETE SET NULL,
  mensagem_id uuid REFERENCES public.editorial_mensagens(id) ON DELETE SET NULL,
  argumento_id uuid REFERENCES public.editorial_argumentos(id) ON DELETE SET NULL,
  evidencia_id uuid REFERENCES public.estrategia_evidencias(id) ON DELETE SET NULL,
  jornada text,
  objetivo text,
  cta text,
  legenda text,
  hashtags text,
  versao_atual integer NOT NULL DEFAULT 1,
  status_arte text NOT NULL DEFAULT 'pendente' CHECK (status_arte IN ('pendente','aprovado','alteracao_solicitada')),
  status_legenda text NOT NULL DEFAULT 'pendente' CHECK (status_legenda IN ('pendente','aprovado','alteracao_solicitada')),
  enviado_cliente_em timestamptz,
  publicado_em timestamptz,
  publicacao_url text,
  plataforma text,
  plataforma_post_id text,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX conteudos_cliente_idx ON public.conteudos(cliente_id, data_prevista);
CREATE INDEX conteudos_org_status_idx ON public.conteudos(org_id, status);
CREATE UNIQUE INDEX conteudos_calendario_item_uidx ON public.conteudos(calendario_item_id) WHERE calendario_item_id IS NOT NULL;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conteudos TO authenticated;
GRANT ALL ON public.conteudos TO service_role;
ALTER TABLE public.conteudos ENABLE ROW LEVEL SECURITY;
CREATE POLICY conteudos_team_all ON public.conteudos FOR ALL TO authenticated
  USING (private.is_org_member(org_id) AND NOT public.has_role(auth.uid(),'cliente'))
  WITH CHECK (private.is_org_member(org_id) AND NOT public.has_role(auth.uid(),'cliente'));

CREATE TABLE public.conteudos_internos (
  conteudo_id uuid PRIMARY KEY REFERENCES public.conteudos(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES public.organizations(id),
  observacoes text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conteudos_internos TO authenticated;
GRANT ALL ON public.conteudos_internos TO service_role;
ALTER TABLE public.conteudos_internos ENABLE ROW LEVEL SECURITY;
CREATE POLICY conteudos_internos_team_all ON public.conteudos_internos FOR ALL TO authenticated
  USING (private.is_org_member(org_id) AND NOT public.has_role(auth.uid(),'cliente'))
  WITH CHECK (private.is_org_member(org_id) AND NOT public.has_role(auth.uid(),'cliente'));

CREATE TABLE public.conteudo_midias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id),
  conteudo_id uuid NOT NULL REFERENCES public.conteudos(id) ON DELETE CASCADE,
  bucket text NOT NULL DEFAULT 'midias-conteudo',
  storage_path text NOT NULL,
  tipo text NOT NULL CHECK (tipo IN ('imagem','video')),
  mime text,
  nome_original text,
  tamanho_bytes bigint,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX conteudo_midias_conteudo_idx ON public.conteudo_midias(conteudo_id, ordem);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conteudo_midias TO authenticated;
GRANT ALL ON public.conteudo_midias TO service_role;
ALTER TABLE public.conteudo_midias ENABLE ROW LEVEL SECURITY;
CREATE POLICY conteudo_midias_team_all ON public.conteudo_midias FOR ALL TO authenticated
  USING (private.is_org_member(org_id) AND NOT public.has_role(auth.uid(),'cliente'))
  WITH CHECK (private.is_org_member(org_id) AND NOT public.has_role(auth.uid(),'cliente'));

CREATE TABLE public.conteudo_versoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id),
  conteudo_id uuid NOT NULL REFERENCES public.conteudos(id) ON DELETE CASCADE,
  numero integer NOT NULL,
  legenda text,
  hashtags text,
  midias jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'enviada' CHECK (status IN ('enviada','aprovada','alteracao_solicitada')),
  status_arte text NOT NULL DEFAULT 'pendente' CHECK (status_arte IN ('pendente','aprovado','alteracao_solicitada')),
  status_legenda text NOT NULL DEFAULT 'pendente' CHECK (status_legenda IN ('pendente','aprovado','alteracao_solicitada')),
  enviada_em timestamptz NOT NULL DEFAULT now(),
  enviada_por uuid DEFAULT auth.uid(),
  recebida_por uuid,
  recebida_em timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (conteudo_id, numero)
);
GRANT SELECT, INSERT, UPDATE ON public.conteudo_versoes TO authenticated;
GRANT ALL ON public.conteudo_versoes TO service_role;
ALTER TABLE public.conteudo_versoes ENABLE ROW LEVEL SECURITY;
CREATE POLICY conteudo_versoes_team_select ON public.conteudo_versoes FOR SELECT TO authenticated
  USING (private.is_org_member(org_id) AND NOT public.has_role(auth.uid(),'cliente'));
CREATE POLICY conteudo_versoes_team_insert ON public.conteudo_versoes FOR INSERT TO authenticated
  WITH CHECK (private.is_org_member(org_id) AND NOT public.has_role(auth.uid(),'cliente'));
CREATE POLICY conteudo_versoes_team_update ON public.conteudo_versoes FOR UPDATE TO authenticated
  USING (private.is_org_member(org_id) AND NOT public.has_role(auth.uid(),'cliente'))
  WITH CHECK (private.is_org_member(org_id) AND NOT public.has_role(auth.uid(),'cliente'));

CREATE TABLE public.conteudo_comentarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id),
  conteudo_id uuid NOT NULL REFERENCES public.conteudos(id) ON DELETE CASCADE,
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  versao_id uuid REFERENCES public.conteudo_versoes(id) ON DELETE SET NULL,
  tipo text NOT NULL DEFAULT 'interno' CHECK (tipo IN ('interno','cliente')),
  alvo text NOT NULL DEFAULT 'geral' CHECK (alvo IN ('geral','arte','legenda')),
  autor_id uuid DEFAULT auth.uid(),
  texto text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX conteudo_comentarios_conteudo_idx ON public.conteudo_comentarios(conteudo_id, created_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conteudo_comentarios TO authenticated;
GRANT ALL ON public.conteudo_comentarios TO service_role;
ALTER TABLE public.conteudo_comentarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY conteudo_comentarios_team_all ON public.conteudo_comentarios FOR ALL TO authenticated
  USING (private.is_org_member(org_id) AND NOT public.has_role(auth.uid(),'cliente'))
  WITH CHECK (private.is_org_member(org_id) AND NOT public.has_role(auth.uid(),'cliente'));
CREATE POLICY conteudo_comentarios_cliente_read ON public.conteudo_comentarios FOR SELECT TO authenticated
  USING (tipo = 'cliente' AND public.has_role(auth.uid(),'cliente') AND cliente_id = public.current_cliente_id());

CREATE TABLE public.conteudo_eventos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id),
  conteudo_id uuid NOT NULL REFERENCES public.conteudos(id) ON DELETE CASCADE,
  tipo text NOT NULL,
  de text,
  para text,
  detalhe text,
  autor_id uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX conteudo_eventos_conteudo_idx ON public.conteudo_eventos(conteudo_id, created_at);
GRANT SELECT, INSERT ON public.conteudo_eventos TO authenticated;
GRANT ALL ON public.conteudo_eventos TO service_role;
ALTER TABLE public.conteudo_eventos ENABLE ROW LEVEL SECURITY;
CREATE POLICY conteudo_eventos_team_select ON public.conteudo_eventos FOR SELECT TO authenticated
  USING (private.is_org_member(org_id) AND NOT public.has_role(auth.uid(),'cliente'));

-- org_id automático
CREATE TRIGGER trg_conteudos_set_org_id BEFORE INSERT ON public.conteudos FOR EACH ROW EXECUTE FUNCTION private.set_org_id_from_profile();
CREATE TRIGGER trg_conteudos_internos_set_org_id BEFORE INSERT ON public.conteudos_internos FOR EACH ROW EXECUTE FUNCTION private.set_org_id_from_profile();
CREATE TRIGGER trg_conteudo_midias_set_org_id BEFORE INSERT ON public.conteudo_midias FOR EACH ROW EXECUTE FUNCTION private.set_org_id_from_profile();
CREATE TRIGGER trg_conteudo_versoes_set_org_id BEFORE INSERT ON public.conteudo_versoes FOR EACH ROW EXECUTE FUNCTION private.set_org_id_from_profile();
CREATE TRIGGER trg_conteudo_comentarios_set_org_id BEFORE INSERT ON public.conteudo_comentarios FOR EACH ROW EXECUTE FUNCTION private.set_org_id_from_profile();
CREATE TRIGGER trg_conteudos_updated_at BEFORE UPDATE ON public.conteudos FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_conteudos_internos_updated_at BEFORE UPDATE ON public.conteudos_internos FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Workflow: histórico, snapshot de versão ao enviar e proteção da versão enviada
CREATE OR REPLACE FUNCTION private.conteudos_workflow()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_sent boolean;
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.conteudo_eventos(org_id, conteudo_id, tipo, para) VALUES (NEW.org_id, NEW.id, 'criado', NEW.status);
    RETURN NEW;
  END IF;
  -- Após envio, qualquer mudança em legenda/hashtags abre nova versão (a enviada nunca é sobrescrita).
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
    END IF;
    IF NEW.status = 'publicado' AND NEW.publicado_em IS NULL THEN NEW.publicado_em := now(); END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_conteudos_workflow_upd BEFORE UPDATE ON public.conteudos FOR EACH ROW EXECUTE FUNCTION private.conteudos_workflow();

CREATE OR REPLACE FUNCTION private.conteudos_after_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.conteudo_eventos(org_id, conteudo_id, tipo, para) VALUES (NEW.org_id, NEW.id, 'criado', NEW.status);
  RETURN NEW;
END $$;
CREATE TRIGGER trg_conteudos_after_insert AFTER INSERT ON public.conteudos FOR EACH ROW EXECUTE FUNCTION private.conteudos_after_insert();

-- Versões enviadas são imutáveis no conteúdo (só status de aprovação/recebimento pode mudar)
CREATE OR REPLACE FUNCTION private.conteudo_versoes_guard()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.legenda IS DISTINCT FROM OLD.legenda OR NEW.hashtags IS DISTINCT FROM OLD.hashtags OR NEW.midias IS DISTINCT FROM OLD.midias OR NEW.numero <> OLD.numero OR NEW.conteudo_id <> OLD.conteudo_id THEN
    RAISE EXCEPTION 'Versão enviada não pode ser alterada';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_conteudo_versoes_guard BEFORE UPDATE ON public.conteudo_versoes FOR EACH ROW EXECUTE FUNCTION private.conteudo_versoes_guard();

REVOKE ALL ON FUNCTION private.conteudos_workflow() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.conteudos_after_insert() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION private.conteudo_versoes_guard() FROM PUBLIC, anon, authenticated;

-- Storage: equipe (não só admin) pode enviar mídias de conteúdo
CREATE POLICY midias_conteudo_team_all ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'midias-conteudo' AND (public.has_role(auth.uid(),'gestor') OR public.has_role(auth.uid(),'editor') OR public.has_role(auth.uid(),'social')))
  WITH CHECK (bucket_id = 'midias-conteudo' AND (public.has_role(auth.uid(),'gestor') OR public.has_role(auth.uid(),'editor') OR public.has_role(auth.uid(),'social')));