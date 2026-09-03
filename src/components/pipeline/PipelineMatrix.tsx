import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  ETAPA_LABEL,
  PIPELINE_ETAPAS,
  PIPELINE_STATUS,
  STATUS_LABEL,
  STATUS_STYLE,
  currentMes,
  mesLabel,
  type PipelineEtapa,
  type PipelineStatusRow,
  type PipelineStatusValor,
} from "@/lib/pipeline";

type ClienteMin = { id: string; nome: string; org_id: string | null };

function nextStatus(s: PipelineStatusValor): PipelineStatusValor {
  const i = PIPELINE_STATUS.indexOf(s);
  return PIPELINE_STATUS[(i + 1) % PIPELINE_STATUS.length]!;
}

/**
 * Matriz cliente × etapa do mês atual. Clique na célula avança o status
 * (não iniciado → em andamento → concluído → travado).
 */
export function PipelineMatrix({ highlightClienteId }: { highlightClienteId?: string }) {
  const mes = currentMes();
  const [clientes, setClientes] = useState<ClienteMin[]>([]);
  const [rows, setRows] = useState<PipelineStatusRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [cli, pipe] = await Promise.all([
      supabase.from("clientes").select("id, nome, org_id").order("nome"),
      supabase.from("pipeline_status").select("id, cliente_id, mes, etapa, status").eq("mes", mes),
    ]);
    if (cli.error) toast.error(cli.error.message);
    if (pipe.error) toast.error(pipe.error.message);
    setClientes((cli.data ?? []) as ClienteMin[]);
    setRows((pipe.data ?? []) as PipelineStatusRow[]);
    setLoading(false);
  }, [mes]);

  useEffect(() => {
    void load();
  }, [load]);

  const byKey = useMemo(() => {
    const map = new Map<string, PipelineStatusRow>();
    for (const r of rows) map.set(`${r.cliente_id}:${r.etapa}`, r);
    return map;
  }, [rows]);

  const toggle = async (cliente: ClienteMin, etapa: PipelineEtapa) => {
    const key = `${cliente.id}:${etapa}`;
    const existing = byKey.get(key);
    const status = nextStatus(existing?.status ?? "nao_iniciado");
    setBusy(key);
    if (existing) {
      const { error } = await supabase
        .from("pipeline_status")
        .update({ status })
        .eq("id", existing.id);
      if (error) toast.error(error.message);
      else setRows((prev) => prev.map((r) => (r.id === existing.id ? { ...r, status } : r)));
    } else {
      const { data, error } = await supabase
        .from("pipeline_status")
        .insert({ cliente_id: cliente.id, org_id: cliente.org_id!, mes, etapa, status })
        .select("id, cliente_id, mes, etapa, status")
        .single();
      if (error) toast.error(error.message);
      else setRows((prev) => [...prev, data as PipelineStatusRow]);
    }
    setBusy(null);
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.6} /> Carregando pipeline…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Mês de referência: <span className="font-semibold text-foreground">{mesLabel(mes)}</span>. Clique
          em uma célula para avançar o status.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {PIPELINE_STATUS.map((s) => (
            <span
              key={s}
              className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
              style={{
                background: STATUS_STYLE[s].bg,
                color: STATUS_STYLE[s].fg,
                border: `1px solid ${STATUS_STYLE[s].border}`,
              }}
            >
              {STATUS_LABEL[s]}
            </span>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-[12px] border border-border bg-card">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr>
              <th className="p-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Cliente
              </th>
              {PIPELINE_ETAPAS.map((e) => (
                <th
                  key={e}
                  className="p-3 text-left text-[11px] font-bold uppercase tracking-wider text-muted-foreground"
                >
                  {ETAPA_LABEL[e]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {clientes.map((c) => (
              <tr
                key={c.id}
                className="border-t border-border"
                style={
                  c.id === highlightClienteId
                    ? { background: "var(--muted)" }
                    : undefined
                }
              >
                <td className="p-3 font-semibold">{c.nome}</td>
                {PIPELINE_ETAPAS.map((e) => {
                  const key = `${c.id}:${e}`;
                  const status = byKey.get(key)?.status ?? "nao_iniciado";
                  const st = STATUS_STYLE[status];
                  return (
                    <td key={e} className="p-2">
                      <button
                        type="button"
                        onClick={() => void toggle(c, e)}
                        disabled={busy === key}
                        aria-label={`${c.nome} — ${ETAPA_LABEL[e]}: ${STATUS_LABEL[status]}`}
                        className="w-full rounded-[8px] px-2 py-2 text-xs font-semibold transition-opacity hover:opacity-80 disabled:opacity-50"
                        style={{ background: st.bg, color: st.fg, border: `1px solid ${st.border}` }}
                      >
                        {STATUS_LABEL[status]}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
            {clientes.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-sm text-muted-foreground">
                  Nenhum cliente cadastrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
