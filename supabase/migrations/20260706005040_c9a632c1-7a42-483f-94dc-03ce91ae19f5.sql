
DROP POLICY IF EXISTS "Usuário vê seus próprios envios" ON public.whatsapp_envios;
DROP POLICY IF EXISTS "Usuário cria seus próprios envios" ON public.whatsapp_envios;

CREATE POLICY "Usuário vê seus próprios envios"
  ON public.whatsapp_envios FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Usuário cria seus próprios envios"
  ON public.whatsapp_envios FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
