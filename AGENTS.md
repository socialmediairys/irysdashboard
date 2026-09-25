<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
- Admin shell: `_authenticated/admin.tsx` renders the single AdminSidebar + AdminTopbar for every /admin route; Painel360 sections are mounted per-route via `<Painel360 section=... />` — one shell, no nested sidebars.
- Client workspace: `/admin/clientes/$clienteId?tab=` uses modular components in `src/components/client-workspace/`; legacy tab names are mapped in `src/lib/client-workspace.ts` so old links keep working.
- Estratégia (Fase 4): `estrategia_etapas` guarda só estado da jornada; conteúdo estruturado fica em tabelas próprias (fontes, evidências, achados+vínculos, definições por campo, editorial_*) — why: rastreabilidade evidência→hipótese→decisão e reuso pelo módulo Conteúdo.
