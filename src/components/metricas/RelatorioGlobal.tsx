import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { EmptyState } from "@/components/ui/empty-state";
import { DataTable, Thead, Tbody, Tr, Th, Td } from "@/components/ui/data-table";
import { BarChart3 } from "lucide-react";
import { ReporteiMetrics, periodRange } from "@/components/metricas/ReporteiMetrics";

type Conta = { id: string; client_id: string | null; platform: string; username: string | null };
type Snap = { social_account_id: string; snapshot_date: string; followers: number | null; engagement_rate: number | null; reach: number | null; impressions: number | null };

const DIAS: Record<string, number> = { "30": 30, "90": 90, "365": 365, "0": 0 };
const n = (v: number | null | undefined) => (v == null ? "—" : Number(v).toLocaleString("pt-BR"));

/** Visão global das métricas lançadas (mesmos dados da aba Métricas do cliente). */
export function RelatorioGlobal() {
  const [contas, setContas] = useState<Conta[]>([]);
  const [snaps, setSnaps] = useState<Snap[]>([]);
  const [clientes, setClientes] = useState<{ id: string; nome: string }[]>([]);
  const [cliente, setCliente] = useState("");
  const [rede, setRede] = useState("");
  const [periodo, setPeriodo] = useState("90");

  useEffect(() => {
    void Promise.all([
      supabase.from("social_accounts").select("id, client_id, platform, username"),
      supabase.from("social_metrics_snapshots").select("social_account_id, snapshot_date, followers, engagement_rate, reach, impressions").order("snapshot_date"),
      supabase.from("clientes").select("id, nome").order("nome"),
    ]).then(([a, s, c]) => { setContas((a.data as Conta[]) ?? []); setSnaps((s.data as Snap[]) ?? []); setClientes(c.data ?? []); });
  }, []);

  const redes = [...new Set(contas.map((c) => c.platform))];
  const desde = DIAS[periodo] ? new Date(Date.now() - DIAS[periodo] * 864e5).toISOString().slice(0, 10) : "";

  const linhas = useMemo(() => contas
    .filter((c) => (!cliente || c.client_id === cliente) && (!rede || c.platform === rede))
    .map((c) => {
      const s = snaps.filter((x) => x.social_account_id === c.id && (!desde || x.snapshot_date >= desde));
      const first = s[0], last = s[s.length - 1];
      return { c, qtd: s.length, last, delta: first && last && s.length > 1 && last.followers != null && first.followers != null ? last.followers - first.followers : null };
    }), [contas, snaps, cliente, rede, desde]);

  const nome = (id: string | null) => clientes.find((x) => x.id === id)?.nome ?? "—";
  const sel = "rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground";
  const comDados = linhas.filter((l) => l.qtd > 0);

  return (
    <section className="mb-8 space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <select className={sel} value={cliente} onChange={(e) => setCliente(e.target.value)}>
          <option value="">Todos os clientes</option>
          {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>
        <select className={sel} value={rede} onChange={(e) => setRede(e.target.value)}>
          <option value="">Todas as redes</option>
          {redes.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <select className={sel} value={periodo} onChange={(e) => setPeriodo(e.target.value)}>
          <option value="30">Últimos 30 dias</option><option value="90">Últimos 90 dias</option>
          <option value="365">Últimos 12 meses</option><option value="0">Todo o período</option>
        </select>
      </div>
      {comDados.length === 0 ? (
        <EmptyState icon={<BarChart3 size={24} strokeWidth={1.6} />} title="Ainda não há métricas lançadas neste recorte"
          description={`${contas.length} conta(s) social cadastrada(s). Lance números em “Lançamentos manuais de métricas” para ver a evolução aqui e na aba Métricas de cada cliente.`} />
      ) : (
        <DataTable>
          <Thead><Th>Cliente</Th><Th>Rede</Th><Th align="right">Seguidores</Th><Th align="right">Variação</Th><Th align="right">Engajamento</Th><Th align="right">Alcance</Th><Th align="right">Registros</Th></Thead>
          <Tbody>
            {comDados.map(({ c, last, delta, qtd }) => (
              <Tr key={c.id}>
                <Td>{c.client_id ? <Link to="/admin/clientes/$clienteId" params={{ clienteId: c.client_id }} search={{ tab: "metricas" } as never} className="font-medium text-foreground hover:underline">{nome(c.client_id)}</Link> : "—"}</Td>
                <Td className="text-muted-foreground">{c.platform}{c.username ? ` · @${c.username}` : ""}</Td>
                <Td align="right">{n(last?.followers)}</Td>
                <Td align="right">{delta == null ? "—" : `${delta > 0 ? "+" : ""}${n(delta)}`}</Td>
                <Td align="right">{last?.engagement_rate == null ? "—" : `${Number(last.engagement_rate).toLocaleString("pt-BR")}%`}</Td>
                <Td align="right">{n(last?.reach)}</Td>
                <Td align="right">{qtd}</Td>
              </Tr>
            ))}
          </Tbody>
        </DataTable>
      )}
      {cliente && <ReporteiMetrics clienteId={cliente} network={rede.toLowerCase()} {...periodRange(DIAS[periodo])} />}
    </section>
  );
}
