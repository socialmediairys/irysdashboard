import { useRef, useState } from "react";
import { History, Send, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { canSendIdea, canWithdrawIdea, canWithdrawProduction, type Conteudo } from "@/lib/content";

export function ApprovalActions({ c, etapa, onDone, onSend, canSend }: { c: Conteudo; etapa: "ideia" | "producao"; onDone: () => void; onSend?: () => Promise<void>; canSend?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [action, setAction] = useState<"send" | "withdraw" | "reopen" | null>(null);
  const requestKey = useRef<string | null>(null);
  const idea = etapa === "ideia";
  const withdraw = idea ? canWithdrawIdea(c.status_ideia) : canWithdrawProduction(c.status);
  const reopen = idea ? c.status_ideia === "aprovada" : ["aprovado", "agendado", "publicado"].includes(c.status);
  const send = idea ? canSendIdea(c.status_ideia) : canSend;
  const name = idea ? "ideia" : "produção final";
  const partial = !idea && (c.status_arte === "aprovado" || c.status_legenda === "aprovado");
  const run = async () => {
    if (busy || !action) return;
    setBusy(true);
    try {
      if (action === "send") {
        if (idea) {
          requestKey.current ??= crypto.randomUUID();
          const { data, error } = await supabase.rpc("enviar_ideias_lote", { _itens: [{ id: c.id, versao: c.ideia_versao_atual }], _chave: requestKey.current });
          if (error) throw new Error("Não foi possível enviar. Tente novamente.");
          const result = data as unknown as { ok: boolean; motivo?: string }[];
          if (!result[0]?.ok) { requestKey.current = null; throw new Error(result[0]?.motivo ?? "Não foi possível enviar."); }
          requestKey.current = null;
        } else { await onSend?.(); }
      } else {
        const { error } = await supabase.rpc("retirar_aprovacao", { _conteudo_id: c.id, _etapa: etapa, _reabrir: action === "reopen", _versao: idea ? c.ideia_versao_atual : c.versao_atual });
        if (error) throw new Error("Não foi possível concluir. Atualize o conteúdo e tente novamente.");
      }
      toast.success(action === "send" ? "Enviado à cliente." : action === "reopen" ? "Aprovação reaberta para revisão." : "Retirado da aprovação. Histórico preservado.");
      setAction(null); onDone();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Não foi possível concluir."); }
    finally { setBusy(false); }
  };
  const icon = (label: string, Icon: typeof Send, click: () => void) => <Tooltip><TooltipTrigger asChild><Button size="sm" variant="outline" title={label} aria-label={label} disabled={busy} onClick={click}><Icon /><span className="sm:sr-only">{label}</span></Button></TooltipTrigger><TooltipContent>{label}</TooltipContent></Tooltip>;
  return <TooltipProvider><div className="ml-auto flex flex-wrap gap-2">
    {send && icon(`${(idea ? c.ideia_versao_atual > 0 : !!c.enviado_cliente_em) ? "Reenviar" : "Enviar"} ${name}`, Send, () => setAction("send"))}
    {withdraw && icon(`Retirar ${name} da aprovação`, Undo2, () => setAction("withdraw"))}
    {reopen && icon(`Reabrir aprovação da ${name}`, Undo2, () => setAction("reopen"))}
    {icon("Consultar histórico", History, () => document.getElementById("content-history")?.click())}
  </div><AlertDialog open={!!action} onOpenChange={(open) => !open && !busy && setAction(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{action === "send" ? `Enviar ${name}?` : action === "reopen" ? `Reabrir aprovação da ${name}?` : `Retirar ${name} da aprovação?`}</AlertDialogTitle><AlertDialogDescription>
    {action === "send" ? "A cliente receberá uma nova versão. As versões anteriores e seus comentários serão preservados." : "A cliente não poderá avaliar esta versão até que uma nova versão seja enviada. O histórico e os materiais serão preservados."}
    {action !== "send" && partial && " Já existe aprovação parcial: a decisão anterior será preservada, mas a próxima versão precisará de nova avaliação."}
    {action === "reopen" && idea && " A aprovação atual da ideia deixará de autorizar o envio da produção final; avaliações de produção pendentes também serão suspensas."}
  </AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={busy}>Cancelar</AlertDialogCancel><AlertDialogAction disabled={busy} onClick={(e) => { e.preventDefault(); void run(); }}>{busy ? "Aguarde…" : "Confirmar"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></TooltipProvider>;
}