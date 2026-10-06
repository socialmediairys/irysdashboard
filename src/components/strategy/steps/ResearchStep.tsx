import { ExternalLink, Plus } from "lucide-react";
import { useRef, useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { FONTES_POR_ETAPA, FONTE_STATUS_LABEL, FONTE_TIPO_LABEL } from "@/lib/strategy";
import type { StepProps } from "../StrategyWorkspace";
import { Block, Empty, btn, btnPrimary, inputCls } from "../ui";
import { useStrategyActions, type Evidencia, type Fonte } from "../useStrategy";
import { EvidenceSheet, draftToRow } from "./EvidenceSheet";
import { EvidenceRow, fmtDate } from "./EvidenceRow";

const COPY: Record<number, { fontes: string; evid: string }> = {
  2: { fontes: "De onde vem a informação: site, Instagram, Google Business, documentos.", evid: "O que aprendemos com essas fontes." },
  3: { fontes: "Entrevistas, formulários, avaliações, comentários, WhatsApp, DMs.", evid: "A voz do cliente, com as palavras dele." },
  4: { fontes: "Relatórios, links e pesquisas com fonte verificável.", evid: "Contexto, tendências, oportunidades e ameaças. Nada sem fonte." },
};

const host = (u: string | null) => { if (!u) return null; try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return u.slice(0, 40); } };

export function ResearchStep({ etapa, data, clienteId, touch }: StepProps & { etapa: number }) {
  const a = useStrategyActions(clienteId);
  const fontes = data.fontes.filter((f) => f.etapa === etapa);
  const evid = data.evidencias.filter((e) => e.etapa === etapa);
  const [fonteOpen, setFonteOpen] = useState(false);
  const [editFonte, setEditFonte] = useState<Fonte | null>(null);
  const [evOpen, setEvOpen] = useState(false);
  const [editEv, setEditEv] = useState<Evidencia | null>(null);
  const [presetFonte, setPresetFonte] = useState<string | null>(null);
  const nEv = (id: string) => data.evidencias.filter((e) => e.fonte_id === id).length;
  const newEv = (fonteId: string | null) => { setPresetFonte(fonteId); setEditEv(null); setEvOpen(true); };

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
                  <div className="text-xs text-muted-foreground">
                    {[FONTE_TIPO_LABEL[f.tipo] ?? f.tipo, host(f.url), fmtDate(f.data_ref), `${nEv(f.id)} evidência(s)`].filter(Boolean).join(" · ")}
                  </div>
                </button>
                {f.url && /^https?:/.test(f.url) && <a href={f.url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground" aria-label="Abrir fonte"><ExternalLink size={14} strokeWidth={1.6} /></a>}
              </li>
            ))}
          </ul>
        ) : <Empty>Nenhuma fonte registrada.</Empty>}
      </Block>

      <Block title="Evidências" description={COPY[etapa].evid}
        action={<button className={btnPrimary} onClick={() => newEv(null)}><Plus size={14} /> Evidência</button>}>
        {evid.length ? (
          <div className="divide-y divide-border rounded-lg border border-border bg-card">
            {evid.map((e) => <EvidenceRow key={e.id} e={e} fontes={data.fontes} onOpen={() => { setEditEv(e); setEvOpen(true); }} />)}
          </div>
        ) : <Empty>Nenhuma evidência registrada nesta etapa.</Empty>}
      </Block>

      <FonteSheet open={fonteOpen} onOpenChange={setFonteOpen} etapa={etapa} initial={editFonte}
        evidencias={editFonte ? data.evidencias.filter((e) => e.fonte_id === editFonte.id) : []} fontes={data.fontes}
        onAddEvidence={() => { if (editFonte) { setFonteOpen(false); newEv(editFonte.id); } }}
        onOpenEvidence={(e) => { setFonteOpen(false); setEditEv(e); setEvOpen(true); }}
        onSave={async (row, isNew) => { if (isNew) await a.insert("estrategia_fontes", { ...row, etapa }); else await a.update("estrategia_fontes", editFonte!.id, row); touch(); }}
        onDelete={editFonte ? () => a.remove("estrategia_fontes", editFonte.id) : undefined} />

      <EvidenceSheet open={evOpen} onOpenChange={setEvOpen} etapa={etapa} fontes={data.fontes} initial={editEv} presetFonte={presetFonte}
        onSave={async (d, isNew) => { if (isNew) await a.insert("estrategia_evidencias", { id: d.id, ...draftToRow(d) }); else await a.update("estrategia_evidencias", d.id, draftToRow(d)); touch(); }}
        onDelete={editEv ? () => a.remove("estrategia_evidencias", editEv.id) : undefined} />
    </div>
  );
}

function FonteSheet({ open, onOpenChange, etapa, initial, evidencias, fontes, onAddEvidence, onOpenEvidence, onSave, onDelete }: {
  open: boolean; onOpenChange: (o: boolean) => void; etapa: number; initial: Fonte | null; evidencias: Evidencia[]; fontes: Fonte[];
  onAddEvidence: () => void; onOpenEvidence: (e: Evidencia) => void;
  onSave: (r: Record<string, unknown>, isNew: boolean) => Promise<void>; onDelete?: () => Promise<void>;
}) {
  const tipos = FONTES_POR_ETAPA[etapa] ?? ["outro"];
  const empty = () => ({ id: crypto.randomUUID() as string, nome: "", tipo: tipos[0], url: "", status: "a_analisar", data_ref: "", observacoes: "" });
  const [f, setF] = useState(empty);
  const [key, setKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const k = `${open}-${initial?.id ?? "new"}`;
  if (open && key !== k) {
    setKey(k); lock.current = false;
    setF(initial ? { id: initial.id, nome: initial.nome, tipo: initial.tipo, url: initial.url ?? "", status: initial.status, data_ref: initial.data_ref ?? "", observacoes: initial.observacoes ?? "" } : empty());
  }
  if (!open && key !== null) setKey(null);
  const save = async () => {
    if (lock.current) return;
    lock.current = true; setBusy(true);
    try {
      const row = { nome: f.nome.trim(), tipo: f.tipo, url: f.url || null, status: f.status, data_ref: f.data_ref || null, observacoes: f.observacoes || null };
      await onSave(initial ? row : { id: f.id, ...row }, !initial);
      onOpenChange(false);
    } catch { lock.current = false; } finally { setBusy(false); }
  };
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader><SheetTitle>{initial ? initial.nome : "Nova fonte"}</SheetTitle><SheetDescription>Fonte é de onde veio a informação.</SheetDescription></SheetHeader>
        <div className="space-y-4 px-4 pb-6">
          <label className="block space-y-1.5"><span className="text-[13px] font-medium">Nome</span><input value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} className={inputCls} /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1.5"><span className="text-[13px] font-medium">Tipo</span>
              <select value={f.tipo} onChange={(e) => setF({ ...f, tipo: e.target.value })} className={inputCls}>{[...new Set([...tipos, f.tipo])].map((t) => <option key={t} value={t}>{FONTE_TIPO_LABEL[t] ?? t}</option>)}</select></label>
            <label className="block space-y-1.5"><span className="text-[13px] font-medium">Status</span>
              <select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })} className={inputCls}>{Object.entries(FONTE_STATUS_LABEL).map(([k2, l]) => <option key={k2} value={k2}>{l}</option>)}</select></label>
          </div>
          <label className="block space-y-1.5"><span className="text-[13px] font-medium">Origem (URL / arquivo)</span><input value={f.url} onChange={(e) => setF({ ...f, url: e.target.value })} className={inputCls} placeholder="https://" /></label>
          <label className="block space-y-1.5"><span className="text-[13px] font-medium">Data</span><input type="date" value={f.data_ref} onChange={(e) => setF({ ...f, data_ref: e.target.value })} className={inputCls} /></label>
          <label className="block space-y-1.5"><span className="text-[13px] font-medium">Observações</span><textarea rows={3} value={f.observacoes} onChange={(e) => setF({ ...f, observacoes: e.target.value })} className={inputCls} /></label>
          <div className="flex items-center justify-between pt-2">
            {onDelete ? <button className="text-[13px] text-destructive hover:underline" onClick={async () => { await onDelete(); onOpenChange(false); }}>Excluir</button> : <span />}
            <button className={btnPrimary} disabled={!f.nome.trim() || busy} onClick={save}>Salvar fonte</button>
          </div>

          {initial && (
            <div className="border-t border-border pt-5">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[13px] font-medium">Evidências desta fonte ({evidencias.length})</span>
                <button className={btn} onClick={onAddEvidence}><Plus size={13} /> Evidência</button>
              </div>
              {evidencias.length ? (
                <div className="divide-y divide-border rounded-lg border border-border">
                  {evidencias.map((e) => <EvidenceRow key={e.id} e={e} fontes={fontes} onOpen={() => onOpenEvidence(e)} className="px-3" />)}
                </div>
              ) : <p className="text-[13px] text-muted-foreground">Nenhuma evidência extraída desta fonte ainda.</p>}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
