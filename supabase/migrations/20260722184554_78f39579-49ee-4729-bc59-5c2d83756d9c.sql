CREATE TABLE public.conteudos_globais (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  topico_id UUID NOT NULL REFERENCES public.topicos_fase(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('video','audio','documento')),
  titulo TEXT,
  descricao TEXT,
  url TEXT,
  storage_path TEXT,
  storage_bucket TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.conteudos_globais TO authenticated;
GRANT ALL ON public.conteudos_globais TO service_role;

ALTER TABLE public.conteudos_globais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read global content"
  ON public.conteudos_globais FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert global content"
  ON public.conteudos_globais FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update global content"
  ON public.conteudos_globais FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete global content"
  ON public.conteudos_globais FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER set_conteudos_globais_updated_at
  BEFORE UPDATE ON public.conteudos_globais
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_conteudos_globais_topico ON public.conteudos_globais(topico_id);