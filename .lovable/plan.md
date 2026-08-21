# Multi-tenancy completo + Fase 3 parcial + Fase 4 (Estratégia)

## O que já existe hoje (auditoria do banco)

- Tabela de organizações **já existe**, com o nome `organizations` (2 organizações cadastradas) e `memberships` (2 vínculos, com papel por organização).
- Funções auxiliares já existem no schema privado: `is_org_member(org)` e `has_org_role(org, papel)`.
- 12 tabelas já têm `org_id`: `clientes`, `profiles`, `agenda_itens`, `tarefas`, `sprints`, `financeiro`, `google_calendar_tokens`, `meta_business_pages`, `whatsapp_connections`, `whatsapp_envios`, `memberships`.
- 28 tabelas **ainda não** têm `org_id` e suas policies filtram só por papel (admin/financeiro/cliente) — é aí que está o vazamento entre organizações.
- Dados a corrigir: 3 de 4 clientes e 2 de 4 perfis estão sem organização.

Proposta: **manter `organizations`** (não criar `organizacoes`, para não duplicar e não quebrar o que já roda) e terminar o trabalho nas 28 tabelas restantes.

## Etapa A — Consolidação da organização da agência (confirmado)

Organização da agência: **`iryssocialmedia@gmail.com — Org`** (`1c6d3cbc-1e65-4f3f-be49-f3fb95fd189b`), renomeada para **Irys**.

1. Renomear essa organização para "Irys".
2. Mover **todos os 4 clientes** para ela: Fl Contabilidade, Beatriz Abel, Unaessential e Irys Modelo (que hoje está em `Thamirys — Org`).
3. Preencher `org_id` = Irys em todos os perfis (Irys Aguiar, Thamirys, Beatriz, Laura) e em todas as linhas legadas das tabelas que ganharem `org_id`.
4. Migrar o membership admin de Thamirys? **Não** — a conta aguiarthaamy@gmail.com continua como cliente de teste vinculada a "Irys Modelo"; removo o membership `admin` dela e o vínculo com a org duplicada.
5. Remover a organização `Thamirys — Org` depois que nada mais aponte para ela.
6. Único admin da organização: iryssocialmedia@gmail.com.


## Etapa B — Classificação das tabelas

**B1. Recebem coluna `org_id` própria (escopo direto da organização)**
`leads`, `entradas_financeiras`, `saidas_financeiras`, `contas_fixas`, `financas_administrativas`, `ferramentas`, `prompts`, `referencias`, `tags`, `solicitacoes_cadastro`, `arquivos`, `estrategias`, `conteudos_cliente`, `documentos_juridicos`, `onboarding_checklist`, `progresso_audio`, `suporte_tickets`, `social_accounts` + as duas novas de estratégia.

- `org_id uuid references organizations(id)`, backfill a partir do `cliente_id` quando existir (senão organização padrão), depois `NOT NULL`.
- Trigger `BEFORE INSERT` genérico preenchendo `org_id` pelo perfil do usuário logado (mesmo padrão já usado em `agenda_itens`).
- Índice em `org_id`.

**B2. Sem coluna própria — policy herda do pai**
`task_tags`, `task_comments`, `tarefa_comentarios` (herdam de `tarefas`), `social_goals`, `social_metrics_snapshots` (herdam de `social_accounts`). Evita coluna redundante e risco de divergência.

**B3. Catálogo global da plataforma (permanecem sem `org_id`)**
`fases`, `topicos_fase`, `conteudos_globais` — conteúdo do método, igual para todas as organizações. Leitura para autenticados, escrita só admin.

**B4. `user_roles`**
Recomendo **não** adicionar `org_id` aqui: `memberships.role` já é o papel por organização. `user_roles` fica como papel global de plataforma (super admin). Se você preferir, adiciono `org_id` e passo tudo para `memberships` — mas seria duplicar a mesma informação em dois lugares.

## Etapa C — Reescrita das policies

Padrão único, substituindo as checagens só-por-papel:

- **admin_only por organização** (financeiro, jurídico, comercial, estratégia, ferramentas, prompts):
  `USING (private.has_org_role(org_id, 'admin') OR private.has_org_role(org_id, 'financeiro'...))` conforme o módulo.
- **staff da organização** (tarefas, sprints, agenda, clientes, arquivos):
  `USING (private.is_org_member(org_id) AND NOT é_cliente)`.
- **cliente_scoped**: cliente vê apenas as linhas do próprio `cliente_id` (`current_cliente_id()`), dentro da própria organização.
- **derivadas (B2)**: `EXISTS (select 1 from pai where pai.id = ... and private.is_org_member(pai.org_id))`.
- `GRANT` explícito em toda tabela nova/alterada; `anon` só onde há política pública.

## Etapa D — Tabelas do módulo Estratégia (Fase 4)

```sql
estrategia_briefing (
  cliente_id uuid primary key references clientes(id) on delete cascade,
  org_id     uuid not null references organizations(id),
  mapa       jsonb not null default '{}',
  scores     jsonb not null default '{}',
  lacunas    text,
  updated_at timestamptz not null default now()
)

estrategia_evidencias (
  id            uuid primary key default gen_random_uuid(),
  cliente_id    uuid not null references clientes(id) on delete cascade,
  org_id        uuid not null references organizations(id),
  informacao    text not null,
  classificacao text not null default 'Fato',
  muda          text,
  evidencia     text,
  validar       text,
  created_at    timestamptz not null default now()
)
```
RLS: só membros da organização com papel `admin` ou `gestor`.

## Etapa E — Aplicação no código

Depois da migration, ajustar as consultas que passam a exigir `org_id` (financeiro, comercial, biblioteca, jurídico, estratégia) e o cadastro de cliente para gravar a organização do usuário logado.

## Fase 3 parcial (já aprovada, roda em paralelo ao passo E)

- Remover `admin.sprint.tsx` + `components/Sprint.tsx`; deixar só `/admin/sprints` no menu, rotulado "Sprints".
- Mover contrato/suporte de `portal.tsx` para dentro da Central do Cliente (`meu-portal`), remover `portal.tsx` e apontar o redirect de `admin.tsx` para `/meu-portal`.
- Aplicar o design system (AppShell, PageHeader, MetricCard, StatusBadge, DataTable, EmptyState) em `admin.visao-geral.tsx` e na tela de login.

## Ordem de execução

1. Aprovação deste plano.
2. Migration multi-tenant (Etapas A–D), em uma migration revisável.
3. Ajustes de código (Etapa E) + limpeza de duplicados.
4. Design system no dashboard e login.
5. Módulo Estratégia na rota `/admin/clientes/$clienteId/estrategia`.

## Riscos

- Tornar `org_id` `NOT NULL` falha se o backfill deixar linhas órfãs — o backfill usa a organização padrão como rede de segurança.
- Policies mais restritas podem esconder dados legados sem organização; a Etapa A resolve isso antes.
