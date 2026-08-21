DO $do$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'leads','entradas_financeiras','saidas_financeiras','contas_fixas','financas_administrativas',
    'ferramentas','prompts','referencias','tags','arquivos','estrategias','conteudos_cliente',
    'documentos_juridicos','onboarding_checklist','progresso_audio','suporte_tickets','social_accounts',
    'agenda_itens','tarefas','sprints','financeiro','estrategia_briefing','estrategia_evidencias'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN org_id SET DEFAULT private.current_org_id()', t);
  END LOOP;
END $do$;