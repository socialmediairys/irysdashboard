import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Pencil, Trash2, Send, MessageCircle } from "lucide-react";
import { CrudProvider, useCrud } from "@/components/crud/CrudProvider";
import { PortalConteudosManager } from "@/components/portal/PortalConteudosManager";
import { PortalPreview } from "@/components/portal/PortalPreview";
import { CobrancaWaMeButton, CobrancaWhatsappButton, type ClienteRow } from "@/components/Painel360";

export const Route = createFileRoute("/_authenticated/admin/clientes/$clienteId")({
  head: () => ({
    meta: [
      { title: "Perfil do cliente — Irys" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: () => (
    <CrudProvider>
      <ClienteProfilePage />
    </CrudProvider>
  ),
});

const CLIENTE_STATUS_LABEL: Record<string, string> = {
  ativo: "Ativo",
  pendente_assinatura: "Atenção",
  vencido: "Vencido",
  cancelado: "Inativo",
};

function brl(n: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
}

function ClienteProfilePage() {
  const { clienteId } = Route.useParams();
  const navigate = useNavigate();
  const { openEdit, openDelete } = useCrud();
  const [cliente, setCliente] = useState<ClienteRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("dados");

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("clientes")
      .select("id, nome, plano_label, plano_atual, valor_mensal, status_contrato, email, telefone, slug, init")
      .eq("id", clienteId)
      .maybeSingle();
    if (error) {
      toast.error(error.message);
    }
    setCliente((data as ClienteRow | null) ?? null);
    setLoading(false);
  }, [clienteId]);

  useEffect(() => {
    void load();
  }, [load]);

  // Realtime: se o cliente for atualizado (ex.: pelo modal de edição), recarrega.
  useEffect(() => {
    const channel = supabase
      .channel(`cliente-profile-${clienteId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "clientes", filter: `id=eq.${clienteId}` },
        () => { void load(); },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [clienteId, load]);

  if (loading && !cliente) {
    return (
      <div className="p-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" /> Carregando cliente…
      </div>
    );
  }
  if (!cliente) {
    return (
      <div className="p-6 space-y-3">
        <p className="text-sm text-muted-foreground">Cliente não encontrado.</p>
        <Button variant="outline" onClick={() => navigate({ to: "/admin/visao-geral" })}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
        </Button>
      </div>
    );
  }

  const statusLabel = CLIENTE_STATUS_LABEL[cliente.status_contrato] ?? cliente.status_contrato;

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Link
          to="/admin/visao-geral"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar para clientes
        </Link>
      </div>

      <Card className="p-4 sm:p-5">
        <div className="flex items-start gap-4 flex-wrap">
          <div className="flex h-14 w-14 items-center justify-center rounded-[10px] font-extrabold text-lg bg-[#F0E6D6] text-[#2C1505] shrink-0">
            {cliente.init || cliente.nome.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-extrabold break-words">{cliente.nome}</h1>
            <div className="text-sm text-muted-foreground break-words">
              {cliente.plano_label || cliente.plano_atual || "—"}
            </div>
            <div className="mt-2 flex items-center gap-2 flex-wrap text-xs">
              <Badge variant="outline">{statusLabel}</Badge>
              {cliente.valor_mensal != null && (
                <span className="font-semibold">{brl(Number(cliente.valor_mensal))} /mês</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <CobrancaWaMeButton cliente={cliente} />
            <CobrancaWhatsappButton clienteId={cliente.id} nome={cliente.nome} />
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => openEdit("cliente", cliente)} aria-label="Editar cliente">
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-destructive hover:text-destructive"
              onClick={() => openDelete("cliente", cliente)}
              aria-label="Excluir cliente"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="w-full flex flex-wrap h-auto justify-start gap-1">
          <TabsTrigger value="dados">Dados</TabsTrigger>
          <TabsTrigger value="gerenciar">Portal — Gerenciar conteúdo</TabsTrigger>
          <TabsTrigger value="preview">Central do Cliente — Visualizar</TabsTrigger>
          <TabsTrigger value="cobranca">Cobrança</TabsTrigger>
        </TabsList>

        <TabsContent value="dados" className="mt-4">
          <Card className="p-4 sm:p-5">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <Field label="Nome">{cliente.nome}</Field>
              <Field label="Status do contrato"><Badge variant="outline">{statusLabel}</Badge></Field>
              <Field label="Plano">{cliente.plano_label || cliente.plano_atual || "—"}</Field>
              <Field label="Valor mensal">
                {cliente.valor_mensal != null ? brl(Number(cliente.valor_mensal)) : "—"}
              </Field>
              <Field label="E-mail">{cliente.email || "—"}</Field>
              <Field label="Telefone">{cliente.telefone || "—"}</Field>
            </dl>
            <div className="mt-4">
              <Button onClick={() => openEdit("cliente", cliente)} className="gap-1.5">
                <Pencil className="h-4 w-4" /> Editar dados do cliente
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="gerenciar" className="mt-4">
          <div className="mb-3 text-xs text-muted-foreground">
            Tudo que você adicionar aqui vai automaticamente para a aba <strong>Central do Cliente — Visualizar</strong> ao lado, e é o que o cliente vê ao entrar no portal.
          </div>
          <PortalConteudosManager clienteId={cliente.id} />
        </TabsContent>

        <TabsContent value="preview" className="mt-4">
          <PortalPreview clienteId={cliente.id} />
        </TabsContent>

        <TabsContent value="cobranca" className="mt-4">
          <Card className="p-4 sm:p-5 space-y-4">
            <div>
              <h3 className="font-bold">Enviar cobrança individual</h3>
              <p className="text-sm text-muted-foreground">
                Use o botão do WhatsApp para abrir uma conversa com mensagem pré-preenchida, ou dispare um template oficial via API.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
                <Send className="h-4 w-4 text-emerald-600" />
                <span className="text-sm">Mensagem rápida via WhatsApp</span>
                <CobrancaWaMeButton cliente={cliente} />
              </div>
              <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
                <MessageCircle className="h-4 w-4" />
                <span className="text-sm">Cobrança oficial via API</span>
                <CobrancaWhatsappButton clienteId={cliente.id} nome={cliente.nome} />
              </div>
            </div>
            {!cliente.telefone && (
              <div className="text-xs text-amber-700">
                Este cliente não tem telefone cadastrado. Edite os dados para adicionar o número antes de enviar cobrança.
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm font-medium break-words">{children}</dd>
    </div>
  );
}
