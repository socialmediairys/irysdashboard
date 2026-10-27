-- Ordenação persistente dos conteúdos exclusivos do cliente.
ALTER TABLE public.conteudos_cliente ADD COLUMN IF NOT EXISTS ordem integer NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS conteudos_cliente_topico_ordem_idx ON public.conteudos_cliente (cliente_id, topico_id, ordem);
