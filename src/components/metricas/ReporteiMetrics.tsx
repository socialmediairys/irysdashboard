import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ExternalLink } from "lucide-react";
import { getReporteiMetrics, type ReporteiResult } from "@/lib/reportei.functions";

const fmt = (v: number | null) => (v == null ? "—" : v.toLocaleString("pt-BR", { maximumFractionDigits: 2 }));

/** Período em datas ISO a partir de dias (0 = últimos 12 meses). */
export function periodRange(days: number) {
  const end = new Date(Date.now() - 864e5);
  const start = new Date(end.getTime() - ((days || 365) - 1) * 864e5);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { start: iso(start), end: iso(end) };
}

function Spark({ data }: { data: number[] }) {
  if (data.length < 2) return null;
  const max = Math.max(...data), min = Math.min(...data), w = 100, h = 24;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / (max - min || 1)) * h}`).join(" ");
  return <svg viewBox={`0 0 ${w} ${h}`} className="mt-2 h-6 w-full text-muted-foreground" preserveAspectRatio="none"><polyline points={pts} fill="none" stroke="currentColor" strokeWidth="1.2" vectorEffect="non-scaling-stroke" /></svg>;
}

/**
 * Métricas do Reportei para um cliente. Fonte separada: nunca somada a dados
 * manuais ou da integração direta Meta.
 */
export function ReporteiMetrics({ clienteId, start, end, network = "", hideWhenUnlinked = false }: { clienteId?: string; start: string; end: string; network?: string; hideWhenUnlinked?: boolean }) {
  const fn = useServerFn(getReporteiMetrics);
  const q = useQuery({
    queryKey: ["reportei-metrics", clienteId ?? "me", start, end, network],
    queryFn: () => fn({ data: { clienteId, start, end, network } }) as Promise<ReporteiResult>,
    staleTime: 10 * 60e3,
    retry: false,
  });
  const r = q.data;
  if ((r?.state === "not_linked" || r?.state === "disabled") && hideWhenUnlinked) return null;

  return (
    <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <header className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-base font-semibold text-foreground">Métricas do período{r?.projectName ? ` · ${r.projectName}` : ""}</h3>
        <div className="flex items-center gap-3 text-[12px] text-muted-foreground">
          <span>Fonte: Reportei{r?.state === "ok" ? ` · atualizado ${new Date(r.fetchedAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}` : ""}</span>
          {r?.reportUrl && <a href={r.reportUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-foreground">Abrir relatório completo no Reportei <ExternalLink size={12} /></a>}
        </div>
      </header>
      {q.isLoading ? <p className="text-sm text-muted-foreground">Consultando o Reportei…</p>
        : q.isError ? <p className="text-sm text-destructive">Não foi possível consultar o Reportei agora.</p>
        : r?.state === "not_linked" ? <p className="text-sm text-muted-foreground">Este cliente ainda não está vinculado a um projeto do Reportei. Vincule em Configurações → Integrações.</p>
        : r?.state === "disabled" ? <p className="text-sm text-muted-foreground">A integração com o Reportei está desconectada.</p>
        : r?.state === "error" ? <p className="text-sm text-destructive">{r.error}</p>
        : !r?.sources.length ? <p className="text-sm text-muted-foreground">Nenhuma integração{network ? " desta rede" : ""} encontrada no projeto do Reportei.</p>
        : (
          <div className="space-y-6">
            {r.sources.map((s) => (
              <div key={s.slug + s.name}>
                <div className="mb-2 text-[13px] font-medium text-foreground">{s.name} <span className="font-normal text-muted-foreground">· {s.slug.replace(/_/g, " ")}</span></div>
                {s.error ? <p className="text-sm text-destructive">{s.error}</p>
                  : s.metrics.every((m) => m.value == null || m.value === 0) ? <p className="text-sm text-muted-foreground">Sem dados neste período.</p>
                  : (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                      {s.metrics.map((m) => (
                        <div key={m.key} className="rounded-lg bg-secondary px-3 py-3">
                          <div className="truncate text-[12px] text-muted-foreground" title={m.label}>{m.label}</div>
                          <div className="mt-1 text-xl font-semibold text-foreground">{fmt(m.value)}</div>
                          {m.warning ? <div className="mt-1 text-[11px] text-muted-foreground">{m.warning}</div> : <Spark data={m.trend} />}
                        </div>
                      ))}
                    </div>
                  )}
                {s.others.length > 0 && (
                  <details className="mt-2 text-[12px] text-muted-foreground">
                    <summary className="cursor-pointer">Outras métricas disponíveis ({s.others.length})</summary>
                    <p className="mt-1 leading-relaxed">{s.others.join(" · ")}</p>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}
    </section>
  );
}
