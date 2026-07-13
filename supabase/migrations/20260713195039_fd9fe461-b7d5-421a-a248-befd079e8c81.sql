
GRANT USAGE ON SCHEMA private TO authenticated, anon;

GRANT EXECUTE ON FUNCTION private.is_org_member(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION private.has_org_role(uuid, public.app_role) TO authenticated;
