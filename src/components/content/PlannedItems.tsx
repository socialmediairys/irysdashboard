import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { StatusBadge } from "@/components/ui/status-badge";
import { btn } from "@/components/strategy/ui";
import { CONTENT_STATUS_LABEL, CONTENT_STATUS_VARIANT, cdb, conteudoFromCalendario, fmtShort, type ContentStatus } from "@/lib/content";

const ym = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

/** Planejamento do mês: itens do Calendário Estratégico e o conteúdo que cada um originou. */
export function PlannedItems({ clienteId }: { clienteId: string }) {
  const qc = useQueryClient();
  const [mes, setMes] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const key = ym(mes);
  const next = ym(new Date(mes.getFullYear(), mes.getMonth() + 1, 1));
  const { data } = useQuery({
    queryKey: ["planejamento", clienteId, key],
    queryFn: async () => {
      const [it, ct] = await Promise.all([
        cdb("calendario_estrategico_itens").select("*").eq("cliente_id", clienteId).gte("data", `${key}-01`).lt("data", `${next}-01`).order("data"),
        cdb("conteudos").select("id,status,calendario_item_id,pipeline_mes").eq("cliente_id", clienteId).eq("pipeline_mes", `${key}-01`),
      ]);
      return { itens: it.data ?? [], conteudos: (ct.data ?? []) as { id: string; status: ContentStatus; calendario_item_id: string | null }[] };
    },
  });
  const byItem = new Map((data?.conteudos ?? []).filter((c) => c.calendario_item_id).map((c) => [c.calendario_item_id!, c]));
  const make = async (i: Parameters<typeof conteudoFromCalendario>[0]) => {
    await conteudoFromCalendario(i, clienteId);
    qc.invalidateQueries({ queryKey: ["planejamento", clienteId] }); qc.invalidateQueries({ queryKey: ["conteudos"] });
  };

  return (
    <section>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Planejado para o mês</h2>
          <p className="mt-0.5 text-[13px] text-muted-foreground">Itens do Calendário Estratégico. Cada um pode virar um conteúdo. {data ? `${data.conteudos.length} conteúdo(s) no mês.` : ""}</p>
        </div>
        <div className="flex items-center gap-2">
          <button className={btn} onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() - 1, 1))} aria-label="Mês anterior"><ChevronLeft size={14} /></button>
          <span className="w-32 text-center text-[13px] font-medium capitalize">{mes.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</span>
          <button className={btn} onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() + 1, 1))} aria-label="Próximo mês"><ChevronRight size={14} /></button>
        </div>
      </div>
      <div className="divide-y divide-border rounded-lg border border-border bg-card">
        {data?.itens.length ? data.itens.map((i: Parameters<typeof conteudoFromCalendario>[0]) => {
          const c = byItem.get(i.id);
          return (
            <div key={i.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
              <span className="w-16 text-[13px] text-muted-foreground">{fmtShort(i.data)}</span>
              <span className="min-w-0 flex-1 truncate text-sm text-foreground">{i.titulo || "Item planejado"}</span>
              <span className="text-[13px] text-muted-foreground">{[i.canal, i.formato].filter(Boolean).join(" · ")}</span>
              {c ? <StatusBadge variant={CONTENT_STATUS_VARIANT[c.status]}>{CONTENT_STATUS_LABEL[c.status]}</StatusBadge>
                : <button className={btn} onClick={() => make(i)}>Transformar em conteúdo</button>}
            </div>
          );
        }) : <div className="px-5 py-8 text-center text-sm text-muted-foreground">Nenhum item no Calendário Estratégico deste mês.</div>}
      </div>
    </section>
  );
}
