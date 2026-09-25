CREATE TABLE public.reportei_connections (
  org_id uuid PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT true,
  company_name text,
  last_checked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reportei_connections TO authenticated;
GRANT ALL ON public.reportei_connections TO service_role;
ALTER TABLE public.reportei_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Equipe gerencia conexão Reportei da org" ON public.reportei_connections FOR ALL TO authenticated
  USING (private.is_org_member(org_id) AND NOT public.has_role(auth.uid(),'cliente'))
  WITH CHECK (private.is_org_member(org_id) AND NOT public.has_role(auth.uid(),'cliente'));
CREATE TRIGGER trg_reportei_connections_updated BEFORE UPDATE ON public.reportei_connections FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.reportei_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL DEFAULT private.current_org_id() REFERENCES public.organizations(id) ON DELETE CASCADE,
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  project_id bigint NOT NULL,
  project_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (cliente_id),
  UNIQUE (org_id, project_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reportei_links TO authenticated;
GRANT ALL ON public.reportei_links TO service_role;
ALTER TABLE public.reportei_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Equipe gerencia vínculos Reportei da org" ON public.reportei_links FOR ALL TO authenticated
  USING (private.is_org_member(org_id) AND NOT public.has_role(auth.uid(),'cliente'))
  WITH CHECK (private.is_org_member(org_id) AND NOT public.has_role(auth.uid(),'cliente')
    AND EXISTS (SELECT 1 FROM public.clientes c WHERE c.id = cliente_id AND c.org_id = reportei_links.org_id));
CREATE TRIGGER trg_reportei_links_updated BEFORE UPDATE ON public.reportei_links FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();