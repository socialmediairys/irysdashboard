import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/PageHeader";
import { Progress } from "@/components/ui/progress";
import { EtapaBadge } from "@/components/strategy/ui";
import { db } from "@/components/strategy/useStrategy";
import { supabase } from "@/integrations/supabase/client";
import { BRIEFING_AREAS, strategyProgress, type EtapaRow, type EtapaStatus, type BriefingMapa } from "@/lib/strategy";

export const Route = createFileRoute("/_authenticated/admin/estrategia")({
  head: () => ({
    meta: [
      { title: "Estratégia — Irys" },
      { name: "description", content: "Visão global das jornadas estratégicas dos clientes." },
      { property: "og:title", content: "Estratégia — Irys" },
      { property: "og:description", content: "Visão global das jornadas estratégicas dos clientes." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EstrategiaRoute,
});

type Row = { id: string; nome: string; etapas: EtapaRow[]; pendencia: string | null };

async function load(): Promise<Row[]> {
  const [cli, et, br, ga] = await Promise.all([
    supabase.from("clientes").select("id,nome").order("nome"),
    db("estrategia_etapas").select("cliente_id,etapa,status,iniciado_em,concluido_em,updated_at"),
    db("estrategia_briefing").select("cliente_id,mapa"),
    db("estrategia_achados").select("cliente_id").eq("tipo", "gargalo_principal").neq("status", "descartado"),
  ]);
  const etapas = (et.data ?? []) as (EtapaRow & { cliente_id: string })[];
  const briefs = (br.data ?? []) as { cliente_id: string; mapa: BriefingMapa }[];
  const gargalo = new Set(((ga.data ?? []) as { cliente_id: string }[]).map((g) => g.cliente_id));
  return (cli.data ?? []).map((c) => {
    const mapa = briefs.find((b) => b.cliente_id === c.id)?.mapa ?? null;
    const lacuna = mapa && BRIEFING_AREAS.flatMap((a) => a.perguntas.map((p) => ({ a, p }))).find(({ p }) => mapa[p.key]?.status === "desconhecida");
    return {
      id: c.id, nome: c.nome, etapas: etapas.filter((e) => e.cliente_id === c.id),
      pendencia: !mapa ? "Briefing não iniciado" : lacuna ? `Desconhecido: ${lacuna.p.label}` : !gargalo.has(c.id) ? "Gargalo principal não definido" : null,
    };
  });
}

function EstrategiaRoute() {
  const { data, isLoading } = useQuery({ queryKey: ["strategy-global"], queryFn: load });
  return (
    <div>
      <PageHeader title="Estratégia" description="Jornada estratégica de cada cliente. Abra um cliente para trabalhar a estratégia." />
      {isLoading ? <div className="text-sm text-muted-foreground">Carregando…</div> : (
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full min-w-[760px] text-[13px]">
            <thead><tr className="border-b border-border text-left text-muted-foreground">
              {["Cliente", "Progresso", "Etapa atual", "Status", "Última atualização", "Pendência principal"].map((h) => <th key={h} className="px-4 py-2.5 font-medium">{h}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-border">
              {(data ?? []).map((r) => {
                const p = strategyProgress(r.etapas);
                const st: EtapaStatus = p.atual ? p.map.get(p.atual.n)?.status ?? "nao_iniciada" : "concluida";
                return (
                  <tr key={r.id} className="hover:bg-accent">
                    <td className="px-4 py-3">
                      <Link to="/admin/clientes/$clienteId" params={{ clienteId: r.id }} search={{ tab: "estrategia" }} className="font-medium text-foreground hover:underline">{r.nome}</Link>
                    </td>
                    <td className="px-4 py-3"><div className="flex items-center gap-2"><Progress value={p.pct} className="h-1.5 w-20" /><span className="text-muted-foreground">{p.pct}%</span></div></td>
                    <td className="px-4 py-3 text-foreground">{p.atual ? `${p.atual.n}. ${p.atual.titulo}` : "Concluída"}</td>
                    <td className="px-4 py-3"><EtapaBadge status={st} /></td>
                    <td className="px-4 py-3 text-muted-foreground">{p.last ? new Date(p.last).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) : "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.pendencia ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
