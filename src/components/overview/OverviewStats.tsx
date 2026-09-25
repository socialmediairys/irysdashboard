import type { OverviewData } from "./useOverviewData";

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

function Stat({ label, value, hint, muted }: { label: string; value: string; hint?: string; muted?: boolean }) {
  return (
    <div className="px-5 py-4">
      <div className="text-[13px] text-muted-foreground">{label}</div>
      <div className={muted ? "mt-1 text-2xl font-semibold text-text-tertiary" : "mt-1 text-2xl font-semibold text-foreground"}>
        {value}
      </div>
      {hint && <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

/** Four compact indicators in a single divided strip. */
export function OverviewStats({ stats }: { stats: OverviewData["stats"] }) {
  return (
    <div className="grid grid-cols-2 divide-border rounded-lg border border-border bg-card lg:grid-cols-4 lg:divide-x [&>*:nth-child(-n+2)]:border-b [&>*:nth-child(-n+2)]:border-border lg:[&>*:nth-child(-n+2)]:border-b-0 [&>*:nth-child(odd)]:border-r [&>*:nth-child(odd)]:border-border">
      <Stat label="Clientes ativos" value={String(stats.clientesAtivos)} />
      <Stat
        label="Tarefas da semana"
        value={String(stats.tarefasSemana)}
        hint={stats.tarefasAtrasadas ? `${stats.tarefasAtrasadas} atrasada${stats.tarefasAtrasadas > 1 ? "s" : ""}` : "Nenhuma atrasada"}
      />
      <Stat label="Conteúdos em produção" value={String(stats.conteudosProducao)} hint="Planejado → revisão interna" />
      <Stat
        label="Faturamento previsto"
        value={brl(stats.faturamentoPrevisto)}
        hint={`Recebido no mês: ${brl(stats.recebidoMes)}`}
      />
    </div>
  );
}
