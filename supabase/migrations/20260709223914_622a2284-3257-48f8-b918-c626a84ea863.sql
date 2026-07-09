
ALTER TABLE public.meta_business_connections RENAME TO meta_business_pages;
ALTER TABLE public.meta_business_pages DROP CONSTRAINT IF EXISTS meta_business_connections_user_id_key;
ALTER TABLE public.meta_business_pages ADD COLUMN client_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL;
ALTER TABLE public.meta_business_pages ADD CONSTRAINT meta_business_pages_page_id_key UNIQUE (page_id);
DROP POLICY IF EXISTS "Users manage their own meta business connection" ON public.meta_business_pages;
CREATE POLICY "Users manage their own meta pages"
  ON public.meta_business_pages FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP TABLE IF EXISTS public.meta_business_pending;
