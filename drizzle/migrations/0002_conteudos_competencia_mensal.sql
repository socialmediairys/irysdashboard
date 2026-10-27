UPDATE public.conteudos
SET pipeline_mes = date_trunc('month', COALESCE(data_prevista::timestamp, created_at AT TIME ZONE 'America/Sao_Paulo'))::date
WHERE pipeline_mes IS NULL;
ALTER TABLE public.conteudos ALTER COLUMN pipeline_mes SET DEFAULT (date_trunc('month', (now() AT TIME ZONE 'America/Sao_Paulo')))::date;
CREATE INDEX IF NOT EXISTS conteudos_cliente_mes_idx ON public.conteudos (cliente_id, pipeline_mes);
COMMENT ON COLUMN public.conteudos.pipeline_mes IS 'Competência mensal (1º dia do mês), independente de data_prevista';