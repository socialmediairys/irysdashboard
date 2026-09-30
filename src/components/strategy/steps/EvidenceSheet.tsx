import { useEffect, useRef, useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { CATEGORIA_LABEL, CATEGORIA_PADRAO_ETAPA, EVIDENCIA_CATEGORIAS, STEPS } from "@/lib/strategy";
import { btn, btnPrimary, inputCls } from "../ui";
import type { Evidencia, Fonte } from "../useStrategy";

export type EvidenceDraft = { id: string; informacao: string; etapa: number | null; fonte_id: string | null; categoria: string | null; origem: string; data_ref: string; observacao: string };

/**
 * Drawer para registrar/editar evidência.
 * Anti-duplicação: cada abertura gera um id próprio (upsert idempotente) e um trava-envio síncrono,
 * então clique duplo ou reenvio nunca criam dois registros.
 */
export function EvidenceSheet({ open, onOpenChange, etapa, fontes, initial, presetFonte, onSave, onDelete }: {
  open: boolean; onOpenChange: (o: boolean) => void; etapa: number | null; fontes: Fonte[];
  initial?: Evidencia | null; presetFonte?: string | null; onSave: (d: EvidenceDraft, isNew: boolean) => Promise<void>; onDelete?: () => Promise<void>;
}) {
  const blank = (): EvidenceDraft => ({ id: crypto.randomUUID(), informacao: "", etapa, fonte_id: presetFonte ?? null, categoria: etapa ? CATEGORIA_PADRAO_ETAPA[etapa] ?? null : null, origem: "", data_ref: "", observacao: "" });
  const [d, setD] = useState<EvidenceDraft>(blank);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  useEffect(() => {
    if (!open) return;
    lock.current = false;
    setD(initial ? {
      id: initial.id, informacao: initial.informacao, etapa: initial.etapa, fonte_id: initial.fonte_id, categoria: initial.categoria,
      origem: initial.origem ?? "", data_ref: initial.data_ref ?? "", observacao: initial.observacao ?? "",
    } : blank());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial?.id, presetFonte]);

  const legacy = d.categoria && !EVIDENCIA_CATEGORIAS.some((c) => c.key === d.categoria) ? d.categoria : null;
  const save = async () => {
    if (lock.current) return;
    lock.current = true; setBusy(true);
    try { await onSave(d, !initial); onOpenChange(false); } catch { lock.current = false; } finally { setBusy(false); }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{initial ? "Evidência" : "Nova evidência"}</SheetTitle>
          <SheetDescription>O que aprendemos com uma fonte. Preserve a origem.</SheetDescription>
        </SheetHeader>
        <div className="space-y-4 px-4 pb-6">
          <label className="block space-y-1.5"><span className="text-[13px] font-medium">Conteúdo</span>
            <textarea rows={4} value={d.informacao} onChange={(e) => setD({ ...d, informacao: e.target.value })} className={inputCls} placeholder="Ex.: “Demorei para marcar porque não sabia o preço” — cliente em avaliação" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1.5"><span className="text-[13px] font-medium">Categoria</span>
              <select aria-label="Categoria" value={d.categoria ?? ""} onChange={(e) => setD({ ...d, categoria: e.target.value || null })} className={inputCls}>
                <option value="">Sem categoria</option>
                {EVIDENCIA_CATEGORIAS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
                {legacy && <option value={legacy}>{CATEGORIA_LABEL[legacy] ?? legacy} (anterior)</option>}
              </select>
            </label>
            <label className="block space-y-1.5"><span className="text-[13px] font-medium">Etapa de origem</span>
              <select value={d.etapa ?? ""} onChange={(e) => setD({ ...d, etapa: e.target.value ? Number(e.target.value) : null })} className={inputCls}>
                <option value="">—</option>
                {STEPS.slice(0, 7).map((s) => <option key={s.n} value={s.n}>{s.n}. {s.titulo}</option>)}
              </select>
            </label>
          </div>
          <label className="block space-y-1.5"><span className="text-[13px] font-medium">Fonte</span>
            <select aria-label="Fonte" value={d.fonte_id ?? ""} onChange={(e) => setD({ ...d, fonte_id: e.target.value || null })} className={inputCls}>
              <option value="">Sem fonte cadastrada</option>
              {fontes.map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-1.5"><span className="text-[13px] font-medium">Origem</span>
              <input value={d.origem} onChange={(e) => setD({ ...d, origem: e.target.value })} className={inputCls} placeholder="Quem / onde" />
            </label>
            <label className="block space-y-1.5"><span className="text-[13px] font-medium">Data</span>
              <input type="date" value={d.data_ref} onChange={(e) => setD({ ...d, data_ref: e.target.value })} className={inputCls} />
            </label>
          </div>
          <label className="block space-y-1.5"><span className="text-[13px] font-medium">Observação</span>
            <textarea rows={2} value={d.observacao} onChange={(e) => setD({ ...d, observacao: e.target.value })} className={inputCls} />
          </label>
          <div className="flex items-center justify-between pt-2">
            {onDelete ? <button className="text-[13px] text-destructive hover:underline" onClick={async () => { await onDelete(); onOpenChange(false); }}>Excluir</button> : <span />}
            <div className="flex gap-2">
              <button className={btn} onClick={() => onOpenChange(false)}>Cancelar</button>
              <button className={btnPrimary} disabled={!d.informacao.trim() || busy} onClick={save}>Salvar evidência</button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export const draftToRow = (d: EvidenceDraft) => ({
  informacao: d.informacao.trim(), etapa: d.etapa, fonte_id: d.fonte_id, categoria: d.categoria,
  origem: d.origem || null, data_ref: d.data_ref || null, observacao: d.observacao || null,
});
