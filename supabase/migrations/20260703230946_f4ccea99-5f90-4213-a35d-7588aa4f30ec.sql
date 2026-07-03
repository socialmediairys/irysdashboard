
-- Fix SUPA_authenticated_security_definer_function_executable:
-- Convert helper functions from SECURITY DEFINER to SECURITY INVOKER.
-- They only read the caller's own rows (user_roles / profiles), which the caller
-- can already SELECT via existing RLS policies. Trigger functions (handle_new_user,
-- bootstrap_first_admin) stay DEFINER because they run in the auth-schema trigger
-- context, not as user API calls.

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.current_cliente_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT cliente_id FROM public.profiles WHERE id = auth.uid()
$$;

-- Fix checklist_admin_tasks:
-- Restrict client UPDATE to only rows where the task is assigned to the client.
DROP POLICY IF EXISTS "Cliente marca próprio checklist" ON public.onboarding_checklist;
CREATE POLICY "Cliente marca próprio checklist"
  ON public.onboarding_checklist
  FOR UPDATE
  TO authenticated
  USING (
    cliente_id = public.current_cliente_id()
    AND responsavel = 'cliente'::public.checklist_responsavel
  )
  WITH CHECK (
    cliente_id = public.current_cliente_id()
    AND responsavel = 'cliente'::public.checklist_responsavel
  );
