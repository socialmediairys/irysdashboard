
CREATE TABLE public.whatsapp_envios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  cliente_nome TEXT,
  to_phone TEXT NOT NULL,
  template_name TEXT NOT NULL,
  language_code TEXT NOT NULL DEFAULT 'pt_BR',
  valor_cobrado NUMERIC(12,2),
  meta_message_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('enviado','erro')),
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX whatsapp_envios_user_created_idx ON public.whatsapp_envios (user_id, created_at DESC);
CREATE INDEX whatsapp_envios_cliente_idx ON public.whatsapp_envios (cliente_id, created_at DESC);

GRANT SELECT, INSERT ON public.whatsapp_envios TO authenticated;
GRANT ALL ON public.whatsapp_envios TO service_role;

ALTER TABLE public.whatsapp_envios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário vê seus próprios envios"
  ON public.whatsapp_envios FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuário cria seus próprios envios"
  ON public.whatsapp_envios FOR INSERT
  WITH CHECK (auth.uid() = user_id);
