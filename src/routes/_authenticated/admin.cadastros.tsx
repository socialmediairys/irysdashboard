import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  listarPendentes,
  aprovarSolicitacao,
  rejeitarSolicitacao,
  listarClientesDisponiveis,
  type Solicitacao,
} from "@/lib/cadastros.functions";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/ui/empty-state";
import { toast } from "sonner";
import { Check, Loader2, UserCheck, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/cadastros")({
  head: () => ({
    meta: [
      { title: "Cadastros pendentes — Irys OS" },
      { name: "description", content: "Aprove pedidos de acesso vinculando cada um a um cliente." },
    ],
  }),
  component: CadastrosPage,
});

type ClienteDisp = { id: string; nome: string; email: string | null };

function CadastrosPage() {
  const [pendentes, setPendentes] = useState<Solicitacao[]>([]);
  const [clientes, setClientes] = useState<ClienteDisp[]>([]);
  const [selecoes, setSelecoes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  const listPend = useServerFn(listarPendentes);
  const listCli = useServerFn(listarClientesDisponiveis);
  const aprovar = useServerFn(aprovarSolicitacao);
  const rejeitar = useServerFn(rejeitarSolicitacao);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [p, c] = await Promise.all([listPend(), listCli()]);
      setPendentes(p);
      setClientes(c);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao carregar");
    } finally {
      setLoading(false);
    }
  }, [listPend, listCli]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleAprovar = async (sol: Solicitacao) => {
    const clienteId = selecoes[sol.id];
    if (!clienteId) {
      toast.error("Escolha o cliente para vincular.");
      return;
    }
    setActing(sol.id);
    try {
      await aprovar({ data: { solicitacaoId: sol.id, clienteId } });
      toast.success(`Cadastro de ${sol.nome} aprovado.`);
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao aprovar");
    } finally {
      setActing(null);
    }
  };

  const handleRejeitar = async (sol: Solicitacao) => {
    if (!confirm(`Rejeitar cadastro de ${sol.nome}?`)) return;
    setActing(sol.id);
    try {
      await rejeitar({ data: { solicitacaoId: sol.id } });
      toast.success("Cadastro rejeitado.");
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao rejeitar");
    } finally {
      setActing(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Cadastros pendentes"
        description="Aprove os pedidos de acesso vinculando cada um a um cliente já existente."
      />

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.6} /> Carregando…
        </div>
      ) : pendentes.length === 0 ? (
        <EmptyState
          title="Nenhum cadastro aguardando aprovação"
          description="Novos pedidos de acesso aparecem aqui automaticamente."
          icon={<UserCheck size={24} strokeWidth={1.6} />}
        />
      ) : (
        <ul className="space-y-3">
          {pendentes.map((sol) => (
            <li key={sol.id} className="rounded-2xl bg-card p-5 shadow-card">
              <div className="min-w-0">
                <div className="break-words font-semibold text-foreground">{sol.nome}</div>
                <div className="break-all text-sm text-muted-foreground">{sol.email}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Solicitado em {new Date(sol.created_at).toLocaleString("pt-BR")}
                </div>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
                <Select
                  value={selecoes[sol.id] ?? ""}
                  onValueChange={(v) => setSelecoes((s) => ({ ...s, [sol.id]: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha o cliente para vincular" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.length === 0 && (
                      <div className="px-3 py-2 text-xs text-muted-foreground">
                        Nenhum cliente disponível — cadastre um cliente antes.
                      </div>
                    )}
                    {clientes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nome}
                        {c.email ? ` — ${c.email}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => handleAprovar(sol)}
                  disabled={acting === sol.id || !selecoes[sol.id]}
                >
                  <Check className="mr-1 h-4 w-4" strokeWidth={1.6} /> Aprovar
                </Button>
                <Button variant="outline" onClick={() => handleRejeitar(sol)} disabled={acting === sol.id}>
                  <X className="mr-1 h-4 w-4" strokeWidth={1.6} /> Rejeitar
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
