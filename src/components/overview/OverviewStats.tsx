import type { OverviewData } from "./useOverviewData";

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="min-w-[50%] flex-1 border-border px-5 py-4 lg:min-w-0 [&:not(:last-child)]:border-r">
      <div className="text-[13px] text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-semibold text-foreground">{value}</div>
      {hint && <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

/** Indicadores compactos; cada um só aparece para quem tem acesso à área de origem. */
export function OverviewStats({ stats, show }: { stats: OverviewData["stats"]; show: { clientes: boolean; conteudo: boolean; financeiro: boolean } }) {
  return (
    <div className="flex flex-wrap rounded-lg border border-border bg-card lg:flex-nowrap">
      {show.clientes && <Stat label="Clientes ativos" value={String(stats.clientesAtivos)} />}
      <Stat
        label="Tarefas da semana"
        value={String(stats.tarefasSemana)}
        hint={stats.tarefasAtrasadas ? `${stats.tarefasAtrasadas} atrasada${stats.tarefasAtrasadas > 1 ? "s" : ""}` : "Nenhuma atrasada"}
      />
      {show.conteudo && <Stat label="Conteúdos em produção" value={String(stats.conteudosProducao)} hint="Planejado → revisão interna" />}
      {show.financeiro && (
        <Stat label="Faturamento previsto" value={brl(stats.faturamentoPrevisto)} hint={`Recebido no mês: ${brl(stats.recebidoMes)}`} />
      )}
    </div>
  );
}
