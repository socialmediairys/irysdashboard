DROP POLICY IF EXISTS "Equipe gerencia agenda" ON public.agenda_itens;
CREATE POLICY "org_agenda" ON public.agenda_itens FOR ALL TO authenticated
  USING (private.is_org_member(org_id) AND NOT public.has_role(auth.uid(),'cliente'))
  WITH CHECK (private.is_org_member(org_id) AND NOT public.has_role(auth.uid(),'cliente'));

DROP POLICY IF EXISTS "Admin/team pode gerenciar tarefas" ON public.tarefas;
CREATE POLICY "org_tarefas" ON public.tarefas FOR ALL TO authenticated
  USING (private.is_org_member(org_id) AND NOT public.has_role(auth.uid(),'cliente'))
  WITH CHECK (private.is_org_member(org_id) AND NOT public.has_role(auth.uid(),'cliente'));

DROP POLICY IF EXISTS "Admin/team pode gerenciar sprints" ON public.sprints;
CREATE POLICY "org_sprints" ON public.sprints FOR ALL TO authenticated
  USING (private.is_org_member(org_id) AND NOT public.has_role(auth.uid(),'cliente'))
  WITH CHECK (private.is_org_member(org_id) AND NOT public.has_role(auth.uid(),'cliente'));

DROP POLICY IF EXISTS "Admin/financeiro gerencia financeiro" ON public.financeiro;
CREATE POLICY "org_financeiro" ON public.financeiro FOR ALL TO authenticated
  USING (private.is_org_member(org_id) AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'financeiro')))
  WITH CHECK (private.is_org_member(org_id) AND (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'financeiro')));