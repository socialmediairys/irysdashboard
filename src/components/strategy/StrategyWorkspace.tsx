import { ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { SECTIONS, STEPS, STATUS_LABEL, stepByN, strategyProgress, type EtapaStatus, type SectionKey } from "@/lib/strategy";
import { AiChip, EtapaBadge, btn, btnPrimary } from "./ui";
import { useStrategy, useStrategyActions, type StrategyData } from "./useStrategy";
import { StrategyOverview } from "./StrategyOverview";
import { BriefingStep } from "./steps/BriefingStep";
import { ResearchStep } from "./steps/ResearchStep";
import { CompetitorsStep } from "./steps/CompetitorsStep";
import { EvidenceRepository } from "./steps/EvidenceRepository";
import { DiagnosisStep } from "./steps/DiagnosisStep";
import { DefinitionStep } from "./steps/DefinitionStep";
import { EditorialStep } from "./steps/EditorialStep";
import { CalendarStep } from "./steps/CalendarStep";

export function StrategyWorkspace({ clienteId, clienteNome }: { clienteId: string; clienteNome: string }) {
  const { data, isLoading, error } = useStrategy(clienteId);
  const actions = useStrategyActions(clienteId);
  const [section, setSection] = useState<SectionKey>("visao");
  const [step, setStep] = useState<number>(1);

  const prog = useMemo(() => strategyProgress(data?.etapas ?? []), [data?.etapas]);

  if (isLoading) return <div className="text-sm text-muted-foreground">Carregando estratégia…</div>;
  if (error || !data) return <div className="text-sm text-destructive">Não foi possível carregar a estratégia.</div>;

  const open = (n: number) => { setStep(n); setSection(stepByN(n).section); };
  const stepsInSection = STEPS.filter((s) => s.section === section);
  const current = section === "visao" ? null : stepsInSection.some((s) => s.n === step) ? stepByN(step) : stepsInSection[0];
  const status: EtapaStatus = current ? (prog.map.get(current.n)?.status ?? "nao_iniciada") : "nao_iniciada";

  return (
    <div className="space-y-8">
      {/* Cabeçalho da estratégia */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="text-[13px] text-muted-foreground">Estratégia · {clienteNome}</div>
          <div className="mt-1 flex items-center gap-3">
            <span className="text-2xl font-semibold tracking-tight text-foreground">{prog.pct}%</span>
            <Progress value={prog.pct} className="h-1.5 w-40" />
          </div>
          <div className="mt-1 text-[13px] text-muted-foreground">
            {prog.atual ? `Etapa ${prog.atual.n} de 13 · ${prog.atual.titulo}` : "Todas as etapas concluídas"}
            {prog.last && ` · atualizado em ${new Date(prog.last).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}`}
          </div>
        </div>
        <AiChip sugestoes={data.sugestoes} onDecide={(s, st) => void actions.update("estrategia_sugestoes_ia", s.id, { status: st })} />
      </div>

      {/* Navegação simples: 5 áreas */}
      <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
        <div className="inline-flex min-w-max rounded-lg border border-border bg-card p-0.5">
          {SECTIONS.map((s) => (
            <button key={s.key} onClick={() => setSection(s.key)}
              className={cn("rounded-md px-3 py-1.5 text-[13px] transition-colors",
                section === s.key ? "bg-secondary font-medium text-foreground" : "text-muted-foreground hover:text-foreground")}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {section === "visao" && <StrategyOverview data={data} prog={prog} onOpen={open} />}

      {current && (
        <div className="space-y-6">
          {stepsInSection.length > 1 && (
            <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
              <div className="flex min-w-max gap-1 border-b border-border">
                {stepsInSection.map((s) => {
                  const st = prog.map.get(s.n)?.status ?? "nao_iniciada";
                  return (
                    <button key={s.n} onClick={() => setStep(s.n)}
                      className={cn("-mb-px flex items-center gap-2 border-b-2 px-2 py-2 text-[13px] transition-colors",
                        current.n === s.n ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}>
                      <span className={cn("h-1.5 w-1.5 rounded-full", st === "concluida" ? "bg-success" : st === "em_andamento" ? "bg-info" : st === "revisar" ? "bg-warning" : "bg-border")} />
                      {s.titulo}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <StepHeader n={current.n} status={status}
            onStatus={(s) => void actions.setStatus(current.n, s)} />

          <StepBody n={current.n} data={data} clienteId={clienteId} touch={() => void actions.touchStep(current.n, status)} />

          {current.n < 13 && (
            <div className="flex justify-end border-t border-border pt-4">
              <button className={btn} onClick={() => open(current.n + 1)}>
                Próxima: {stepByN(current.n + 1).titulo} <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StepHeader({ n, status, onStatus }: { n: number; status: EtapaStatus; onStatus: (s: EtapaStatus) => void }) {
  const s = stepByN(n);
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground">Etapa {n} de 13</div>
        <h2 className="mt-0.5 text-xl font-semibold tracking-tight text-foreground">{s.titulo}</h2>
        <p className="mt-1 max-w-2xl text-[13px] text-muted-foreground">{s.acao}</p>
      </div>
      <div className="flex items-center gap-2">
        <EtapaBadge status={status} />
        <select aria-label="Status da etapa" value={status} onChange={(e) => onStatus(e.target.value as EtapaStatus)}
          className="h-8 rounded-md border border-border bg-card px-2 text-[13px] text-foreground">
          {(Object.keys(STATUS_LABEL) as EtapaStatus[]).map((k) => <option key={k} value={k}>{STATUS_LABEL[k]}</option>)}
        </select>
        {status !== "concluida" && (
          <button className={btnPrimary} onClick={() => onStatus("concluida")}>Concluir etapa</button>
        )}
      </div>
    </div>
  );
}

function StepBody({ n, data, clienteId, touch }: { n: number; data: StrategyData; clienteId: string; touch: () => void }) {
  const p = { data, clienteId, touch };
  switch (stepByN(n).kind) {
    case "briefing": return <BriefingStep {...p} />;
    case "fontes": case "consumidor": case "mercado": return <ResearchStep key={n} etapa={n} {...p} />;
    case "concorrencia": return <CompetitorsStep {...p} />;
    case "evidencias": return <EvidenceRepository {...p} />;
    case "diagnostico": return <DiagnosisStep {...p} />;
    case "definicao": return <DefinitionStep key={n} etapa={n} {...p} />;
    case "editorial": return <EditorialStep {...p} />;
    case "calendario": return <CalendarStep {...p} />;
  }
}

export type StepProps = { data: StrategyData; clienteId: string; touch: () => void };
