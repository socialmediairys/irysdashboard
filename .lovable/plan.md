# Evolução do Painel 360° → Sistema Multi-Perfil (Admin + Cliente)

Hoje o projeto é um **mock estático em memória** (`DB` dentro de `src/components/Painel360.tsx`) — sem banco, sem auth, sem RLS. O que você pediu é, na prática, **transformar o protótipo em um SaaS real**. Vou entregar em fases para não quebrar o que já funciona.

## Escopo em fases

### Fase 1 — Backend + Auth + RLS (fundação)
1. **Ativar Lovable Cloud** (Supabase gerenciado).
2. **Criar schema completo** via migration:
   - `profiles` (id, cliente_id, nome, email) — vinculado a `auth.users`
   - `user_roles` + enum `app_role` (`admin`, `cliente`) + função `has_role()` (padrão seguro anti-recursão)
   - `clientes` (com `status_contrato`, `data_inicio_contrato`, `data_vencimento_contrato`, `link_contrato_assinado`, `plano_atual`, `valor_mensal`, `forma_pagamento`, `versao_contrato`)
   - `financas_administrativas`, `suporte_tickets`, `suporte_comentarios`, `onboarding_checklist`, `documentos_juridicos`
   - Enums para todos os campos categóricos
   - GRANTs + RLS em todas as tabelas (admin vê tudo via `has_role`; cliente vê só onde `cliente_id = seu próprio cliente_id`)
3. **Trigger `handle_new_user`** para criar `profiles` no signup.
4. **Seed inicial** com um admin de exemplo e os clientes do mock atual migrados.

### Fase 2 — Autenticação
- Rota pública `/auth` (email+senha + Google via broker Lovable).
- Layout `_authenticated/route.tsx` gerenciado pela integração.
- Redirect pós-login: admin → `/admin/visao-geral`; cliente → `/portal`.

### Fase 3 — Área Admin (`/admin/*`)
Reorganiza o Painel 360° atual em rotas separadas mantendo a paleta marrom/dourado:
- `/admin/visao-geral` — Dashboard 360° + **novos cards**: contratos vencendo em 30d, pagamentos pendentes do mês, gráfico gasto-em-ferramentas × faturamento
- `/admin/clientes` — CRM + Pipeline + Documentos (já existe, plugado no banco)
- `/admin/conteudo` — Calendário + Aprovação
- `/admin/financeiro` — Fluxo de caixa + `financas_administrativas`
- `/admin/biblioteca` — IA + Referências
- `/admin/juridico` — **novo**: repositório de documentos, contratos por cliente
- `/admin/suporte` — **novo**: tickets com filtros por status/prioridade, comentários
- `/admin/onboarding` — **novo**: tabela consolidada de progresso de todos os clientes

### Fase 4 — Portal do Cliente (`/portal`)
Reaproveita o `PortalCliente` já implementado, agora **plugado no banco** e filtrado por `cliente_id` do usuário logado. Sub-abas:
- **Conteúdos** (áudios, timeline, bloqueadores — já existe)
- **Contrato** — download do contrato, dados do plano, botão "Solicitar Renovação" (aparece se vencimento < 30d; cria ticket com prioridade `alta_urgente`)
- **Checklist** — marca tarefas concluídas (`onboarding_checklist`)
- **Suporte** — lista tickets próprios + formulário de abertura + comentários

### Fase 5 — Automações
Edge function agendada (pg_cron diário) que:
- Enfileira e-mail via Lovable Emails quando `data_vencimento_contrato` estiver a 15 dias
- Idem para `financas_administrativas` com pagamento pendente próximo do vencimento
Requer setup de email domain (vou pedir na hora se você aprovar essa fase).

## Detalhes técnicos

- **Stack**: TanStack Start + Supabase (Lovable Cloud). Server functions com `requireSupabaseAuth` para leituras/escritas autenticadas; admin usa `has_role(auth.uid(), 'admin')` nas policies.
- **Segurança**: papéis em tabela separada (`user_roles`) — nunca em `profiles` — para prevenir escalonamento de privilégio.
- **Migração dos mocks**: os arrays `DB.clientes`, `DB.financeiro`, `DB.portalCliente.*` viram seeds SQL. O componente `Painel360.tsx` atual é desmontado em rotas menores, cada uma consumindo TanStack Query + server functions.
- **Design**: mantém `--color-p-dark/mid/gold/beige` e Montserrat em todas as telas novas.

## O que preciso confirmar antes de começar

Isso é uma reescrita grande (10+ tabelas, ~20 server functions, ~10 rotas novas, migração de todo o mock). Sugiro fazer **fase por fase** com sua validação entre elas, ao invés de tudo de uma vez.

**Duas perguntas:**
1. Posso ativar o **Lovable Cloud** agora e começar pela Fase 1 (schema + auth + RLS)?
2. Você quer manter os **dados mock atuais** como seed inicial (Fernando Luchesi, Julia Torres, etc.), ou começar com banco vazio e você mesmo cadastra?

Se preferir, também posso entregar tudo de uma vez em um único turno grande — só é mais arriscado de revisar.