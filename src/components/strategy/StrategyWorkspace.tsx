import "./strategy-usability.css";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { SECTIONS, STEPS, STATUS_LABEL, stepByN, strategyProgress, type EtapaStatus, type SectionKey } from "@/lib/strategy";
import { AiChip, btn, btnPrimary } from "./ui";
import { useStrategy, useStrategyActions, type StrategyData } from "./useStrategy";
import { StrategyOverview } from "./StrategyOverview";
import { BriefingStep } from "./steps/BriefingStep";
import { ResearchStep } from "./steps/ResearchStep";
import { CompetitorsStep } from "./steps/CompetitorsStep";
import { EvidenceRepository } from "./steps/EvidenceRepository";
import { DiagnosisStep } from "./steps/DiagnosisStep";
import { MethodDefinitionStep } from "./steps/MethodDefinitionStep";
import { EditorialStep } from "./steps/EditorialStep";
import { CalendarStep } from "./steps/CalendarStep";
import { exportStrategyPdf } from "@/lib/strategy-pdf";

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
    <div className="irys-strategy space-y-5">
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
        <div className="flex items-center gap-2">
          <button className={btn} onClick={() => exportStrategyPdf(clienteNome, data)}><Download size={14} /> Baixar estratégia em PDF</button>
          <AiChip clienteId={clienteId} data={data} sugestoes={data.sugestoes} onGenerated={actions.refresh} onDecide={(s, st) => void actions.update("estrategia_sugestoes_ia", s.id, { status: st })} />
        </div>
      </div>

      {/* Navegação única: 13 etapas em grupos, sem barras concorrentes */}
      <nav aria-label="Navegação da estratégia" className="rounded-xl border border-border bg-card p-3 sm:p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-medium text-muted-foreground">ETAPAS DA ESTRATÉGIA</span>
          <button type="button" onClick={() => setSection("visao")} className={cn("rounded-md px-3 py-1.5 text-xs", section === "visao" ? "bg-secondary font-semibold" : "text-muted-foreground hover:bg-secondary")}>Visão geral</button>
        </div>
        <div className="grid gap-3 md:grid-cols-4">
          {SECTIONS.filter((s) => s.key !== "visao").map((s) => (
            <div key={s.key} className="min-w-0">
              <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{s.label}</div>
              <div className="space-y-1">
                {STEPS.filter((st) => st.section === s.key).map((st) => {
                  const stStatus = prog.map.get(st.n)?.status ?? "nao_iniciada";
                  return <button type="button" key={st.n} onClick={() => open(st.n)} aria-current={current?.n === st.n ? "step" : undefined}
                    className={cn("flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-xs transition-colors", current?.n === st.n ? "bg-secondary font-semibold text-foreground ring-1 ring-border" : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground")}>
                    <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded border text-[10px]", current?.n === st.n ? "border-foreground/20" : "border-border")}>{st.n}</span>
                    <span className="min-w-0 flex-1 leading-snug">{st.titulo}</span>
                    <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", stStatus === "concluida" ? "bg-emerald-600" : stStatus === "em_andamento" ? "bg-sky-600" : stStatus === "revisar" ? "bg-amber-600" : "bg-border")} />
                  </button>;
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>

      {section === "visao" && <StrategyOverview data={data} prog={prog} onOpen={open} />}

      {current && (
        <div className="space-y-5">
          <StepHeader n={current.n} status={status}
            onStatus={(s) => void actions.setStatus(current.n, s)}
            ai={<AiChip clienteId={clienteId} data={data} etapa={current.n} sugestoes={data.sugestoes} onGenerated={actions.refresh} onDecide={(s, st) => void actions.update("estrategia_sugestoes_ia", s.id, { status: st })} />} />

          <StepBody n={current.n} data={data} clienteId={clienteId} touch={() => void actions.touchStep(current.n, status)} />

          <div className="flex items-center justify-between border-t border-border pt-4">
            <button className={btn} disabled={current.n === 1} onClick={() => open(current.n - 1)}><ChevronLeft size={14} /> Anterior</button>
          {current.n < 13 && (
            <div className="flex justify-end">
              <button className={btn} onClick={() => open(current.n + 1)}>
                Próxima: {stepByN(current.n + 1).titulo} <ChevronRight size={14} />
              </button>
            </div>
          )}
          </div>
        </div>
      )}
    </div>
  );
}

const PROMPTS_POR_ETAPA: Record<number, string> = {
  4: "Prompt 1", 5: "Prompts 2–3", 6: "Prompts 4–7", 7: "Prompts 8–11",
  8: "Prompts 12–15", 9: "Prompts 16–19", 10: "Prompts 20–24", 11: "Prompts 25–36",
  12: "Prompts 37–41 e 43", 13: "Prompt 42",
};

function StepHeader({ n, status, onStatus, ai }: { n: number; status: EtapaStatus; onStatus: (s: EtapaStatus) => void; ai?: ReactNode }) {
  const s = stepByN(n);
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground">Etapa {n} de 13</div>
        <h2 className="mt-0.5 text-xl font-semibold tracking-tight text-foreground">{s.titulo}</h2>
        <p className="mt-1 max-w-2xl text-[13px] text-muted-foreground">{s.acao}</p>
        {PROMPTS_POR_ETAPA[n] && <div className="mt-2 inline-flex rounded-md border border-border bg-secondary/40 px-2 py-1 text-xs font-medium text-muted-foreground">Aplicar {PROMPTS_POR_ETAPA[n]} do pacote QR</div>}
      </div>
      <div className="flex items-center gap-2">
        {ai}
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
    case "definicao": return <MethodDefinitionStep key={n} etapa={n} {...p} />;
    case "editorial": return <EditorialStep {...p} />;
    case "calendario": return <CalendarStep {...p} />;
  }
}

export type StepProps = { data: StrategyData; clienteId: string; touch: () => void };
