DROP POLICY IF EXISTS "Usuário cria própria solicitação" ON public.solicitacoes_cadastro;

CREATE POLICY "Usuário cria própria solicitação"
  ON public.solicitacoes_cadastro
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth_user_id = auth.uid()
    AND status = 'pendente'
    AND cliente_id IS NULL
  );