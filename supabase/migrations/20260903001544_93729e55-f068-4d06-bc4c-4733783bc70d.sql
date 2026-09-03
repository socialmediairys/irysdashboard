DROP POLICY IF EXISTS org_social_accounts_cliente_read ON public.social_accounts;

CREATE OR REPLACE VIEW public.social_accounts_cliente_view AS
SELECT id, client_id, platform, username, connection_type, created_at, org_id
FROM public.social_accounts
WHERE org_id = private.current_org_id()
  AND client_id = public.current_cliente_id();

GRANT SELECT ON public.social_accounts_cliente_view TO authenticated;
GRANT SELECT ON public.social_accounts_cliente_view TO service_role;