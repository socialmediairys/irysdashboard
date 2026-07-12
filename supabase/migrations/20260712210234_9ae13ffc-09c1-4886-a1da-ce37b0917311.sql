
-- Revoke default PUBLIC execute on SECURITY DEFINER functions and grant only where needed.

-- Trigger-only functions: no direct callers need EXECUTE
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.bootstrap_first_admin() FROM PUBLIC, anon, authenticated;

-- RLS helper functions: only authenticated users need EXECUTE (used inside RLS policies)
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

REVOKE ALL ON FUNCTION public.is_org_member(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_org_member(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.has_org_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_org_role(uuid, public.app_role) TO authenticated;

REVOKE ALL ON FUNCTION public.current_cliente_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_cliente_id() TO authenticated;

-- set_updated_at is a trigger function only
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
