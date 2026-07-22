
ALTER TABLE public.conteudos_globais ADD COLUMN IF NOT EXISTS descricao text;
ALTER TABLE public.conteudos_globais ADD COLUMN IF NOT EXISTS ordem integer NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS conteudos_globais_topico_titulo_uniq
  ON public.conteudos_globais (topico_id, titulo);

CREATE INDEX IF NOT EXISTS idx_conteudos_globais_topico_ordem
  ON public.conteudos_globais (topico_id, ordem);

WITH topico AS (
  SELECT id FROM public.topicos_fase WHERE id = '70e85134-fadc-4635-8cf3-f16597641f9c'
),
seeds(titulo, descricao, ordem) AS (
  VALUES
    ('Boas-Vindas & Nossa Dinâmica', 'Como vai funcionar o dia a dia da nossa comunicação.', 0),
    ('Ajustando expectativas: o tempo do orgânico', 'Apostar em posicionamento não traz milagre em 3 dias; áudio essencial para acalmar a ansiedade da cliente.', 1),
    ('Ninguém cria conteúdo sozinho', 'A importância de a especialista enviar os bastidores e aparecer nos Stories.', 2),
    ('A Importância da linha editorial e nicho', 'Por que não devemos falar de todos os procedimentos ao mesmo tempo.', 3),
    ('A conexão humana nos stories', 'Instruções rápidas de como ela deve usar os Stories para reter as clientes.', 4),
    ('Construção de roteiros rápidos', 'Dicas para quando ela for gravar os Reels que você roteirizou.', 5),
    ('Organização e envio de materiais', 'Como usar os blocos de depósito para não atrasar o cronograma.', 6),
    ('O que analisar em um relatório mensal', 'Para ela entender que curtida não é a métrica principal de faturamento.', 7)
)
INSERT INTO public.conteudos_globais (topico_id, tipo, titulo, descricao, ordem)
SELECT topico.id, 'audio', seeds.titulo, seeds.descricao, seeds.ordem
FROM seeds, topico
ON CONFLICT (topico_id, titulo)
DO UPDATE SET descricao = EXCLUDED.descricao, ordem = EXCLUDED.ordem;
