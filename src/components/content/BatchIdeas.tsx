import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { canSendProduction, ideaEligible, producaoFaltando, useContentActions, type Conteudo } from "@/lib/content";
import { toast } from "sonner";

type Result = { id: string; ok: boolean; motivo?: string; versao?: number };
type Etapa = "ideias" | "producao";
const LIMITE = 100;

/** A mesma regra do envio unitário, com validação dos materiais antes de disponibilizar a seleção. */
function motivoProducao(c: Conteudo): string | null {
  const statusPermitido = ["planejado", "em_producao", "revisao_interna", "alteracao_solicitada"].includes(c.status);
  if (!statusPermitido) return c.status === "com_cliente" ? "Já enviada" : "Fora da etapa de produção";
  const jaEnviado = !!c.enviado_cliente_em || ["alteracao_solicitada", "aprovado", "agendado", "publicado"].includes(c.status);
  if (!canSendProduction(c.status_ideia, jaEnviado, !!c.ideia_reaberta_em)) return "Aguardando aprovação da ideia";
  return producaoFaltando(c.formato, c.legenda, c.midias ?? []);
}

export function BatchIdeas({ items, scope }: { items: Conteudo[]; scope: string }) {
  const [etapa, setEtapa] = useState<Etapa>("ideias");
  const [selected, setSelected] = useState<string[]>([]);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const attempt = useRef<{ key: string; items: { id: string; versao: number }[] } | null>(null);
  const a = useContentActions();

  useEffect(() => { setSelected([]); setResults([]); attempt.current = null; }, [scope, etapa]);
  const canSelect = (c: Conteudo) => etapa === "ideias" ? ideaEligible(c) : motivoProducao(c) === null;
  const eligible = items.filter(canSelect);
  const chosen = items.filter((c) => selected.includes(c.id) && canSelect(c));
  const reason = (c: Conteudo) => etapa === "ideias"
    ? (c.status_ideia === "aguardando" ? "Já enviada" : c.status_ideia === "aprovada" ? "Ideia aprovada" : "Ideia incompleta")
    : motivoProducao(c);

  const run = async () => {
    if (busy) return;
    if (etapa === "ideias") {
      attempt.current ??= { key: crypto.randomUUID(), items: chosen.map((c) => ({ id: c.id, versao: c.ideia_versao_atual })) };
    }
    setBusy(true);
    try {
      let outcome: Result[] = [];
      if (etapa === "ideias") {
        // RPC existente: garante idempotência e histórico de versões para cada ideia.
        const { data, error } = await supabase.rpc("enviar_ideias_lote", { _itens: attempt.current!.items, _chave: attempt.current!.key });
        if (error) throw error;
        outcome = data as unknown as Result[];
        attempt.current = null;
      } else {
        // A trigger existente no Supabase valida as mídias, cria a versão e registra o evento.
        // Atualizar cada conteúdo individualmente preserva erros e resultados por item.
        for (const c of chosen) {
          const { data, error } = await supabase.from("conteudos").update({ status: "com_cliente" }).eq("id", c.id).eq("status", c.status).select("id");
          outcome.push({ id: c.id, ok: !error && !!data?.length, motivo: error?.message ?? (!data?.length ? "Status alterado. Atualize a página e tente novamente." : undefined) });
        }
      }
      setResults(outcome);
      setSelected(outcome.filter((r) => !r.ok).map((r) => r.id));
      setConfirm(false);
      a.refresh();
      const ok = outcome.filter((r) => r.ok).length;
      if (ok) toast.success(`${ok} ${etapa === "ideias" ? "ideia(s) enviada(s)" : "produção(ões) enviada(s)"} ao cliente.`);
      if (outcome.some((r) => !r.ok)) toast.warning("Alguns conteúdos não foram enviados. Veja os motivos abaixo.");
    } catch (error) {
      console.error(error);
      toast.error("Não foi possível confirmar o envio. Tente novamente.");
    } finally { setBusy(false); }
  };

  return <section className="space-y-3 border-y border-border py-3" aria-label="Envio de conteúdos em lote">
    <div className="flex flex-wrap gap-2" role="group" aria-label="Etapa do envio">
      <Button size="sm" variant={etapa === "ideias" ? "default" : "outline"} disabled={busy} onClick={() => setEtapa("ideias")}>1. Enviar ideias</Button>
      <Button size="sm" variant={etapa === "producao" ? "default" : "outline"} disabled={busy} onClick={() => setEtapa("producao")}>2. Enviar arte e legenda</Button>
    </div>
    <p className="text-xs text-muted-foreground">{etapa === "ideias" ? "Selecione as ideias para a primeira aprovação do cliente." : "Selecione conteúdos com ideia aprovada, arte e legenda concluídas para a aprovação final."}</p>
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-auto text-sm text-muted-foreground">{chosen.length} selecionada(s) · {eligible.length} elegível(is)</span>
      <Button size="sm" variant="outline" disabled={busy || !eligible.length} onClick={() => { attempt.current = null; setSelected(eligible.slice(0, LIMITE).map((c) => c.id)); }}>Selecionar todas as elegíveis</Button>
      <Button size="sm" disabled={busy || (!chosen.length && !(etapa === "ideias" && attempt.current))} onClick={() => setConfirm(true)}><Send className="mr-1 h-4 w-4" />{etapa === "ideias" ? "Enviar ideias" : "Enviar arte e legenda"}</Button>
    </div>
    <div className="max-h-56 overflow-y-auto divide-y divide-border">{items.map((c) => <label key={c.id} className="flex items-center gap-3 py-2 text-sm">
      <Checkbox aria-label={`Selecionar ${c.titulo || "Sem título"}`} checked={selected.includes(c.id)} disabled={busy || !canSelect(c)} onCheckedChange={(checked) => { attempt.current = null; setSelected((old) => checked ? [...old, c.id].slice(0, LIMITE) : old.filter((id) => id !== c.id)); }} />
      <span className="min-w-0 flex-1 truncate">{c.titulo || "Sem título"}</span>
      {!canSelect(c) && <span className="max-w-[45%] text-right text-xs text-muted-foreground">{reason(c)}</span>}
    </label>)}</div>
    {!!results.length && <div role="status" className="space-y-1 text-sm"><p>{results.filter((r) => r.ok).length} enviada(s) · {results.filter((r) => !r.ok).length} não enviada(s)</p>{results.filter((r) => !r.ok).map((r) => <p key={r.id} className="text-muted-foreground">{items.find((c) => c.id === r.id)?.titulo ?? r.id}: {r.motivo}</p>)}</div>}
    <AlertDialog open={confirm} onOpenChange={(open) => !busy && setConfirm(open)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Enviar {etapa === "ideias" ? attempt.current?.items.length ?? chosen.length : chosen.length} {etapa === "ideias" ? "ideia(s)" : "produção(ões) final(is)"}?</AlertDialogTitle><AlertDialogDescription>{etapa === "ideias" ? "Cada ideia será avaliada individualmente pelo cliente e terá sua própria versão." : "Cada arte e legenda será enviada à segunda aprovação. O cliente poderá avaliar cada conteúdo individualmente. Apenas os materiais completos serão enviados."}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={busy}>Cancelar</AlertDialogCancel><AlertDialogAction disabled={busy} onClick={(e) => { e.preventDefault(); void run(); }}>{busy ? "Enviando…" : "Confirmar envio"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </section>;
}
