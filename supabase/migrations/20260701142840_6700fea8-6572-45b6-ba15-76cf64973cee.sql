
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('admin', 'cliente');
CREATE TYPE public.status_contrato AS ENUM ('ativo','pendente_assinatura','vencido','cancelado');
CREATE TYPE public.plano_atual AS ENUM ('basico','intermediario','avancado');
CREATE TYPE public.forma_pagamento AS ENUM ('pix','boleto','cartao_recorrente');
CREATE TYPE public.fin_tipo AS ENUM ('entrada','saida');
CREATE TYPE public.fin_status AS ENUM ('pendente','pago');
CREATE TYPE public.fin_categoria AS ENUM ('assinatura_ferramenta','pro_labore','impostos','outro');
CREATE TYPE public.ticket_status AS ENUM ('aberto','em_analise','resolvido');
CREATE TYPE public.ticket_prioridade AS ENUM ('baixa','media','alta_urgente');
CREATE TYPE public.checklist_responsavel AS ENUM ('admin','cliente');

-- ============ CLIENTES ============
CREATE TABLE public.clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  init TEXT,
  email TEXT,
  telefone TEXT,
  status_contrato public.status_contrato NOT NULL DEFAULT 'pendente_assinatura',
  data_inicio_contrato DATE,
  data_vencimento_contrato DATE,
  link_contrato_assinado TEXT,
  plano_atual public.plano_atual,
  valor_mensal NUMERIC(10,2),
  forma_pagamento public.forma_pagamento,
  versao_contrato TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clientes TO authenticated;
GRANT ALL ON public.clientes TO service_role;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE SET NULL,
  nome TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============ USER_ROLES ============
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.current_cliente_id()
RETURNS UUID LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT cliente_id FROM public.profiles WHERE id = auth.uid()
$$;

-- ============ POLICIES CLIENTES ============
CREATE POLICY "Admins gerenciam clientes" ON public.clientes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Cliente vê o próprio" ON public.clientes FOR SELECT TO authenticated
  USING (id = public.current_cliente_id());

-- ============ POLICIES PROFILES ============
CREATE POLICY "Usuário vê próprio profile" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Usuário atualiza próprio profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid());
CREATE POLICY "Admin vê todos profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admin atualiza profiles" ON public.profiles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- ============ POLICIES USER_ROLES ============
CREATE POLICY "Usuário vê próprios papéis" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admin gerencia papéis" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============ FINANCAS ADMINISTRATIVAS ============
CREATE TABLE public.financas_administrativas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo public.fin_tipo NOT NULL,
  data_vencimento DATE NOT NULL,
  status_pagamento public.fin_status NOT NULL DEFAULT 'pendente',
  categoria public.fin_categoria NOT NULL DEFAULT 'outro',
  valor NUMERIC(10,2) NOT NULL,
  descricao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.financas_administrativas TO authenticated;
GRANT ALL ON public.financas_administrativas TO service_role;
ALTER TABLE public.financas_administrativas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin gerencia finanças" ON public.financas_administrativas FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ============ SUPORTE TICKETS ============
CREATE TABLE public.suporte_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  status public.ticket_status NOT NULL DEFAULT 'aberto',
  prioridade public.ticket_prioridade NOT NULL DEFAULT 'media',
  assunto TEXT NOT NULL,
  descricao TEXT,
  data_abertura TIMESTAMPTZ NOT NULL DEFAULT now(),
  data_resolucao TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.suporte_tickets TO authenticated;
GRANT ALL ON public.suporte_tickets TO service_role;
ALTER TABLE public.suporte_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin gerencia tickets" ON public.suporte_tickets FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Cliente vê próprios tickets" ON public.suporte_tickets FOR SELECT TO authenticated
  USING (cliente_id = public.current_cliente_id());
CREATE POLICY "Cliente cria próprios tickets" ON public.suporte_tickets FOR INSERT TO authenticated
  WITH CHECK (cliente_id = public.current_cliente_id());

-- ============ ONBOARDING CHECKLIST ============
CREATE TABLE public.onboarding_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  tarefa TEXT NOT NULL,
  concluido BOOLEAN NOT NULL DEFAULT FALSE,
  data_conclusao TIMESTAMPTZ,
  responsavel public.checklist_responsavel NOT NULL DEFAULT 'cliente',
  ordem INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.onboarding_checklist TO authenticated;
GRANT ALL ON public.onboarding_checklist TO service_role;
ALTER TABLE public.onboarding_checklist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin gerencia checklist" ON public.onboarding_checklist FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Cliente vê próprio checklist" ON public.onboarding_checklist FOR SELECT TO authenticated
  USING (cliente_id = public.current_cliente_id());
CREATE POLICY "Cliente marca próprio checklist" ON public.onboarding_checklist FOR UPDATE TO authenticated
  USING (cliente_id = public.current_cliente_id()) WITH CHECK (cliente_id = public.current_cliente_id());

-- ============ DOCUMENTOS JURIDICOS ============
CREATE TABLE public.documentos_juridicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  url TEXT NOT NULL,
  tipo TEXT,
  publico BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.documentos_juridicos TO authenticated;
GRANT ALL ON public.documentos_juridicos TO service_role;
ALTER TABLE public.documentos_juridicos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin gerencia documentos" ON public.documentos_juridicos FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Cliente vê próprios docs ou públicos" ON public.documentos_juridicos FOR SELECT TO authenticated
  USING (publico = TRUE OR cliente_id = public.current_cliente_id());

-- ============ TRIGGER NEW USER -> PROFILE ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email), NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ UPDATED_AT TRIGGERS ============
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER trg_clientes_updated BEFORE UPDATE ON public.clientes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
