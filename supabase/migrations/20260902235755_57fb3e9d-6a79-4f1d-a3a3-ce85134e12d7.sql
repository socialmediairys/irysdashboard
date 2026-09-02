-- clientes
DROP POLICY IF EXISTS "Admins gerenciam clientes" ON public.clientes;
CREATE POLICY "Admins gerenciam clientes da org" ON public.clientes
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin') AND org_id IS NOT NULL AND private.is_org_member(org_id))
  WITH CHECK (has_role(auth.uid(), 'admin') AND org_id IS NOT NULL AND private.is_org_member(org_id));

-- profiles
DROP POLICY IF EXISTS "Admin vê todos profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin atualiza profiles" ON public.profiles;
CREATE POLICY "Admin vê profiles da org" ON public.profiles
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin') AND org_id IS NOT NULL AND private.is_org_member(org_id));
CREATE POLICY "Admin atualiza profiles da org" ON public.profiles
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin') AND org_id IS NOT NULL AND private.is_org_member(org_id))
  WITH CHECK (has_role(auth.uid(), 'admin') AND org_id IS NOT NULL AND private.is_org_member(org_id));

-- organizations
DROP POLICY IF EXISTS "Membros veem sua organização" ON public.organizations;
DROP POLICY IF EXISTS "Admin da org gerencia organização" ON public.organizations;
CREATE POLICY "Membros veem sua organização" ON public.organizations
  FOR SELECT TO authenticated
  USING (private.is_org_member(id));
CREATE POLICY "Admin da org gerencia organização" ON public.organizations
  FOR ALL TO authenticated
  USING (private.has_org_role(id, 'admin'))
  WITH CHECK (private.has_org_role(id, 'admin'));

-- memberships
DROP POLICY IF EXISTS "Usuário vê próprias memberships" ON public.memberships;
DROP POLICY IF EXISTS "Admin da org gerencia memberships" ON public.memberships;
CREATE POLICY "Usuário vê memberships da org" ON public.memberships
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR private.has_org_role(org_id, 'admin'));
CREATE POLICY "Admin da org gerencia memberships" ON public.memberships
  FOR ALL TO authenticated
  USING (private.has_org_role(org_id, 'admin'))
  WITH CHECK (private.has_org_role(org_id, 'admin'));