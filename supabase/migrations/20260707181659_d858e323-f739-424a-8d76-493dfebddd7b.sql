DROP POLICY IF EXISTS "Usuário atualiza próprio profile" ON public.profiles;

CREATE POLICY "Usuário atualiza próprio profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (
  id = auth.uid()
  AND cliente_id IS NOT DISTINCT FROM (SELECT p.cliente_id FROM public.profiles p WHERE p.id = auth.uid())
);