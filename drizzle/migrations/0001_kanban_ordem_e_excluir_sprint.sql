ALTER TABLE public.tarefas ADD COLUMN IF NOT EXISTS ordem double precision;
ALTER TABLE public.conteudos ADD COLUMN IF NOT EXISTS ordem double precision;
UPDATE public.tarefas SET ordem = extract(epoch from created_at) * 1000 WHERE ordem IS NULL;
UPDATE public.conteudos SET ordem = extract(epoch from created_at) * 1000 WHERE ordem IS NULL;
ALTER TABLE public.tarefas ALTER COLUMN ordem SET DEFAULT (extract(epoch from clock_timestamp()) * 1000);
ALTER TABLE public.conteudos ALTER COLUMN ordem SET DEFAULT (extract(epoch from clock_timestamp()) * 1000);
ALTER TABLE public.tarefas ALTER COLUMN ordem SET NOT NULL;
ALTER TABLE public.conteudos ALTER COLUMN ordem SET NOT NULL;
CREATE INDEX IF NOT EXISTS tarefas_status_ordem_idx ON public.tarefas (status, ordem);
CREATE INDEX IF NOT EXISTS conteudos_status_ordem_idx ON public.conteudos (status, ordem);

-- Exclui uma sprint de forma segura: realoca (ou desvincula) as tarefas antes, numa única transação.
-- SECURITY INVOKER: respeita as RLS do usuário; se alguma tarefa não puder ser movida, nada é excluído.
CREATE OR REPLACE FUNCTION public.excluir_sprint(_sprint_id uuid, _destino uuid DEFAULT NULL)
RETURNS integer
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE v_total int; v_moved int;
BEGIN
  IF _destino IS NOT NULL AND _destino = _sprint_id THEN RAISE EXCEPTION 'destino_invalido'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.sprints WHERE id = _sprint_id) THEN RAISE EXCEPTION 'sprint_nao_encontrada'; END IF;
  IF _destino IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.sprints WHERE id = _destino) THEN RAISE EXCEPTION 'destino_nao_encontrado'; END IF;
  SELECT count(*) INTO v_total FROM public.tarefas WHERE sprint_id = _sprint_id;
  UPDATE public.tarefas SET sprint_id = _destino WHERE sprint_id = _sprint_id;
  GET DIAGNOSTICS v_moved = ROW_COUNT;
  IF v_moved <> v_total OR EXISTS (SELECT 1 FROM public.tarefas WHERE sprint_id = _sprint_id) THEN
    RAISE EXCEPTION 'tarefas_nao_realocadas';
  END IF;
  DELETE FROM public.sprints WHERE id = _sprint_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'sem_permissao'; END IF;
  RETURN v_moved;
END $$;
REVOKE ALL ON FUNCTION public.excluir_sprint(uuid, uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.excluir_sprint(uuid, uuid) TO authenticated;