
-- Bootstrap: primeiro usuário criado vira admin
CREATE OR REPLACE FUNCTION public.bootstrap_first_admin()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'cliente')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.bootstrap_first_admin() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER on_auth_user_created_bootstrap
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.bootstrap_first_admin();

-- Seed cliente demo
INSERT INTO public.clientes (
  id, nome, init, email, telefone, status_contrato,
  data_inicio_contrato, data_vencimento_contrato,
  plano_atual, valor_mensal, forma_pagamento, versao_contrato,
  link_contrato_assinado
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Fernando Luchesi', 'FL', 'fernando@exemplo.com', '+55 11 98888-0001',
  'ativo', CURRENT_DATE - INTERVAL '11 months', CURRENT_DATE + INTERVAL '20 days',
  'avancado', 4500.00, 'pix', 'v3.2',
  'https://example.com/contrato-fernando.pdf'
);

INSERT INTO public.onboarding_checklist (cliente_id, tarefa, responsavel, ordem) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Enviar acessos Meta Business', 'cliente', 1),
  ('11111111-1111-1111-1111-111111111111', 'Preencher briefing de marca', 'cliente', 2),
  ('11111111-1111-1111-1111-111111111111', 'Aprovar identidade visual do feed', 'cliente', 3),
  ('11111111-1111-1111-1111-111111111111', 'Kickoff estratégico', 'admin', 4);

INSERT INTO public.documentos_juridicos (nome, url, tipo, publico) VALUES
  ('Modelo de contrato padrão', 'https://example.com/modelo-contrato.pdf', 'contrato', true),
  ('Política de privacidade', 'https://example.com/privacidade.pdf', 'politica', true);

INSERT INTO public.financas_administrativas (tipo, data_vencimento, status_pagamento, categoria, valor, descricao) VALUES
  ('saida', CURRENT_DATE + 5, 'pendente', 'assinatura_ferramenta', 199.00, 'Assinatura Metricool'),
  ('saida', CURRENT_DATE + 10, 'pendente', 'pro_labore', 3500.00, 'Pro-labore mensal'),
  ('entrada', CURRENT_DATE - 2, 'pago', 'outro', 4500.00, 'Mensalidade Fernando Luchesi');
