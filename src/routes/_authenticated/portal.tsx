import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { LogOut, FileText, MessageSquare, CheckSquare, User } from "lucide-react";

export const Route = createFileRoute("/_authenticated/portal")({
  component: PortalPage,
});

type Cliente = {
  id: string;
  nome: string;
  status_contrato: string;
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

function PortalPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"contrato" | "checklist" | "suporte" | "conteudos">("contrato");
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [docs, setDocs] = useState<Documento[]>([]);
  const [novoTicket, setNovoTicket] = useState({ assunto: "", descricao: "" });
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return navigate({ to: "/auth" });

    const { data: profile } = await supabase
      .from("profiles")
      .select("cliente_id")
      .eq("id", userData.user.id)
      .maybeSingle();

    if (!profile?.cliente_id) {
      setLoading(false);
      return;
    }
    const [c, t, cl, d] = await Promise.all([
      supabase.from("clientes").select("*").eq("id", profile.cliente_id).maybeSingle(),
      supabase
        .from("suporte_tickets")
        .select("*")
        .eq("cliente_id", profile.cliente_id)
        .order("data_abertura", { ascending: false }),
      supabase
        .from("onboarding_checklist")
        .select("*")
        .eq("cliente_id", profile.cliente_id)
        .order("ordem"),
      supabase
        .from("documentos_juridicos")
        .select("*")
        .or(`cliente_id.eq.${profile.cliente_id},publico.eq.true`),
    ]);
    setCliente(c.data as Cliente | null);
    setTickets((t.data ?? []) as Ticket[]);
    setChecklist((cl.data ?? []) as ChecklistItem[]);
    setDocs((d.data ?? []) as Documento[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };

  const toggleChecklist = async (item: ChecklistItem) => {
    const novo = !item.concluido;
    await supabase
      .from("onboarding_checklist")
      .update({ concluido: novo, data_conclusao: novo ? new Date().toISOString() : null })
      .eq("id", item.id);
    load();
  };

  const abrirTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cliente) return;
    setMsg(null);
    const { error } = await supabase.from("suporte_tickets").insert({
      cliente_id: cliente.id,
      assunto: novoTicket.assunto,
      descricao: novoTicket.descricao,
      prioridade: "media",
    });
    if (error) {
      console.error("[portal] abrirTicket failed:", error);
      setMsg("Não foi possível abrir o ticket agora. Tente novamente em instantes.");
    } else {
      setNovoTicket({ assunto: "", descricao: "" });
      setMsg("Ticket aberto!");
      load();
    }
  };

  const solicitarRenovacao = async () => {
    if (!cliente) return;
    const { error } = await supabase.from("suporte_tickets").insert({
      cliente_id: cliente.id,
      assunto: "Solicitação de renovação de contrato",
      descricao: `Cliente ${cliente.nome} solicita renovação. Vencimento atual: ${cliente.data_vencimento_contrato}`,
      prioridade: "alta_urgente",
    });
    if (error) {
      console.error("[portal] solicitarRenovacao failed:", error);
      setMsg("Não foi possível registrar sua solicitação agora. Tente novamente em instantes.");
    } else {
      setMsg("Renovação solicitada! Nosso time entrará em contato.");
      load();
    }
  };

  const diasAteVencimento = cliente?.data_vencimento_contrato
    ? Math.ceil(
        (new Date(cliente.data_vencimento_contrato).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      )
    : null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#EDEAE5] text-[#7A4A18]">
        Carregando portal...
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#EDEAE5] p-6 gap-4">
        <User className="w-12 h-12 text-[#7A4A18]" />
        <h1 className="text-xl font-bold text-[#2C1505]">Portal não vinculado</h1>
        <p className="text-sm text-[#7A6050] max-w-md text-center">
          Seu usuário ainda não está vinculado a um cliente. Peça ao administrador para associar seu
          e-mail a um cliente cadastrado.
        </p>
        <Button onClick={signOut} variant="outline">
          <LogOut className="w-4 h-4 mr-2" /> Sair
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EDEAE5]">
      <header className="bg-[#2C1505] text-white px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">Portal do Cliente</h1>
          <p className="text-xs text-[#C9A46E]">{cliente.nome}</p>
        </div>
        <Button onClick={signOut} variant="ghost" className="text-white hover:bg-[#7A4A18]">
          <LogOut className="w-4 h-4 mr-2" /> Sair
        </Button>
      </header>

      <nav className="bg-white border-b border-[#E8D8C0] px-6 flex gap-1 overflow-x-auto">
        {(
          [
            { k: "contrato", label: "Contrato", icon: FileText },
            { k: "checklist", label: "Checklist", icon: CheckSquare },
            { k: "suporte", label: "Suporte", icon: MessageSquare },
          ] as const
        ).map(({ k, label, icon: Icon }) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`px-4 py-3 text-sm font-medium border-b-2 flex items-center gap-2 cursor-pointer transition ${
              tab === k
                ? "border-[#C9A46E] text-[#2C1505]"
                : "border-transparent text-[#7A6050] hover:text-[#2C1505]"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </nav>

      <main className="max-w-5xl mx-auto p-6 space-y-4">
        {msg && (
          <div className="bg-[#F5EEE5] border border-[#C9A46E] rounded p-3 text-sm text-[#2C1505]">
            {msg}
          </div>
        )}

        {tab === "contrato" && (
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="p-6">
              <h2 className="font-bold text-[#2C1505] mb-4">Meu Contrato</h2>
              <dl className="space-y-2 text-sm">
                <Row label="Status">
                  <Badge>{cliente.status_contrato}</Badge>
                </Row>
                <Row label="Plano">{cliente.plano_atual ?? "—"}</Row>
                <Row label="Valor mensal">
                  {cliente.valor_mensal
                    ? `R$ ${Number(cliente.valor_mensal).toFixed(2)}`
                    : "—"}
                </Row>
                <Row label="Forma de pagamento">{cliente.forma_pagamento ?? "—"}</Row>
                <Row label="Vencimento">
                  {cliente.data_vencimento_contrato ?? "—"}
                  {diasAteVencimento !== null && diasAteVencimento < 30 && (
                    <Badge className="ml-2 bg-[#7A4A18]">Vence em {diasAteVencimento}d</Badge>
                  )}
                </Row>
              </dl>
              {cliente.link_contrato_assinado && (
                <a
                  href={cliente.link_contrato_assinado}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-4 text-sm text-[#7A4A18] underline"
                >
                  Baixar contrato assinado
                </a>
              )}
              {diasAteVencimento !== null && diasAteVencimento < 30 && (
                <Button
                  onClick={solicitarRenovacao}
                  className="mt-4 w-full bg-[#C9A46E] hover:bg-[#7A4A18] text-[#2C1505] hover:text-white"
                >
                  Solicitar Renovação
                </Button>
              )}
            </Card>

            <Card className="p-6">
              <h2 className="font-bold text-[#2C1505] mb-4">Documentos</h2>
              {docs.length === 0 ? (
                <p className="text-sm text-[#7A6050]">Nenhum documento disponível.</p>
              ) : (
                <ul className="space-y-2">
                  {docs.map((d) => (
                    <li key={d.id} className="flex items-center justify-between text-sm">
                      <span className="text-[#2C1505]">{d.nome}</span>
                      <a
                        href={d.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#7A4A18] underline"
                      >
                        Baixar
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        )}

        {tab === "checklist" && (
          <Card className="p-6">
            <h2 className="font-bold text-[#2C1505] mb-4">Checklist de Onboarding</h2>
            {checklist.length === 0 ? (
              <p className="text-sm text-[#7A6050]">Sem tarefas cadastradas.</p>
            ) : (
              <ul className="space-y-3">
                {checklist.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-start gap-3 p-3 rounded border border-[#E8D8C0]"
                  >
                    <Checkbox
                      checked={item.concluido}
                      onCheckedChange={() => toggleChecklist(item)}
                      disabled={item.responsavel === "admin"}
                    />
                    <div className="flex-1">
                      <p
                        className={`text-sm ${item.concluido ? "line-through text-[#BBA898]" : "text-[#2C1505]"}`}
                      >
                        {item.tarefa}
                      </p>
                      <span className="text-xs text-[#7A6050]">
                        Responsável: {item.responsavel}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}

        {tab === "suporte" && (
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="p-6">
              <h2 className="font-bold text-[#2C1505] mb-4">Meus Tickets</h2>
              {tickets.length === 0 ? (
                <p className="text-sm text-[#7A6050]">Nenhum ticket ainda.</p>
              ) : (
                <ul className="space-y-2">
                  {tickets.map((t) => (
                    <li key={t.id} className="p-3 rounded border border-[#E8D8C0]">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-[#2C1505]">{t.assunto}</span>
                        <Badge>{t.status}</Badge>
                      </div>
                      {t.descricao && (
                        <p className="text-xs text-[#7A6050] mt-1">{t.descricao}</p>
                      )}
                      <p className="text-xs text-[#BBA898] mt-1">
                        Prioridade: {t.prioridade} ·{" "}
                        {new Date(t.data_abertura).toLocaleDateString("pt-BR")}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
            <Card className="p-6">
              <h2 className="font-bold text-[#2C1505] mb-4">Abrir novo ticket</h2>
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
                <Button
                  type="submit"
                  className="w-full bg-[#2C1505] hover:bg-[#7A4A18] text-white"
                >
                  Enviar
                </Button>
              </form>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-[#E8D8C0] pb-1">
      <dt className="text-[#7A6050]">{label}</dt>
      <dd className="text-[#2C1505]">{children}</dd>
    </div>
  );
}
