import { useState } from "react";
import { cn } from "@/lib/utils";
import { AutoField } from "../ui";
import { useStrategyActions, type StrategyData } from "../useStrategy";

export type MethodSubstep = {
  key: string;
  title: string;
  question: string;
  fields: { key: string; label: string; hint?: string; rows?: number }[];
};

export function MethodArtifacts({ etapa, data, clienteId, substeps }: { etapa: number; data: StrategyData; clienteId: string; substeps: MethodSubstep[] }) {
  const a = useStrategyActions(clienteId);
  const [active, setActive] = useState(substeps[0]?.key ?? "");
  const current = substeps.find((s) => s.key === active) ?? substeps[0];
  const value = (key: string) => data.definicoes.find((d) => d.etapa === etapa && d.campo === key)?.valor ?? "";
  if (!current) return null;
  return (
    <section className="rounded-lg border border-border bg-card">
      <div className="border-b border-border px-4 pt-4">
        <div className="text-[13px] font-medium text-foreground">Artefatos da etapa</div>
        <div className="mt-3 flex gap-1 overflow-x-auto">
          {substeps.map((s, i) => (
            <button key={s.key} onClick={() => setActive(s.key)} className={cn("-mb-px whitespace-nowrap border-b-2 px-2.5 py-2 text-[13px]", active === s.key ? "border-primary font-medium text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}>{i + 1}. {s.title}</button>
          ))}
        </div>
      </div>
      <div className="space-y-4 p-4">
        <div>
          <h4 className="text-sm font-semibold text-foreground">{current.title}</h4>
          <p className="mt-0.5 text-[13px] text-muted-foreground">{current.question}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {current.fields.map((f) => (
            <div key={f.key} className={f.rows && f.rows >= 4 ? "md:col-span-2" : ""}>
              <AutoField label={f.label} hint={f.hint} rows={f.rows ?? 3} initial={value(f.key)} onSave={(v) => a.saveDefinicao(etapa, f.key, v)} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
