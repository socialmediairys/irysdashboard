import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { MetricCard } from "@/components/ui/metric-card";
import { DataTable, Thead, Tbody, Tr, Th, Td } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Wallet } from "lucide-react";

type Entrada = { id: string; valor: number; data_ref: string; status_pagamento?: string | null; cliente_id?: string | null };
type Cliente = { id: string; nome: string; valor_mensal: number | null; status_contrato: string | null };
export type Periodo = "mes" | "trimestre" | "ano" | "tudo";

const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function periodoRange(p: Periodo): [string, string] | null {
  if (p === "tudo") return null;
  const d = new Date();
  const y = d.getFullYear(), m = d.getMonth();
  const start = p === "mes" ? new Date(y, m, 1) : p === "trimestre" ? new Date(y, m - 2, 1) : new Date(y, 0, 1);
  const end = p === "ano" ? new Date(y, 11, 31) : new Date(y, m + 1, 0);
  const f = (x: Date) => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
  return [f(start), f(end)];
}

export function FinanceiroResumo({
  entradas, periodo, setPeriodo, clienteId, setClienteId,
}: {
  entradas: Entrada[]; periodo: Periodo; setPeriodo: (p: Periodo) => void;
  clienteId: string; setClienteId: (id: string) => void;
}) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  useEffect(() => {
    void supabase.from("clientes").select("id,nome,valor_mensal,status_contrato").order("nome")
      .then(({ data }) => setClientes((data as Cliente[]) ?? []));
  }, []);

  const hoje = new Date().toISOString().slice(0, 10);
  const range = periodoRange(periodo);
  const filtradas = useMemo(() => entradas.filter((e) =>
    (!range || (e.data_ref >= range[0] && e.data_ref <= range[1])) &&
    (!clienteId || e.cliente_id === clienteId)), [entradas, range, clienteId]);

  const soma = (xs: Entrada[]) => xs.reduce((a, b) => a + Number(b.valor), 0);
  const pagas = filtradas.filter((e) => e.status_pagamento === "pago");
  const abertas = filtradas.filter((e) => e.status_pagamento !== "pago");
  const atrasadas = abertas.filter((e) => e.data_ref < hoje);

  const porCliente = clientes
    .filter((c) => !clienteId || c.id === clienteId)
    .map((c) => {
      const es = filtradas.filter((e) => e.cliente_id === c.id);
      return { ...c, recebido: soma(es.filter((e) => e.status_pagamento === "pago")), aberto: soma(es.filter((e) => e.status_pagamento !== "pago")) };
    })
    .filter((c) => c.valor_mensal || c.recebido || c.aberto)
    .sort((a, b) => Number(b.valor_mensal ?? 0) - Number(a.valor_mensal ?? 0));
  const mrr = porCliente.filter((c) => c.status_contrato === "ativo").reduce((a, c) => a + Number(c.valor_mensal ?? 0), 0);
  const semCliente = filtradas.filter((e) => !e.cliente_id).length;

  const sel = "rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground";
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <select className={sel} value={periodo} onChange={(e) => setPeriodo(e.target.value as Periodo)}>
          <option value="mes">Este mês</option><option value="trimestre">Últimos 3 meses</option>
          <option value="ano">Este ano</option><option value="tudo">Todo o período</option>
        </select>
        <select className={sel} value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
          <option value="">Todos os clientes</option>
          {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>
        {clienteId && <Link to="/admin/clientes/$clienteId" params={{ clienteId }} search={{ tab: "financeiro" } as never} className="text-sm text-muted-foreground hover:text-foreground">Abrir financeiro do cliente →</Link>}
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard label="Previsto" value={brl(soma(filtradas))} hint={`${filtradas.length} entradas no período`} />
        <MetricCard label="Recebido" value={brl(soma(pagas))} />
        <MetricCard label="Pendente" value={brl(soma(abertas) - soma(atrasadas))} />
        <MetricCard label="Atrasado" value={brl(soma(atrasadas))} hint={atrasadas.length ? `${atrasadas.length} vencida(s)` : "Nada vencido"} />
      </div>

      <div className="rounded-2xl bg-card p-5 shadow-card">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-base font-semibold text-foreground">Receita por cliente</h3>
          <span className="text-sm text-muted-foreground">Recorrência contratada (ativos): {brl(mrr)}/mês</span>
        </div>
        {porCliente.length === 0 ? (
          <EmptyState icon={<Wallet size={24} strokeWidth={1.6} />} title="Sem receita vinculada" description="Cadastre o valor mensal no cliente ou vincule entradas a um cliente." />
        ) : (
          <>
          <ul className="divide-y divide-border md:hidden">
            {porCliente.map((c) => (
              <li key={c.id} className="py-3">
                <div className="flex items-baseline justify-between gap-2">
                  <Link to="/admin/clientes/$clienteId" params={{ clienteId: c.id }} search={{ tab: "financeiro" } as never} className="font-medium text-foreground hover:underline">{c.nome}</Link>
                  <span className="text-xs text-muted-foreground">{c.status_contrato?.replace(/_/g, " ") ?? "—"}</span>
                </div>
                <dl className="mt-2 grid grid-cols-3 gap-2 text-[13px]">
                  <div><dt className="text-muted-foreground">Mensal</dt><dd className="text-foreground">{c.valor_mensal ? brl(Number(c.valor_mensal)) : "—"}</dd></div>
                  <div><dt className="text-muted-foreground">Recebido</dt><dd className="text-foreground">{brl(c.recebido)}</dd></div>
                  <div><dt className="text-muted-foreground">Em aberto</dt><dd className="text-foreground">{c.aberto ? brl(c.aberto) : "—"}</dd></div>
                </dl>
              </li>
            ))}
          </ul>
          <div className="hidden md:block">
          <DataTable>
            <Thead><Th>Cliente</Th><Th>Contrato</Th><Th align="right">Mensal contratado</Th><Th align="right">Recebido no período</Th><Th align="right">Em aberto</Th></Thead>
            <Tbody>
              {porCliente.map((c) => (
                <Tr key={c.id}>
                  <Td><Link to="/admin/clientes/$clienteId" params={{ clienteId: c.id }} search={{ tab: "financeiro" } as never} className="font-medium text-foreground hover:underline">{c.nome}</Link></Td>
                  <Td className="text-muted-foreground">{c.status_contrato?.replace(/_/g, " ") ?? "—"}</Td>
                  <Td align="right">{c.valor_mensal ? brl(Number(c.valor_mensal)) : "—"}</Td>
                  <Td align="right">{brl(c.recebido)}</Td>
                  <Td align="right">{c.aberto ? brl(c.aberto) : "—"}</Td>
                </Tr>
              ))}
            </Tbody>
          </DataTable>
          </div>
          </>
        )}
        {semCliente > 0 && <p className="mt-3 text-[13px] text-muted-foreground">{semCliente} entrada(s) do período não estão vinculadas a nenhum cliente.</p>}
      </div>
    </div>
  );
}
