
ALTER TABLE public.clientes
  ADD COLUMN IF NOT EXISTS auth_user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS status_cadastro text NOT NULL DEFAULT 'ativo';

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'clientes_status_cadastro_check'
  ) THEN
    ALTER TABLE public.clientes
      ADD CONSTRAINT clientes_status_cadastro_check
      CHECK (status_cadastro IN ('ativo','pendente','rejeitado'));
  END IF;
END $$;

CREATE POLICY "Cliente vê próprio por auth"
  ON public.clientes
  FOR SELECT
  TO authenticated
  USING (auth_user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.solicitacoes_cadastro (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text NOT NULL,
  email text NOT NULL,
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','aprovado','rejeitado')),
  cliente_id uuid REFERENCES public.clientes(id) ON DELETE SET NULL,
  observacao text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.solicitacoes_cadastro TO authenticated;
GRANT ALL ON public.solicitacoes_cadastro TO service_role;

ALTER TABLE public.solicitacoes_cadastro ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário vê própria solicitação"
  ON public.solicitacoes_cadastro
  FOR SELECT
  TO authenticated
  USING (auth_user_id = auth.uid());

CREATE POLICY "Usuário cria própria solicitação"
  ON public.solicitacoes_cadastro
  FOR INSERT
  TO authenticated
  WITH CHECK (auth_user_id = auth.uid() AND status = 'pendente');

CREATE POLICY "Admin gerencia solicitações"
  ON public.solicitacoes_cadastro
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER solicitacoes_cadastro_set_updated_at
  BEFORE UPDATE ON public.solicitacoes_cadastro
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
