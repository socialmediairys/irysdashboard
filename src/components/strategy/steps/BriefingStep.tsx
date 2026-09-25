import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { BRIEFING_AREAS, briefingScore, type BriefingMapa, type BriefingStatus } from "@/lib/strategy";
import type { StepProps } from "../StrategyWorkspace";
import { SaveState, inputCls } from "../ui";
import { useAutosave, useStrategyActions } from "../useStrategy";

const STATUS_OPTS: { key: BriefingStatus; label: string }[] = [
  { key: "completa", label: "Completa" }, { key: "incompleta", label: "Incompleta" }, { key: "desconhecida", label: "Desconhecida" },
];

export function BriefingStep({ data, clienteId, touch }: StepProps) {
  const actions = useStrategyActions(clienteId);
  const [mapa, setMapa] = useState<BriefingMapa>(data.briefing?.mapa ?? {});
  const [area, setArea] = useState(BRIEFING_AREAS[0].key);
  const sc = useMemo(() => briefingScore(mapa), [mapa]);
  const state = useAutosave(mapa, async (m) => { await actions.saveBriefing(m, sc); touch(); });

  const set = (k: string, patch: Partial<BriefingMapa[string]>) => setMapa((m) => ({ ...m, [k]: { ...m[k], ...patch } }));
  const a = BRIEFING_AREAS.find((x) => x.key === area)!;

  return (
    <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
      <aside className="space-y-6">
        <div>
          <div className="text-[13px] text-muted-foreground">Briefing Score</div>
          {sc.avaliadas === 0 ? (
            <p className="mt-1 text-[13px] text-muted-foreground">Sem avaliação ainda. Marque cada informação como completa, incompleta ou desconhecida.</p>
          ) : (
            <>
              <div className="mt-1 text-2xl font-semibold text-foreground">{sc.completas}<span className="text-base font-normal text-muted-foreground"> / {sc.total}</span></div>
              <div className="text-xs text-muted-foreground">informações completas · {sc.incompletas} incompletas · {sc.desconhecidas} desconhecidas</div>
            </>
          )}
        </div>
        <nav className="flex gap-1 overflow-x-auto lg:flex-col">
          {BRIEFING_AREAS.map((x) => {
            const done = x.perguntas.filter((p) => mapa[p.key]?.status === "completa").length;
            return (
              <button key={x.key} onClick={() => setArea(x.key)}
                className={cn("flex shrink-0 items-center justify-between gap-3 rounded-md px-3 py-1.5 text-left text-[13px]",
                  area === x.key ? "bg-secondary font-medium text-foreground" : "text-muted-foreground hover:text-foreground")}>
                {x.label}<span className="text-xs text-muted-foreground">{done}/{x.perguntas.length}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <div className="min-w-0">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-foreground">{a.label}</h3>
          <SaveState state={state} />
        </div>
        <div className="divide-y divide-border rounded-lg border border-border bg-card">
          {a.perguntas.map((p) => {
            const v = mapa[p.key] ?? {};
            return (
              <div key={p.key} className="space-y-2 px-4 py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[13px] font-medium text-foreground">{p.label}</span>
                  <div className="inline-flex rounded-md border border-border p-0.5">
                    {STATUS_OPTS.map((o) => (
                      <button key={o.key} onClick={() => set(p.key, { status: v.status === o.key ? undefined : o.key })}
                        className={cn("rounded px-2 py-0.5 text-xs", v.status === o.key ? "bg-secondary font-medium text-foreground" : "text-muted-foreground hover:text-foreground")}>
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>
                <textarea rows={2} value={v.valor ?? ""} onChange={(e) => set(p.key, { valor: e.target.value })} className={cn(inputCls, "resize-y")} placeholder="O que se sabe até aqui" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
