import { DEFINICAO_CAMPOS } from "@/lib/strategy";
import type { StepProps } from "../StrategyWorkspace";
import { AutoField } from "../ui";
import { useStrategyActions } from "../useStrategy";

/** Etapas 8–11: campos estruturados, um registro por campo, com autosave. */
export function DefinitionStep({ etapa, data, clienteId, touch }: StepProps & { etapa: number }) {
  const a = useStrategyActions(clienteId);
  const campos = DEFINICAO_CAMPOS[etapa] ?? [];
  const val = (k: string) => data.definicoes.find((d) => d.etapa === etapa && d.campo === k)?.valor ?? (etapa === 8 && k === "objetivo" ? data.legado?.objetivo ?? "" : "");
  const gargalo = data.achados.find((x) => x.tipo === "gargalo_principal" && x.status !== "descartado");

  return (
    <div className="max-w-3xl space-y-6">
      {gargalo && (etapa === 8 || etapa === 10) && (
        <div className="rounded-md border border-border bg-secondary/50 px-4 py-3 text-[13px]">
          <span className="text-muted-foreground">Gargalo principal (Diagnóstico): </span><span className="text-foreground">{gargalo.titulo}</span>
        </div>
      )}
      {campos.map((c) => (
        <AutoField key={c.key} label={c.label} hint={c.hint} initial={val(c.key)} rows={c.key === "persona" ? 3 : 2}
          onSave={async (v) => { await a.saveDefinicao(etapa, c.key, v); touch(); }} />
      ))}
    </div>
  );
}
