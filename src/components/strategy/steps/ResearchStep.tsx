import { ExternalLink, Plus } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { CATEGORIA_LABEL, FONTES_POR_ETAPA, FONTE_STATUS_LABEL, FONTE_TIPO_LABEL } from "@/lib/strategy";
import type { StepProps } from "../StrategyWorkspace";
import { Block, Empty, btn, btnPrimary, inputCls } from "../ui";
import { useStrategyActions, type Evidencia, type Fonte } from "../useStrategy";
import { EvidenceSheet, draftToRow } from "./EvidenceSheet";

const COPY: Record<number, { fontes: string; evid: string }> = {
  2: { fontes: "Onde investigar a empresa: site, Instagram, Google Business, documentos.", evid: "O que foi observado nas fontes." },
  3: { fontes: "Entrevistas, formulários, avaliações, comentários, WhatsApp, DMs.", evid: "Voz do cliente — classificar é opcional." },
  4: { fontes: "Relatórios, links e pesquisas com fonte verificável.", evid: "Contexto, tendências, oportunidades e ameaças. Nada sem fonte." },
};

export function ResearchStep({ etapa, data, clienteId, touch }: StepProps & { etapa: number }) {
  const a = useStrategyActions(clienteId);
  const fontes = data.fontes.filter((f) => f.etapa === etapa);
  const evid = data.evidencias.filter((e) => e.etapa === etapa);
  const [fonteOpen, setFonteOpen] = useState(false);
  const [editFonte, setEditFonte] = useState<Fonte | null>(null);
  const [evOpen, setEvOpen] = useState(false);
  const [editEv, setEditEv] = useState<Evidencia | null>(null);
  const [presetFonte, setPresetFonte] = useState<string | null>(null);
  const fonteNome = (id: string | null) => data.fontes.find((f) => f.id === id)?.nome;

  return (
    <div className="grid gap-10 xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <Block title="Fontes" description={COPY[etapa].fontes}
        action={<button className={btn} onClick={() => { setEditFonte(null); setFonteOpen(true); }}><Plus size={14} /> Fonte</button>}>
        {fontes.length ? (
          <ul className="divide-y divide-border rounded-lg border border-border bg-card">
            {fontes.map((f) => (
              <li key={f.id} className="flex items-center gap-3 px-4 py-3">
                <button className="min-w-0 flex-1 text-left" onClick={() => { setEditFonte(f); setFonteOpen(true); }}>
                  <div className="truncate text-[13px] font-medium text-foreground">{f.nome}</div>
                  <div className="text-xs text-muted-foreground">{FONTE_TIPO_LABEL[f.tipo] ?? f.tipo} · {FONTE_STATUS_LABEL[f.status] ?? f.status} · {data.evidencias.filter((e) => e.fonte_id === f.id).length} evidência(s)</div>
                </button>
                {f.url && <a href={f.url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground" aria-label="Abrir fonte"><ExternalLink size={14} strokeWidth={1.6} /></a>}
                <button className="text-xs text-muted-foreground hover:text-foreground" onClick={() => { setPresetFonte(f.id); setEditEv(null); setEvOpen(true); }}>+ evidência</button>
              </li>
            ))}
          </ul>
        ) : <Empty>Nenhuma fonte registrada.</Empty>}
      </Block>

      <Block title="Evidências" description={COPY[etapa].evid}
        action={<button className={btnPrimary} onClick={() => { setPresetFonte(null); setEditEv(null); setEvOpen(true); }}><Plus size={14} /> Evidência</button>}>
        {evid.length ? (
          <ul className="divide-y divide-border rounded-lg border border-border bg-card">
            {evid.map((e) => (
              <li key={e.id}>
                <button className="w-full px-4 py-3 text-left hover:bg-accent" onClick={() => { setEditEv(e); setEvOpen(true); }}>
                  <div className="text-[13px] text-foreground">{e.informacao}</div>
                  <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                    {e.categoria && <span>{CATEGORIA_LABEL[e.categoria] ?? e.categoria}</span>}
                    {fonteNome(e.fonte_id) && <span>Fonte: {fonteNome(e.fonte_id)}</span>}
                    {e.origem && <span>{e.origem}</span>}
                    {e.data_ref && <span>{new Date(`${e.data_ref}T00:00:00`).toLocaleDateString("pt-BR")}</span>}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        ) : <Empty>Nenhuma evidência registrada nesta etapa.</Empty>}
      </Block>

      <FonteSheet open={fonteOpen} onOpenChange={setFonteOpen} etapa={etapa} initial={editFonte}
        onSave={async (row) => { if (editFonte) await a.update("estrategia_fontes", editFonte.id, row); else await a.insert("estrategia_fontes", { ...row, etapa }); touch(); }}
        onDelete={editFonte ? () => a.remove("estrategia_fontes", editFonte.id) : undefined} />

      <EvidenceSheet open={evOpen} onOpenChange={setEvOpen} etapa={etapa} fontes={data.fontes} initial={editEv ?? (presetFonte ? { fonte_id: presetFonte, etapa } as Evidencia : null)}
        onSave={async (d) => { if (editEv) await a.update("estrategia_evidencias", editEv.id, draftToRow(d)); else await a.insert("estrategia_evidencias", draftToRow(d)); touch(); }}
        onDelete={editEv ? () => a.remove("estrategia_evidencias", editEv.id) : undefined} />
    </div>
  );
}

function FonteSheet({ open, onOpenChange, etapa, initial, onSave, onDelete }: {
  open: boolean; onOpenChange: (o: boolean) => void; etapa: number; initial: Fonte | null;
  onSave: (r: Record<string, unknown>) => Promise<void>; onDelete?: () => Promise<void>;
}) {
  const tipos = FONTES_POR_ETAPA[etapa] ?? ["outro"];
  const [f, setF] = useState({ nome: "", tipo: tipos[0], url: "", status: "a_analisar", data_ref: "", observacoes: "" });
  const [key, setKey] = useState<string | null>(null);
  const k = `${open}-${initial?.id ?? "new"}`;
  if (open && key !== k) {
    setKey(k);
    setF(initial ? { nome: initial.nome, tipo: initial.tipo, url: initial.url ?? "", status: initial.status, data_ref: initial.data_ref ?? "", observacoes: initial.observacoes ?? "" }
      : { nome: "", tipo: tipos[0], url: "", status: "a_analisar", data_ref: "", observacoes: "" });
  }
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader><SheetTitle>{initial ? "Fonte" : "Nova fonte"}</SheetTitle><SheetDescription>De onde vêm as evidências.</SheetDescription></SheetHeader>
        <div className="space-y-4 px-4 pb-6">
          <label className="block space-y-1.5"><span className="text-[13px] font-medium">Nome</span><input value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} className={inputCls} /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1.5"><span className="text-[13px] font-medium">Tipo</span>
              <select value={f.tipo} onChange={(e) => setF({ ...f, tipo: e.target.value })} className={inputCls}>{tipos.map((t) => <option key={t} value={t}>{FONTE_TIPO_LABEL[t]}</option>)}</select></label>
            <label className="block space-y-1.5"><span className="text-[13px] font-medium">Status</span>
              <select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })} className={inputCls}>{Object.entries(FONTE_STATUS_LABEL).map(([k2, l]) => <option key={k2} value={k2}>{l}</option>)}</select></label>
          </div>
          <label className="block space-y-1.5"><span className="text-[13px] font-medium">URL / arquivo</span><input value={f.url} onChange={(e) => setF({ ...f, url: e.target.value })} className={inputCls} placeholder="https://" /></label>
          <label className="block space-y-1.5"><span className="text-[13px] font-medium">Data</span><input type="date" value={f.data_ref} onChange={(e) => setF({ ...f, data_ref: e.target.value })} className={inputCls} /></label>
          <label className="block space-y-1.5"><span className="text-[13px] font-medium">Observações</span><textarea rows={3} value={f.observacoes} onChange={(e) => setF({ ...f, observacoes: e.target.value })} className={inputCls} /></label>
          <div className="flex items-center justify-between pt-2">
            {onDelete ? <button className="text-[13px] text-destructive hover:underline" onClick={async () => { await onDelete(); onOpenChange(false); }}>Excluir</button> : <span />}
            <button className={btnPrimary} disabled={!f.nome.trim()} onClick={async () => {
              await onSave({ nome: f.nome.trim(), tipo: f.tipo, url: f.url || null, status: f.status, data_ref: f.data_ref || null, observacoes: f.observacoes || null });
              onOpenChange(false);
            }}>Salvar fonte</button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
