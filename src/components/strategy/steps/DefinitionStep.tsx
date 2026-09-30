import { useState } from "react";
import { cn } from "@/lib/utils";
import { DEFINICAO_CAMPOS } from "@/lib/strategy";
import type { StepProps } from "../StrategyWorkspace";
import { SaveState, inputCls } from "../ui";
import { useAutosave, useStrategyActions } from "../useStrategy";

/** Etapas 8–11: hierarquia por tipografia e divisores (sem card por campo), autosave por campo. */
export function DefinitionStep({ etapa, data, clienteId, touch }: StepProps & { etapa: number }) {
  const a = useStrategyActions(clienteId);
  const campos = DEFINICAO_CAMPOS[etapa] ?? [];
  const val = (k: string) => data.definicoes.find((d) => d.etapa === etapa && d.campo === k)?.valor ?? (etapa === 8 && k === "objetivo" ? data.legado?.objetivo ?? "" : "");
  const gargalo = data.achados.find((x) => x.tipo === "gargalo_principal" && x.status !== "descartado");
  const decisao = data.achados.filter((x) => x.tipo === "decisao").at(-1);

  return (
    <div className="max-w-3xl">
      {(gargalo || decisao) && etapa !== 9 && (
        <div className="mb-8 space-y-1 border-l-2 border-border pl-4 text-[13px]">
          {gargalo && <div><span className="text-muted-foreground">Gargalo principal: </span><span className="text-foreground">{gargalo.titulo}</span></div>}
          {decisao && <div><span className="text-muted-foreground">Decisão: </span><span className="text-foreground">{decisao.titulo}</span></div>}
        </div>
      )}
      <div className="divide-y divide-border border-y border-border">
        {campos.map((c, i) => (
          <DefField key={c.key} first={i === 0} label={c.label} hint={c.hint} initial={val(c.key)} rows={c.key === "persona" || i === 0 ? 3 : 2}
            onSave={async (v) => { await a.saveDefinicao(etapa, c.key, v); touch(); }} />
        ))}
      </div>
    </div>
  );
}

function DefField({ label, hint, initial, onSave, rows, first }: { label: string; hint?: string; initial: string; onSave: (v: string) => Promise<void>; rows: number; first: boolean }) {
  const [v, setV] = useState(initial);
  const state = useAutosave(v, onSave);
  return (
    <label className="block py-5">
      <div className="flex items-baseline justify-between gap-2">
        <span className={cn("font-semibold uppercase tracking-wide text-foreground", first ? "text-[13px]" : "text-xs")}>{label}</span>
        <SaveState state={state} />
      </div>
      {hint && <div className="mt-0.5 text-[13px] text-muted-foreground">{hint}</div>}
      <textarea rows={rows} value={v} onChange={(e) => setV(e.target.value)} className={cn(inputCls, "mt-2 resize-y leading-relaxed", first && "text-[15px]")} />
    </label>
  );
}
