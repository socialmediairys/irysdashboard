import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Pencil, Trash2, Send, MessageCircle, FileText, Eye, Wallet } from "lucide-react";
import { CrudProvider, useCrud } from "@/components/crud/CrudProvider";
import { PortalConteudosManager } from "@/components/portal/PortalConteudosManager";
import { PortalPreview } from "@/components/portal/PortalPreview";
import {
  CobrancaWaMeButton,
  CobrancaWhatsappButton,
  Card,
  TagBadge,
  C,
  brl,
  CLIENTE_STATUS_LABEL,
  CLIENTE_STATUS_VARIANT,
  type ClienteRow,
} from "@/components/Painel360";

type TabKey = "dados" | "gerenciar" | "preview" | "cobranca";
const TAB_KEYS: TabKey[] = ["dados", "gerenciar", "preview", "cobranca"];

export const Route = createFileRoute("/_authenticated/admin/clientes/$clienteId")({
  head: () => ({
    meta: [
      { title: "Perfil do cliente — Irys" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): { tab: TabKey } => ({
    tab: TAB_KEYS.includes(search.tab as TabKey) ? (search.tab as TabKey) : "dados",
  }),
  component: () => (
    <CrudProvider>
      <ClienteProfilePage />
    </CrudProvider>
  ),
});

const TABS: { key: TabKey; label: string; icon: typeof FileText }[] = [
  { key: "dados", label: "Dados", icon: FileText },
  { key: "gerenciar", label: "Portal — Gerenciar conteúdo", icon: Pencil },
  { key: "preview", label: "Central do Cliente — Visualizar", icon: Eye },
  { key: "cobranca", label: "Cobrança", icon: Wallet },
];

function initialsOf(nome: string) {
  return nome
    .split(/\s+/).filter(Boolean).slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "").join("") || "?";
}

function ClienteProfilePage() {
  const { clienteId } = Route.useParams();
  const { tab } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const { openEdit, openDelete } = useCrud();
  const [cliente, setCliente] = useState<ClienteRow | null>(null);
  const [loading, setLoading] = useState(true);

  const setTab = useCallback(
    (t: TabKey) => {
      void navigate({ search: (prev: Record<string, unknown>) => ({ ...prev, tab: t }), replace: true });
    },
    [navigate],
  );

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
      <div className="p-6 flex items-center gap-2 text-sm" style={{ color: C.textMid }}>
        <Loader2 className="h-4 w-4 animate-spin" /> Carregando cliente…
      </div>
    );
  }
  if (!cliente) {
    return (
      <div className="p-6 space-y-3">
        <p className="text-sm" style={{ color: C.textMid }}>Cliente não encontrado.</p>
        <button
          type="button"
          onClick={() => navigate({ to: "/admin/visao-geral" })}
          className="inline-flex items-center gap-1 text-sm font-semibold"
          style={{ color: C.mid }}
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>
      </div>
    );
  }

  const statusLabel = CLIENTE_STATUS_LABEL[cliente.status_contrato] ?? cliente.status_contrato;
  const statusVariant = CLIENTE_STATUS_VARIANT[cliente.status_contrato] ?? "frio";

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-5">
      <Link
        to="/admin/visao-geral"
        className="inline-flex items-center gap-1 text-sm font-semibold hover:underline"
        style={{ color: C.mid }}
      >
        <ArrowLeft className="h-4 w-4" /> Voltar para clientes
      </Link>

      {/* Header do cliente */}
      <Card dark>
        <div className="flex items-start gap-4 flex-wrap">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-[10px] font-extrabold text-lg shrink-0"
            style={{ background: "rgba(255,255,255,0.15)", color: "#fff" }}
          >
            {cliente.init || initialsOf(cliente.nome)}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-extrabold break-words">{cliente.nome}</h1>
            <div className="text-sm break-words" style={{ color: "rgba(255,255,255,0.7)" }}>
              {cliente.plano_label || cliente.plano_atual || "Serviço não definido"}
            </div>
            <div className="mt-3 flex items-center gap-2 flex-wrap text-xs">
              <TagBadge label={statusLabel} variant={statusVariant} />
              {cliente.valor_mensal != null && (
                <span className="font-extrabold" style={{ color: C.gold }}>
                  {brl(Number(cliente.valor_mensal))} /mês
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <CobrancaWaMeButton cliente={cliente} />
            <CobrancaWhatsappButton clienteId={cliente.id} nome={cliente.nome} />
            <button
              type="button"
              onClick={() => openEdit("cliente", cliente)}
              aria-label="Editar cliente"
              className="h-9 w-9 rounded-full flex items-center justify-center transition-colors hover:bg-white/10"
              style={{ color: "#fff" }}
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => openDelete("cliente", cliente)}
              aria-label="Excluir cliente"
              className="h-9 w-9 rounded-full flex items-center justify-center transition-colors hover:bg-white/10"
              style={{ color: "#FF8A70" }}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </Card>

      {/* Abas customizadas (mesmo idioma visual do resto do painel) */}
      <div className="flex items-center gap-2 flex-wrap">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs sm:text-sm font-bold transition-all"
              style={
                active
                  ? { background: C.dark, color: "#fff" }
                  : { background: "#fff", color: C.textMid, border: `1px solid ${C.beige}` }
              }
            >
              <Icon size={14} />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "dados" && (
        <Card>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
            <Field label="Nome">{cliente.nome}</Field>
            <Field label="Status do contrato"><TagBadge label={statusLabel} variant={statusVariant} /></Field>
            <Field label="Serviço / Plano">{cliente.plano_label || cliente.plano_atual || "—"}</Field>
            <Field label="Valor mensal">
              {cliente.valor_mensal != null ? brl(Number(cliente.valor_mensal)) : "—"}
            </Field>
            <Field label="E-mail">{cliente.email || "—"}</Field>
            <Field label="Telefone">{cliente.telefone || "—"}</Field>
          </dl>
          <div className="mt-5">
            <button
              type="button"
              onClick={() => openEdit("cliente", cliente)}
              className="inline-flex items-center gap-1.5 rounded-[30px] px-5 py-2.5 text-sm font-semibold transition-all hover:-translate-y-0.5"
              style={{ background: C.dark, color: "#fff" }}
            >
              <Pencil className="h-4 w-4" /> Editar dados do cliente
            </button>
          </div>
        </Card>
      )}

      {tab === "gerenciar" && (
        <div className="space-y-3">
          <div className="text-xs rounded-[12px] px-4 py-3" style={{ background: C.beigeLight, color: C.textMid }}>
            Tudo que você adicionar aqui vai automaticamente para a aba <strong style={{ color: C.text }}>Central do Cliente — Visualizar</strong> ao lado, e é o que o cliente vê ao entrar no portal.
          </div>
          <PortalConteudosManager clienteId={cliente.id} />
        </div>
      )}

      {tab === "preview" && <PortalPreview clienteId={cliente.id} />}

      {tab === "cobranca" && (
        <Card>
          <div className="space-y-4">
            <div>
              <h3 className="font-extrabold">Enviar cobrança individual</h3>
              <p className="text-sm mt-1" style={{ color: C.textMid }}>
                Use o botão do WhatsApp para abrir uma conversa com mensagem pré-preenchida, ou dispare um template oficial via API.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-[12px] px-4 py-3" style={{ border: `1px solid ${C.beige}` }}>
                <Send className="h-4 w-4" style={{ color: "#2E7D32" }} />
                <span className="text-sm font-semibold">Mensagem rápida via WhatsApp</span>
                <CobrancaWaMeButton cliente={cliente} />
              </div>
              <div className="flex items-center gap-2 rounded-[12px] px-4 py-3" style={{ border: `1px solid ${C.beige}` }}>
                <MessageCircle className="h-4 w-4" style={{ color: C.mid }} />
                <span className="text-sm font-semibold">Cobrança oficial via API</span>
                <CobrancaWhatsappButton clienteId={cliente.id} nome={cliente.nome} />
              </div>
            </div>
            {!cliente.telefone && (
              <div className="text-xs font-semibold" style={{ color: "#A8431E" }}>
                Este cliente não tem telefone cadastrado. Edite os dados para adicionar o número antes de enviar cobrança.
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[10px] font-bold uppercase tracking-wider" style={{ color: C.textMuted }}>{label}</dt>
      <dd className="mt-1 font-semibold break-words" style={{ color: C.text }}>{children}</dd>
    </div>
  );
}
