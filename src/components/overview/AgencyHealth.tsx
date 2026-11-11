import { Link } from "@tanstack/react-router";
import { ArrowUpRight, BriefcaseBusiness, HeartHandshake, ListChecks, Wallet } from "lucide-react";
import type { OverviewData } from "./useOverviewData";

const money = (amount: number) => amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function HealthCard({ title, icon: Icon, href, rows, note }: {
  title: string;
  icon: typeof Wallet;
  href: "/admin/financeiro" | "/admin/crm" | "/admin/clientes" | "/admin/conteudo";
  rows: { label: string; value: string; warning?: boolean }[];
  note?: string;
}) {
  return (
    <section className="min-w-0 rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary"><Icon className="h-4 w-4" aria-hidden /></span>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        </div>
        <Link to={href} className="flex min-h-10 min-w-10 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground" aria-label={`Abrir ${title}`}><ArrowUpRight className="h-4 w-4" /></Link>
      </div>
      <dl className="space-y-3">
        {rows.map((row) => (
          <div key={row.label} className="flex items-baseline justify-between gap-3 border-b border-border/60 pb-2 last:border-0 last:pb-0">
            <dt className="text-xs leading-relaxed text-muted-foreground">{row.label}</dt>
            <dd className={`shrink-0 text-sm font-semibold tabular-nums ${row.warning ? "text-destructive" : "text-foreground"}`}>{row.value}</dd>
          </div>
        ))}
      </dl>
      {note && <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">{note}</p>}
    </section>
  );
}

/** Exibe somente dados existentes no Supabase; não atribui pontuações de saúde inventadas. */
export function AgencyHealth({ data, show }: {
  data: OverviewData["health"];
  show: { clientes: boolean; conteudo: boolean; financeiro: boolean; comercial: boolean };
}) {
  return (
    <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {show.financeiro && <HealthCard title="Saúde financeira" icon={Wallet} href="/admin/financeiro" rows={[
        { label: "Recebido no mês", value: money(data.financial.received) },
        { label: "Despesas registradas", value: money(data.financial.expenses) },
        { label: "Recebimentos vencidos", value: money(data.financial.overdueReceivables), warning: data.financial.overdueCount > 0 },
        { label: "Resultado registrado", value: money(data.financial.operationalBalance) },
      ]} note="Resultado = entradas marcadas como pagas menos despesas do mês. Não representa o saldo bancário." />}
      {show.comercial && <HealthCard title="Saúde comercial" icon={BriefcaseBusiness} href="/admin/crm" rows={[
        { label: "Leads em aberto", value: String(data.commercial.openLeads) },
        { label: "Propostas enviadas", value: String(data.commercial.proposals) },
        { label: "Follow-ups atrasados", value: String(data.commercial.overdueFollowUps), warning: data.commercial.overdueFollowUps > 0 },
        { label: "Próximos 7 dias", value: String(data.commercial.upcomingFollowUps) },
      ]} />}
      {show.clientes && <HealthCard title="Saúde dos clientes" icon={HeartHandshake} href="/admin/clientes" rows={[
        { label: "Contratos ativos", value: String(data.clients.active) },
        { label: "Clientes com alertas", value: String(data.clients.attention), warning: data.clients.attention > 0 },
        { label: "Contratos até 30 dias", value: String(data.clients.expiringContracts), warning: data.clients.expiringContracts > 0 },
        { label: "Onboardings pendentes", value: String(data.clients.pendingOnboarding) },
      ]} note="Alertas são pendências registradas, não um índice de satisfação." />}
      {show.conteudo && <HealthCard title="Saúde operacional" icon={ListChecks} href="/admin/conteudo" rows={[
        { label: "Tarefas atrasadas", value: String(data.operations.overdueTasks), warning: data.operations.overdueTasks > 0 },
        { label: "Aguardando cliente", value: String(data.operations.pendingApproval) },
        { label: "Prontos para agendar", value: String(data.operations.readyToSchedule) },
        { label: "Revisões e ajustes", value: String(data.operations.revisions) },
      ]} />}
    </div>
  );
}
