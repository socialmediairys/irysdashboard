
CREATE TABLE public.social_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  platform text NOT NULL CHECK (platform IN ('instagram','tiktok','facebook','linkedin')),
  username text,
  connection_type text NOT NULL DEFAULT 'manual' CHECK (connection_type IN ('manual','api')),
  access_token text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_social_accounts_client ON public.social_accounts(client_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.social_accounts TO authenticated;
GRANT ALL ON public.social_accounts TO service_role;
ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin/team manage social accounts" ON public.social_accounts FOR ALL
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gestor') OR public.has_role(auth.uid(),'editor') OR public.has_role(auth.uid(),'social'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gestor') OR public.has_role(auth.uid(),'editor') OR public.has_role(auth.uid(),'social'));
CREATE POLICY "Client sees own social accounts" ON public.social_accounts FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.clientes c WHERE c.id = client_id AND c.auth_user_id = auth.uid()));

CREATE TABLE public.social_metrics_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  social_account_id uuid NOT NULL REFERENCES public.social_accounts(id) ON DELETE CASCADE,
  snapshot_date date NOT NULL,
  followers integer,
  engagement_rate numeric,
  reach integer,
  impressions integer,
  source text NOT NULL DEFAULT 'manual' CHECK (source IN ('manual','api')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_social_snapshots_account_date ON public.social_metrics_snapshots(social_account_id, snapshot_date DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.social_metrics_snapshots TO authenticated;
GRANT ALL ON public.social_metrics_snapshots TO service_role;
ALTER TABLE public.social_metrics_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin/team manage social snapshots" ON public.social_metrics_snapshots FOR ALL
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gestor') OR public.has_role(auth.uid(),'editor') OR public.has_role(auth.uid(),'social'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gestor') OR public.has_role(auth.uid(),'editor') OR public.has_role(auth.uid(),'social'));
CREATE POLICY "Client sees own social snapshots" ON public.social_metrics_snapshots FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.social_accounts sa JOIN public.clientes c ON c.id = sa.client_id WHERE sa.id = social_account_id AND c.auth_user_id = auth.uid()));

CREATE TABLE public.social_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  social_account_id uuid NOT NULL REFERENCES public.social_accounts(id) ON DELETE CASCADE,
  metric text NOT NULL CHECK (metric IN ('followers','engagement_rate','reach','impressions')),
  target_value numeric NOT NULL,
  target_date date,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_social_goals_account ON public.social_goals(social_account_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.social_goals TO authenticated;
GRANT ALL ON public.social_goals TO service_role;
ALTER TABLE public.social_goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin/team manage social goals" ON public.social_goals FOR ALL
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gestor') OR public.has_role(auth.uid(),'editor') OR public.has_role(auth.uid(),'social'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'gestor') OR public.has_role(auth.uid(),'editor') OR public.has_role(auth.uid(),'social'));
CREATE POLICY "Client sees own social goals" ON public.social_goals FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.social_accounts sa JOIN public.clientes c ON c.id = sa.client_id WHERE sa.id = social_account_id AND c.auth_user_id = auth.uid()));
