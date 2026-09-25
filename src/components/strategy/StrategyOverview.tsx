import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { BRIEFING_AREAS, MACROS, STEPS, briefingScore, strategyProgress } from "@/lib/strategy";
import { btnPrimary, Block, Empty } from "./ui";
import type { StrategyData } from "./useStrategy";

type Prog = ReturnType<typeof strategyProgress>;

/** Lacunas objetivas: perguntas do briefing sem resposta completa + etapas de pesquisa sem evidência. */
export function strategyGaps(data: StrategyData) {
  const gaps: { label: string; etapa: number }[] = [];
  const mapa = data.briefing?.mapa ?? {};
  for (const a of BRIEFING_AREAS) for (const p of a.perguntas) {
    const s = mapa[p.key]?.status;
    if (s === "desconhecida" || s === "incompleta") gaps.push({ label: `${a.label}: ${p.label}`, etapa: 1 });
  }
  for (const n of [2, 3, 4]) if (!data.evidencias.some((e) => e.etapa === n)) gaps.push({ label: `Sem evidências em ${STEPS[n - 1].titulo}`, etapa: n });
  if (!data.concorrentes.length) gaps.push({ label: "Nenhum concorrente cadastrado", etapa: 5 });
  if (!data.achados.some((a) => a.tipo === "gargalo_principal")) gaps.push({ label: "Gargalo principal não definido", etapa: 7 });
  return gaps;
}

export function StrategyOverview({ data, prog, onOpen }: { data: StrategyData; prog: Prog; onOpen: (n: number) => void }) {
  const gaps = strategyGaps(data);
  const decisoes = data.achados.filter((a) => a.tipo === "decisao" || (a.tipo === "gargalo_principal" && a.status !== "descartado"));
  const next = prog.atual;
  const sc = briefingScore(data.briefing?.mapa ?? {});

  return (
    <div className="space-y-10">
      {next && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-card px-5 py-4">
          <div className="min-w-0">
            <div className="text-[13px] text-muted-foreground">Continuar de onde parei · Etapa {next.n} de 13</div>
            <div className="mt-0.5 text-base font-semibold text-foreground">{next.titulo}</div>
            <div className="mt-0.5 text-[13px] text-muted-foreground">{next.acao}</div>
          </div>
          <button className={btnPrimary} onClick={() => onOpen(next.n)}>Continuar <ArrowRight size={14} /></button>
        </div>
      )}

      <Block title="Progresso">
        <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {MACROS.map((m) => {
            const steps = STEPS.filter((s) => s.macro === m.key);
            const done = steps.filter((s) => prog.map.get(s.n)?.status === "concluida").length;
            return (
              <div key={m.key} className="bg-card px-4 py-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-medium text-foreground">{m.label}</span>
                  <span className="text-xs text-muted-foreground">{done}/{steps.length}</span>
                </div>
                <div className="mt-3 space-y-1.5">
                  {steps.map((s) => {
                    const st = prog.map.get(s.n)?.status ?? "nao_iniciada";
                    return (
                      <button key={s.n} onClick={() => onOpen(s.n)} className="flex w-full items-center gap-2 text-left text-[13px] text-muted-foreground hover:text-foreground">
                        <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", st === "concluida" ? "bg-success" : st === "em_andamento" ? "bg-info" : st === "revisar" ? "bg-warning" : "bg-border")} />
                        <span className="truncate">{s.n}. {s.titulo}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </Block>

      <div className="grid gap-10 lg:grid-cols-2">
        <Block title="Pendências e lacunas" description={data.briefing ? `Briefing: ${sc.completas} de ${sc.total} informações completas` : "Briefing ainda não iniciado"}>
          {gaps.length ? (
            <ul className="divide-y divide-border rounded-lg border border-border bg-card">
              {gaps.slice(0, 6).map((g, i) => (
                <li key={i}>
                  <button onClick={() => onOpen(g.etapa)} className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-[13px] text-foreground hover:bg-accent">
                    <span className="truncate">{g.label}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">Etapa {g.etapa}</span>
                  </button>
                </li>
              ))}
              {gaps.length > 6 && <li className="px-4 py-2 text-xs text-muted-foreground">+ {gaps.length - 6} outras</li>}
            </ul>
          ) : <Empty>Nenhuma lacuna objetiva identificada.</Empty>}
        </Block>

        <Block title="Decisões estratégicas" description="Definições assumidas pelo estrategista">
          {decisoes.length ? (
            <ul className="divide-y divide-border rounded-lg border border-border bg-card">
              {decisoes.slice(0, 6).map((d) => (
                <li key={d.id} className="px-4 py-2.5">
                  <div className="text-xs text-muted-foreground">{d.tipo === "decisao" ? "Decisão" : "Gargalo principal"}</div>
                  <div className="text-[13px] text-foreground">{d.titulo}</div>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>
              Nenhuma decisão registrada ainda.
              {data.legado?.objetivo && <div className="mt-2 text-foreground">Objetivo anterior: {data.legado.objetivo}</div>}
            </Empty>
          )}
        </Block>
      </div>
    </div>
  );
}
