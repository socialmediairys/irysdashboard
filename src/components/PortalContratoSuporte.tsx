import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { StatusBadge } from "@/components/ui/status-badge";
import { FileDown } from "lucide-react";

/** Superfície padrão do design system para os cards do portal. */
const CARD = "rounded-2xl bg-card p-6 shadow-card";

type Contrato = {
  id: string;
  nome: string;
  status_contrato: string | null;
  data_vencimento_contrato: string | null;
  link_contrato_assinado: string | null;
  plano_atual: string | null;
  valor_mensal: number | null;
  forma_pagamento: string | null;
};
type Ticket = {
  id: string;
  assunto: string;
  status: string;
  prioridade: string;
  data_abertura: string;
  descricao: string | null;
};
type ChecklistItem = {
  id: string;
  tarefa: string;
  concluido: boolean;
  responsavel: string;
};
type Documento = { id: string; nome: string; url: string; tipo: string | null };

/**
 * Contrato, documentos, checklist de onboarding e tickets de suporte do cliente.
 * Migrado do antigo /portal para dentro da Central do Cliente (/meu-portal).
 */
export function PortalContratoSuporte({ clienteId }: { clienteId: string }) {
  const [contrato, setContrato] = useState<Contrato | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [docs, setDocs] = useState<Documento[]>([]);
  const [novoTicket, setNovoTicket] = useState({ assunto: "", descricao: "" });
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const [c, t, cl, d] = await Promise.all([
      supabase.from("clientes").select("*").eq("id", clienteId).maybeSingle(),
      supabase
        .from("suporte_tickets")
        .select("*")
        .eq("cliente_id", clienteId)
        .order("data_abertura", { ascending: false }),
      supabase.from("onboarding_checklist").select("*").eq("cliente_id", clienteId).order("ordem"),
      supabase
        .from("documentos_juridicos")
        .select("*")
        .or(`cliente_id.eq.${clienteId},publico.eq.true`),
    ]);
    setContrato((c.data ?? null) as Contrato | null);
    setTickets((t.data ?? []) as Ticket[]);
    setChecklist((cl.data ?? []) as ChecklistItem[]);
    setDocs((d.data ?? []) as Documento[]);
    setLoading(false);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteId]);

  const toggleChecklist = async (item: ChecklistItem) => {
    const novo = !item.concluido;
    await supabase
      .from("onboarding_checklist")
      .update({ concluido: novo, data_conclusao: novo ? new Date().toISOString() : null })
      .eq("id", item.id);
    void load();
  };

  const abrirTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    const { error } = await supabase.from("suporte_tickets").insert({
      cliente_id: clienteId,
      assunto: novoTicket.assunto,
      descricao: novoTicket.descricao,
      prioridade: "media",
    });
    if (error) {
      console.error("[meu-portal] abrirTicket failed:", error);
      setMsg("Não foi possível abrir o ticket agora. Tente novamente em instantes.");
    } else {
      setNovoTicket({ assunto: "", descricao: "" });
      setMsg("Ticket aberto!");
      void load();
    }
  };

  const solicitarRenovacao = async () => {
    if (!contrato) return;
    const { error } = await supabase.from("suporte_tickets").insert({
      cliente_id: clienteId,
      assunto: "Solicitação de renovação de contrato",
      descricao: `Cliente ${contrato.nome} solicita renovação. Vencimento atual: ${contrato.data_vencimento_contrato}`,
      prioridade: "alta_urgente",
    });
    if (error) {
      console.error("[meu-portal] solicitarRenovacao failed:", error);
      setMsg("Não foi possível registrar sua solicitação agora. Tente novamente em instantes.");
    } else {
      setMsg("Renovação solicitada! Nosso time entrará em contato.");
      void load();
    }
  };

  const diasAteVencimento = contrato?.data_vencimento_contrato
    ? Math.ceil(
        (new Date(contrato.data_vencimento_contrato).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24),
      )
    : null;

  if (loading) {
    return <p className="text-sm text-muted-foreground">Carregando contrato e suporte...</p>;
  }

  return (
    <div className="space-y-4">
      {msg && (
        <div className="rounded-xl border border-border bg-secondary p-3 text-sm text-foreground">{msg}</div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className={CARD}>
          <h2 className="mb-4 font-bold text-foreground">Meu contrato</h2>
          {contrato ? (
            <>
              <dl className="space-y-2 text-sm">
                <Row label="Status">
                  <StatusBadge status={contrato.status_contrato} />
                </Row>
                <Row label="Plano">{contrato.plano_atual ?? "—"}</Row>
                <Row label="Valor mensal">
                  {contrato.valor_mensal ? `R$ ${Number(contrato.valor_mensal).toFixed(2)}` : "—"}
                </Row>
                <Row label="Forma de pagamento">{contrato.forma_pagamento ?? "—"}</Row>
                <Row label="Vencimento">
                  <span className="inline-flex items-center gap-2">
                    {contrato.data_vencimento_contrato ?? "—"}
                    {diasAteVencimento !== null && diasAteVencimento < 30 && (
                      <StatusBadge variant="warning" dot={false}>
                        Vence em {diasAteVencimento}d
                      </StatusBadge>
                    )}
                  </span>
                </Row>
              </dl>
              {contrato.link_contrato_assinado && (
                <a
                  href={contrato.link_contrato_assinado}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground"
                >
                  <FileDown className="h-4 w-4" strokeWidth={1.6} /> Baixar contrato assinado
                </a>
              )}
              {diasAteVencimento !== null && diasAteVencimento < 30 && (
                <Button onClick={solicitarRenovacao} variant="outline" className="mt-4 w-full">
                  Solicitar renovação
                </Button>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Contrato não disponível.</p>
          )}
        </div>

        <div className={CARD}>
          <h2 className="mb-4 font-bold text-foreground">Documentos</h2>
          {docs.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum documento disponível.</p>
          ) : (
            <ul className="space-y-2">
              {docs.map((d) => (
                <li key={d.id} className="flex items-center justify-between text-sm">
                  <span className="text-foreground">{d.nome}</span>
                  <a
                    href={d.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-muted-foreground underline decoration-border underline-offset-4 hover:text-foreground"
                  >
                    <FileDown className="h-3.5 w-3.5" strokeWidth={1.6} /> Baixar
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className={CARD}>
        <h2 className="mb-4 font-bold text-foreground">Checklist de onboarding</h2>
        {checklist.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem tarefas cadastradas.</p>
        ) : (
          <ul className="space-y-3">
            {checklist.map((item) => (
              <li key={item.id} className="flex items-start gap-3 rounded-xl border border-border p-3">
                <Checkbox
                  checked={item.concluido}
                  onCheckedChange={() => toggleChecklist(item)}
                  disabled={item.responsavel === "admin"}
                />
                <div className="flex-1">
                  <p
                    className={`text-sm ${item.concluido ? "text-muted-foreground line-through" : "text-foreground"}`}
                  >
                    {item.tarefa}
                  </p>
                  <span className="text-xs text-muted-foreground">
                    Responsável: {item.responsavel}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className={CARD}>
          <h2 className="mb-4 font-bold text-foreground">Meus tickets</h2>
          {tickets.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum ticket ainda.</p>
          ) : (
            <ul className="space-y-2">
              {tickets.map((t) => (
                <li key={t.id} className="rounded-xl border border-border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-foreground">{t.assunto}</span>
                    <StatusBadge status={t.status} />
                  </div>
                  {t.descricao && (
                    <p className="mt-1 text-xs text-muted-foreground">{t.descricao}</p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    Prioridade: {t.prioridade} ·{" "}
                    {new Date(t.data_abertura).toLocaleDateString("pt-BR")}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className={CARD}>
          <h2 className="mb-4 font-bold text-foreground">Abrir novo ticket</h2>
          <form onSubmit={abrirTicket} className="space-y-3">
            <Input
              placeholder="Assunto"
              value={novoTicket.assunto}
              onChange={(e) => setNovoTicket({ ...novoTicket, assunto: e.target.value })}
              required
            />
            <Textarea
              placeholder="Descreva sua solicitação..."
              value={novoTicket.descricao}
              onChange={(e) => setNovoTicket({ ...novoTicket, descricao: e.target.value })}
              rows={5}
            />
            <Button type="submit" className="w-full">
              Enviar
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-border pb-1">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-foreground">{children}</dd>
    </div>
  );
}
