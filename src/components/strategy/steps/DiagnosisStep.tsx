import { Link2, Plus } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { StatusBadge } from "@/components/ui/status-badge";
import { cn } from "@/lib/utils";
import { ACHADO_LABEL, type AchadoTipo } from "@/lib/strategy";
import type { StepProps } from "../StrategyWorkspace";
import { Block, Empty, btn, btnPrimary, inputCls } from "../ui";
import { useStrategyActions, type Achado } from "../useStrategy";

const GROUPS: { title: string; tipos: AchadoTipo[]; desc: string }[] = [
  { title: "Leitura das evidências", tipos: ["padrao", "tensao", "problema", "oportunidade"], desc: "O que as evidências mostram." },
  { title: "Hipóteses", tipos: ["hipotese"], desc: "Interpretações ainda não validadas." },
  { title: "Gargalo", tipos: ["gargalo_principal", "gargalo_secundario"], desc: "O que mais trava o crescimento hoje." },
  { title: "Decisões", tipos: ["decisao"], desc: "Definições assumidas pelo estrategista." },
];
const STATUS: Record<string, { label: string; v: "neutral" | "success" | "danger" | "info" }> = {
  aberto: { label: "Aberto", v: "neutral" }, validado: { label: "Validado", v: "info" }, descartado: { label: "Descartado", v: "danger" }, aprovado: { label: "Aprovado", v: "success" },
};

export function DiagnosisStep({ data, clienteId, touch }: StepProps) {
  const a = useStrategyActions(clienteId);
  const [sel, setSel] = useState<Achado | null>(null);
  const [newTipo, setNewTipo] = useState<AchadoTipo | null>(null);
  const [titulo, setTitulo] = useState("");
  const count = (id: string) => data.links.filter((l) => l.achado_id === id).length;

  const create = async () => {
    if (!newTipo || !titulo.trim()) return;
    await a.insert("estrategia_achados", { etapa: 7, tipo: newTipo, titulo: titulo.trim(), status: newTipo === "decisao" ? "aprovado" : "aberto" });
    setTitulo(""); setNewTipo(null); touch();
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <Legend cls="border-border bg-card" label="Evidência — observada" />
        <Legend cls="border-dashed border-border bg-card" label="Hipótese — não validada" />
        <Legend cls="border-foreground/60 bg-card" label="Decisão — assumida" />
      </div>
      {GROUPS.map((g) => {
        const items = data.achados.filter((x) => g.tipos.includes(x.tipo));
        return (
          <Block key={g.title} title={g.title} description={g.desc}
            action={<div className="flex flex-wrap gap-1">{g.tipos.map((t) => <button key={t} className={btn} onClick={() => { setNewTipo(t); setTitulo(""); }}><Plus size={13} /> {ACHADO_LABEL[t]}</button>)}</div>}>
            {newTipo && g.tipos.includes(newTipo) && (
              <div className="mb-3 flex gap-2">
                <input autoFocus value={titulo} onChange={(e) => setTitulo(e.target.value)} onKeyDown={(e) => e.key === "Enter" && create()} placeholder={`${ACHADO_LABEL[newTipo]}…`} className={`${inputCls} h-8 py-1`} />
                <button className={btnPrimary} onClick={create} disabled={!titulo.trim()}>Adicionar</button>
                <button className={btn} onClick={() => setNewTipo(null)}>Cancelar</button>
              </div>
            )}
            {items.length ? (
              <ul className="space-y-2">
                {items.map((x) => (
                  <li key={x.id}>
                    <button onClick={() => setSel(x)}
                      className={cn("flex w-full items-center gap-3 rounded-lg border bg-card px-4 py-3 text-left hover:bg-accent",
                        x.tipo === "hipotese" ? "border-dashed border-border" : x.tipo === "decisao" ? "border-foreground/60" : "border-border",
                        x.status === "descartado" && "opacity-60")}>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs text-muted-foreground">{ACHADO_LABEL[x.tipo]}{x.origem === "ia" && " · sugerido pela IA"}</div>
                        <div className="text-[13px] font-medium text-foreground">{x.titulo}</div>
                      </div>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground"><Link2 size={12} strokeWidth={1.6} /> {count(x.id)}</span>
                      <StatusBadge variant={STATUS[x.status]?.v ?? "neutral"}>{STATUS[x.status]?.label ?? x.status}</StatusBadge>
                    </button>
                  </li>
                ))}
              </ul>
            ) : <Empty>Nada registrado.</Empty>}
          </Block>
        );
      })}

      <AchadoSheet achado={sel ? data.achados.find((x) => x.id === sel.id) ?? null : null} onClose={() => setSel(null)} data={data} clienteId={clienteId} />
    </div>
  );
}

function Legend({ cls, label }: { cls: string; label: string }) {
  return <span className="inline-flex items-center gap-1.5"><span className={cn("h-3 w-5 rounded border", cls)} />{label}</span>;
}

function AchadoSheet({ achado, onClose, data, clienteId }: { achado: Achado | null; onClose: () => void } & Pick<StepProps, "data" | "clienteId">) {
  const a = useStrategyActions(clienteId);
  const [desc, setDesc] = useState<string | null>(null);
  const linked = new Set(data.links.filter((l) => l.achado_id === achado?.id).map((l) => l.evidencia_id));
  const origem = achado?.deriva_de ? data.achados.find((x) => x.id === achado.deriva_de) : null;

  return (
    <Sheet open={!!achado} onOpenChange={(o) => { if (!o) { setDesc(null); onClose(); } }}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        {achado && (
          <>
            <SheetHeader>
              <SheetTitle>{achado.titulo}</SheetTitle>
              <SheetDescription>{ACHADO_LABEL[achado.tipo]}{origem && ` · deriva de: ${origem.titulo}`}</SheetDescription>
            </SheetHeader>
            <div className="space-y-6 px-4 pb-6">
              <label className="block space-y-1.5"><span className="text-[13px] font-medium">Descrição</span>
                <textarea rows={3} value={desc ?? achado.descricao ?? ""} onChange={(e) => setDesc(e.target.value)}
                  onBlur={() => desc !== null && a.update("estrategia_achados", achado.id, { descricao: desc || null })} className={inputCls} />
              </label>
              <div className="flex flex-wrap gap-2">
                {achado.tipo === "hipotese" && <>
                  <button className={btn} onClick={() => a.update("estrategia_achados", achado.id, { status: "validado" })}>Marcar como validada</button>
                  <button className={btn} onClick={() => a.update("estrategia_achados", achado.id, { status: "descartado" })}>Descartar</button>
                </>}
                {achado.tipo !== "decisao" && (
                  <button className={btnPrimary} onClick={async () => {
                    await a.insert("estrategia_achados", { etapa: 7, tipo: "decisao", titulo: achado.titulo, status: "aprovado", deriva_de: achado.id });
                    for (const id of linked) await a.link("__pending__", id, false).catch(() => {});
                  }}>Transformar em decisão</button>
                )}
                <button className="text-[13px] text-destructive hover:underline" onClick={async () => { await a.remove("estrategia_achados", achado.id); onClose(); }}>Excluir</button>
              </div>
              <div>
                <div className="mb-2 text-[13px] font-medium">Evidências que sustentam ({linked.size})</div>
                {data.evidencias.length ? (
                  <ul className="divide-y divide-border rounded-lg border border-border">
                    {data.evidencias.map((e) => (
                      <li key={e.id}>
                        <label className="flex cursor-pointer items-start gap-3 px-3 py-2.5 hover:bg-accent">
                          <input type="checkbox" className="mt-0.5" checked={linked.has(e.id)} onChange={(ev) => a.link(achado.id, e.id, ev.target.checked)} />
                          <span className="text-[13px] text-foreground">{e.informacao}{e.etapa && <span className="text-muted-foreground"> · etapa {e.etapa}</span>}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                ) : <p className="text-[13px] text-muted-foreground">Registre evidências na Pesquisa para vinculá-las aqui.</p>}
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
