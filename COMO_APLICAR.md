# Como aplicar o módulo Sprint no seu repositório

Eu não tenho permissão de escrita no seu GitHub (é público, mas eu não tenho
token/credenciais pra dar push), então não consigo abrir o PR direto. Preparei
duas formas de você aplicar — escolha a que for mais fácil:

## Opção A — Aplicar o patch (recomendado, mais rápido)

```bash
cd irysdashboard
git checkout -b feature/sprint-kanban
git apply --index /caminho/para/0001-feat-modulo-sprint-kanban.patch
git commit -m "feat: módulo Sprint (Calendário) — Kanban com timer, comentários e anexos"
git push -u origin feature/sprint-kanban
```

Depois é só abrir o PR normalmente no GitHub (ou dar merge direto na branch
conectada ao Lovable, se preferir pular o PR).

Se `git apply` reclamar de conflito, use `git apply --reject` e aplique as
partes que faltaram manualmente — mas isso não deve acontecer se seu `main`
local está igual ao do repositório público.

## Opção B — Copiar os arquivos manualmente

Na pasta `sprint-kanban-arquivos/` estão todos os arquivos já prontos, com o
mesmo caminho que eles devem ter no seu projeto:

- `src/components/Sprint.tsx` **(novo)** — o Kanban do Sprint inteiro
- `src/routes/_authenticated/admin.sprint.tsx` **(novo)** — a rota `/admin/sprint`
- `supabase/migrations/20260713010000_sprint_kanban_timer_comentarios.sql` **(novo)** — timer + tabela de comentários
- `src/components/crud/forms.tsx` **(editado)** — só exportei 3 constantes que já existiam, pra reusar no Kanban
- `src/components/layout/AdminSidebar.tsx` **(editado)** — adiciona o item "Sprint" no menu
- `src/integrations/supabase/types.ts` **(editado)** — tipos das novas colunas/tabela

Basta copiar cada arquivo para o mesmo caminho no seu projeto local e commitar.

⚠️ **Não precisa mexer em `src/routeTree.gen.ts`** — esse arquivo é gerado
automaticamente pelo TanStack Router assim que você rodar `npm run dev` ou
`npm run build` de novo. Ele vai detectar a nova rota sozinho.

## O que isso implementa (conferindo com o prompt original)

- ✅ Colunas de status configuráveis com drag-and-drop (reaproveitei os
  mesmos status que seu form de tarefa já tinha: Backlog, Ideação, Produção,
  Revisão Interna, Aprovação Cliente, Agendado)
- ✅ Cliente vinculado, status, prioridade com cor, comentários, anexos
- ✅ Timer Iniciar/Pausar com tempo total acumulado, visível no card e no
  painel de detalhes
- ✅ Clique no card abre um modal com abas Detalhes / Comentários / Anexos

## Antes de usar

1. Aplique o patch (Opção A ou B acima) e dê push.
2. Como o projeto está conectado ao **Lovable Cloud**, a migration em
   `supabase/migrations/` deve ser aplicada automaticamente quando você
   sincronizar/publicar. Se não aplicar sozinha, rode a migration manualmente
   pelo painel do Supabase/Lovable.
3. Acesse `/admin/sprint` — vai aparecer "Sprint" no menu lateral, dentro do
   grupo "Produção".

Testei localmente com `npm install`, `npx tsc --noEmit` e `npm run build` —
tudo passou limpo (só restaram 3 erros de TypeScript que já existiam no
projeto antes das minhas mudanças, em `Painel360.tsx` e
`admin.portal-conteudos.tsx`, sem relação com o Sprint).
