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
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Check, Loader2, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/cadastros")({
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
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-[#2C1505]">Cadastros pendentes</h1>
        <p className="text-sm text-[#7A6050]">
          Aprove os pedidos de acesso vinculando cada um a um cliente já existente.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-[#7A4A18]">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
        </div>
      ) : pendentes.length === 0 ? (
        <Card className="p-6 text-sm text-[#7A6050]">Nenhum cadastro aguardando aprovação.</Card>
      ) : (
        <ul className="space-y-3">
          {pendentes.map((sol) => (
            <Card key={sol.id} className="p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-semibold text-[#2C1505] break-words">{sol.nome}</div>
                  <div className="text-sm text-[#7A6050] break-all">{sol.email}</div>
                  <div className="text-xs text-[#BBA898] mt-1">
                    Solicitado em {new Date(sol.created_at).toLocaleString("pt-BR")}
                  </div>
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
                      <div className="px-3 py-2 text-xs text-[#7A6050]">
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
                  className="bg-[#2C1505] hover:bg-[#7A4A18] text-white"
                >
                  <Check className="h-4 w-4 mr-1" /> Aprovar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleRejeitar(sol)}
                  disabled={acting === sol.id}
                  className="border-[#E8D8C0] text-[#7A4A18]"
                >
                  <X className="h-4 w-4 mr-1" /> Rejeitar
                </Button>
              </div>
            </Card>
          ))}
        </ul>
      )}
    </div>
  );
}
