# Evolução do IRYS — Auditoria + plano por fases

## 1. O que já existe hoje
- **Telas (admin):** Visão Geral (Painel 360), Clientes/Cadastros + perfil do cliente (com aba Pipeline), Comercial (Funil/Kanban), Financeiro, Jurídico, Equipe, Sprints (Kanban + painel da tarefa), Métricas Sociais, Biblioteca de Mídia, Gerenciar Portais.
- **Cliente:** Central do Cliente (/meu-portal) com vídeo, áudios, linha do tempo, entregas, documentos, bloqueadores e aba Contrato & Suporte.
- **Acesso:** login, cadastro com aprovação, papéis (admin, equipe, financeiro, cliente) e isolamento por organização (Irys) já testado.
- **Integrações:** Google Calendar, Meta/Instagram (várias páginas), WhatsApp.
- **Design system base:** tokens neutros cinza/grafite, PageHeader, MetricCard, DataTable, StatusBadge, EmptyState, LoadingState.
- **Estratégia:** já existem as tabelas de briefing, evidências e estratégias, mas sem tela de 13 etapas.

## 2. O que será mantido
Tudo acima. Nada é removido: cada tela atual ganha um lugar no novo menu (Jurídico e Equipe vão para Configurações/Financeiro; Métricas Sociais vira parte de Relatórios; Gerenciar Portais vira a aba Portal dentro do cliente).

## 3. Novo menu lateral (igual à referência)
Visão geral · Clientes · Estratégia · Conteúdo · Sprints · Comercial · Financeiro · Biblioteca · Relatórios · Configurações — com barra superior de busca, seletor de mês, notificações e avatar.

## 4. Mudanças no banco (novas, sem apagar dados)
- `estrategia_etapas`: progresso das 13 etapas por cliente (status + dados de cada etapa).
- `conteudos`: posts com data, formato, legenda, mídia, status (ideia → produção → aprovação → publicado).
- `conteudo_versoes` e `conteudo_comentarios` (com marcação interno/visível ao cliente).
- `conteudo_aprovacoes`: aprovar / pedir alteração pelo cliente, inclusive em lote.
- `propostas` no Comercial (valor, validade, status), ligadas aos leads atuais.
- Todas com isolamento por organização e acesso do cliente só ao que é dele.

## 5. Fases (paro para revisão ao fim de cada uma)
1. **Base visual:** novo menu, barra superior, tipografia e espaçamentos da referência.
2. **Visão Geral:** saudação, 4 indicadores, Prioridades de hoje, Clientes que precisam de atenção, Sua semana.
3. **Clientes + workspace do cliente:** lista com filtros (Todos/Ativos/Onboarding/Pausados) e cabeçalho do cliente com abas (Visão geral, Estratégia, Conteúdos, Planejamento, Métricas, Arquivos, Financeiro, Portal).
4. **Estratégia:** trilha das 13 etapas com progresso salvo, fontes/evidências e checklist "O que investigar"; IA para sugestões.
5. **Conteúdo:** calendário semanal, produção, aprovação, publicados, ideias + detalhe do conteúdo.
6. **Portal do Cliente:** aprovações, versões, aprovação em lote (mantendo o conteúdo rico atual).
7. **Sprints** (ajuste visual por etapas), 8. **Comercial** (propostas, contratos, oportunidades), 9. **Financeiro** (Receitas/Despesas/Metas), 10. **Biblioteca** (pastas + filtros), 11. **Relatórios** (visualizações, engajamento, seguidores, performance por cliente).
12. **Revisão geral:** celular, modo escuro, carregamento, estados vazios, acessibilidade.

## 6. Riscos de regressão
- O Painel 360 é um arquivo muito grande com várias telas dentro; será dividido aos poucos, com cuidado.
- Mudar o menu pode quebrar links salvos — endereços antigos continuarão redirecionando.
- Conteúdo novo x "conteúdos do cliente" atuais: os dados existentes serão migrados, não descartados.
- Permissões do cliente em aprovações precisam ser testadas com login real de cliente.

## Detalhes técnicos
- Novo layout em `__root`/rota admin com `AppShell` único; `Painel360.tsx` quebrado em módulos por tela.
- Rotas novas: `/admin/estrategia`, `/admin/conteudo`, `/admin/relatorios`, `/admin/configuracoes`; abas do cliente via search param `tab`.
- Migrações com GRANT + RLS por `org_id` (padrão `private.is_org_member`).
