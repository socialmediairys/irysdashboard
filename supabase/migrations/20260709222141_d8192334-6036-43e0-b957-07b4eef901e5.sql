CREATE TABLE public.meta_business_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  page_id TEXT NOT NULL,
  page_name TEXT,
  page_access_token TEXT NOT NULL,
  ig_user_id TEXT,
  ig_username TEXT,
  token_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.meta_business_connections TO authenticated;
GRANT ALL ON public.meta_business_connections TO service_role;

ALTER TABLE public.meta_business_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own meta business connection"
ON public.meta_business_connections
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER meta_business_connections_set_updated_at
BEFORE UPDATE ON public.meta_business_connections
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.meta_business_pending (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  pages JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.meta_business_pending TO authenticated;
GRANT ALL ON public.meta_business_pending TO service_role;

ALTER TABLE public.meta_business_pending ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own pending meta selection"
ON public.meta_business_pending
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);