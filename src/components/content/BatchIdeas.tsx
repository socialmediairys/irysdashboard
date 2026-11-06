import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { ideaEligible, useContentActions, type Conteudo } from "@/lib/content";
import { toast } from "sonner";

type Result = { id: string; ok: boolean; motivo?: string; versao?: number };
export function BatchIdeas({ items, scope }: { items: Conteudo[]; scope: string }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const attempt = useRef<{ key: string; items: { id: string; versao: number }[] } | null>(null);
  const a = useContentActions();
  useEffect(() => { setSelected([]); setResults([]); attempt.current = null; }, [scope]);
  const eligible = items.filter(ideaEligible);
  const chosen = items.filter((c) => selected.includes(c.id) && ideaEligible(c));
  const run = async () => {
    if (busy) return;
    attempt.current ??= { key: crypto.randomUUID(), items: chosen.map((c) => ({ id: c.id, versao: c.ideia_versao_atual })) };
    setBusy(true);
    try {
      const { data, error } = await supabase.rpc("enviar_ideias_lote", { _itens: attempt.current.items, _chave: attempt.current.key });
      if (error) throw error;
      setResults(data as unknown as Result[]); setSelected([]); attempt.current = null; setConfirm(false); a.refresh();
    } catch { toast.error("Não foi possível confirmar o envio. Tente novamente: a tentativa não duplicará versões."); }
    finally { setBusy(false); }
  };
  return <section className="space-y-3 border-y border-border py-3" aria-label="Envio de ideias em lote">
    <div className="flex flex-wrap items-center gap-2"><span className="mr-auto text-sm text-muted-foreground">{chosen.length} selecionadas</span><Button size="sm" variant="outline" disabled={busy || !eligible.length} onClick={() => { attempt.current = null; setSelected(eligible.slice(0, 100).map((c) => c.id)); }}>Selecionar todas as elegíveis</Button><Button size="sm" disabled={busy || (!chosen.length && !attempt.current)} onClick={() => setConfirm(true)}><Send /> Enviar ideias</Button></div>
    <div className="max-h-56 overflow-y-auto divide-y divide-border">{items.map((c) => <label key={c.id} className="flex items-center gap-3 py-2 text-sm"><Checkbox aria-label={`Selecionar ${c.titulo || "Sem título"}`} checked={selected.includes(c.id)} disabled={busy || !ideaEligible(c)} onCheckedChange={(checked) => { attempt.current = null; setSelected((old) => checked ? [...old, c.id].slice(0, 100) : old.filter((id) => id !== c.id)); }} /><span className="min-w-0 flex-1 truncate">{c.titulo || "Sem título"}</span>{!ideaEligible(c) && <span className="text-xs text-muted-foreground">{c.status_ideia === "aguardando" ? "Já enviada" : c.status_ideia === "aprovada" ? "Aprovada" : "Incompleta"}</span>}</label>)}</div>
    {!!results.length && <div role="status" className="text-sm"><p>{results.filter((r) => r.ok).length} enviadas · {results.filter((r) => !r.ok).length} não enviadas</p>{results.filter((r) => !r.ok).map((r) => <p key={r.id} className="text-muted-foreground">{items.find((c) => c.id === r.id)?.titulo}: {r.motivo}</p>)}</div>}
    <AlertDialog open={confirm} onOpenChange={(open) => !busy && setConfirm(open)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Enviar {attempt.current?.items.length ?? chosen.length} ideias?</AlertDialogTitle><AlertDialogDescription>Cada ideia terá sua própria versão e será avaliada individualmente. Um erro não impede o envio das demais.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={busy}>Cancelar</AlertDialogCancel><AlertDialogAction disabled={busy} onClick={(e) => { e.preventDefault(); void run(); }}>{busy ? "Enviando…" : "Confirmar envio"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </section>;
}