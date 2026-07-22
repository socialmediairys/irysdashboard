import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { ArrowUp, ArrowDown, Minus, Instagram, TrendingUp } from "lucide-react";
import { C } from "@/components/Painel360";

type Account = {
  id: string;
  client_id: string;
  platform: string;
  username: string | null;
};
type Snap = {
  id: string;
  social_account_id: string;
  snapshot_date: string;
  followers: number | null;
  engagement_rate: number | null;
  reach: number | null;
  impressions: number | null;
};
type Goal = {
  id: string;
  social_account_id: string;
  metric: string;
  target_value: number;
  target_date: string | null;
};
type Cliente = { id: string; nome: string };

const METRIC_LABEL: Record<string, string> = {
  followers: "Seguidores",
  engagement_rate: "Engajamento",
  reach: "Alcance",
  impressions: "Impressões",
};

function formatNum(n: number | null | undefined) {
  if (n == null) return "—";
  if (Math.abs(n) >= 1000) return n.toLocaleString("pt-BR");
  return String(n);
}

export function SocialMetricsDashboardCard() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [snaps, setSnaps] = useState<Snap[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    (async () => {
      setLoading(true);
      const [a, s, g, c] = await Promise.all([
        supabase.from("social_accounts").select("id, client_id, platform, username, connection_type, created_at"),
        supabase.from("social_metrics_snapshots").select("*").order("snapshot_date", { ascending: false }),
        supabase.from("social_goals").select("*"),
        supabase.from("clientes").select("id,nome"),
      ]);
      if (cancel) return;
      setAccounts((a.data as Account[] | null) ?? []);
      setSnaps((s.data as Snap[] | null) ?? []);
      setGoals((g.data as Goal[] | null) ?? []);
      setClientes((c.data as Cliente[] | null) ?? []);
      setLoading(false);
    })();
    return () => {
      cancel = true;
    };
  }, []);

  // one main account per client (first one)
  const cards = useMemo(() => {
    const byClient = new Map<string, Account>();
    for (const a of accounts) if (!byClient.has(a.client_id)) byClient.set(a.client_id, a);
    return Array.from(byClient.values()).map((acc) => {
      const cliente = clientes.find((c) => c.id === acc.client_id);
      const accSnaps = snaps.filter((x) => x.social_account_id === acc.id);
      const latest = accSnaps[0] ?? null;
      const prev = accSnaps[1] ?? null;
      const diff =
        latest && prev && latest.followers != null && prev.followers != null
          ? latest.followers - prev.followers
          : null;
      const goal =
        goals
          .filter((gg) => gg.social_account_id === acc.id)
          .sort((a, b) => (a.target_date ?? "").localeCompare(b.target_date ?? ""))[0] ?? null;
      let goalCurrent: number | null = null;
      if (goal && latest) {
        const v = latest[goal.metric as keyof Snap];
        goalCurrent = typeof v === "number" ? v : null;
      }
      const goalPct =
        goal && goalCurrent != null && goal.target_value > 0
          ? Math.min(100, (goalCurrent / goal.target_value) * 100)
          : null;
      return { acc, cliente, latest, diff, goal, goalCurrent, goalPct };
    });
  }, [accounts, snaps, goals, clientes]);

  return (
    <div className="rounded-[14px] p-5" style={{ background: "#fff", boxShadow: "0 2px 16px rgba(44,21,5,0.09)" }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-extrabold text-lg flex items-center gap-2">
          <TrendingUp size={18} style={{ color: C.mid }} /> Métricas sociais
        </h3>
        <Link
          to="/admin/metricas-sociais"
          className="text-xs font-bold uppercase tracking-wider"
          style={{ color: C.mid }}
        >
          gerenciar →
        </Link>
      </div>
      {loading ? (
        <div className="text-sm" style={{ color: C.textMid }}>Carregando…</div>
      ) : cards.length === 0 ? (
        <div className="text-sm" style={{ color: C.textMid }}>
          Nenhuma conta social cadastrada.{" "}
          <Link to="/admin/metricas-sociais" style={{ color: C.mid, fontWeight: 700 }}>
            Cadastrar
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map(({ acc, cliente, latest, diff, goal, goalCurrent, goalPct }) => (
            <div
              key={acc.id}
              className="rounded-[12px] p-4 flex flex-col gap-3"
              style={{ background: C.beigeLight, border: `1px solid ${C.beige}` }}
            >
              <div className="flex items-center gap-2">
                <Instagram size={16} style={{ color: C.mid }} />
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: C.textMuted }}>
                    {acc.platform} · {cliente?.nome ?? "—"}
                  </div>
                  <div className="text-xs font-semibold truncate" style={{ color: C.textMid }}>
                    @{acc.username ?? "—"}
                  </div>
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: C.textMuted }}>
                  Seguidores
                </div>
                <div className="flex items-baseline gap-2">
                  <div className="text-3xl font-extrabold" style={{ color: C.text }}>
                    {formatNum(latest?.followers ?? null)}
                  </div>
                  {diff != null && (
                    <span
                      className="inline-flex items-center gap-0.5 text-xs font-bold"
                      style={{ color: diff > 0 ? "#2E7D32" : diff < 0 ? "#C8351A" : C.textMid }}
                    >
                      {diff > 0 ? <ArrowUp size={12} /> : diff < 0 ? <ArrowDown size={12} /> : <Minus size={12} />}
                      {diff > 0 ? "+" : ""}
                      {diff}
                    </span>
                  )}
                </div>
              </div>
              {goal && (
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span style={{ color: C.textMid }}>
                      Meta: {METRIC_LABEL[goal.metric]} {formatNum(goal.target_value)}
                    </span>
                    <span style={{ color: C.mid, fontWeight: 700 }}>
                      {goalPct != null ? `${goalPct.toFixed(0)}%` : "—"}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full overflow-hidden" style={{ background: "#fff" }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${goalPct ?? 0}%`,
                        background: goalPct && goalPct >= 100 ? "#2E7D32" : C.gold,
                      }}
                    />
                  </div>
                  <div className="text-[10px] mt-1" style={{ color: C.textMuted }}>
                    Atual: {formatNum(goalCurrent)}
                    {goal.target_date && ` · até ${new Date(goal.target_date).toLocaleDateString("pt-BR")}`}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
