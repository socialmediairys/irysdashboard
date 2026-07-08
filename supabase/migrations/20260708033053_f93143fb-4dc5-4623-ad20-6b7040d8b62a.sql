DROP POLICY IF EXISTS "videos_sistema_auth_read" ON storage.objects;
CREATE POLICY "videos_sistema_admin_read" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'videos-sistema' AND public.has_role(auth.uid(), 'admin'::app_role));