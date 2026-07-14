import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, ArrowLeft, TrendingUp } from "lucide-react";
import { C } from "@/components/Painel360";

export const Route = createFileRoute("/_authenticated/admin/metricas-sociais")({
  head: () => ({
    meta: [
      { title: "Métricas sociais — Irys" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: MetricasSociaisPage,
});

type Cliente = { id: string; nome: string };
type Account = {
  id: string;
  client_id: string;
  platform: "instagram" | "tiktok" | "facebook" | "linkedin";
  username: string | null;
  connection_type: "manual" | "api";
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
  metric: "followers" | "engagement_rate" | "reach" | "impressions";
  target_value: number;
  target_date: string | null;
};

const PLATFORMS = ["instagram", "tiktok", "facebook", "linkedin"] as const;
const METRICS = [
  { v: "followers", label: "Seguidores" },
  { v: "engagement_rate", label: "Engajamento (%)" },
  { v: "reach", label: "Alcance" },
  { v: "impressions", label: "Impressões" },
] as const;

function MetricasSociaisPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadClientes = async () => {
    const { data } = await supabase.from("clientes").select("id,nome").order("nome");
    setClientes((data as Cliente[] | null) ?? []);
  };
  const loadAccounts = async () => {
    const { data, error } = await supabase.from("social_accounts").select("*").order("created_at");
    if (error) toast.error(error.message);
    setAccounts((data as Account[] | null) ?? []);
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await Promise.all([loadClientes(), loadAccounts()]);
      setLoading(false);
    })();
  }, []);

  const selected = accounts.find((a) => a.id === selectedAccount) ?? null;

  if (selected) {
    return (
      <AccountDetail
        account={selected}
        cliente={clientes.find((c) => c.id === selected.client_id) ?? null}
        onBack={() => setSelectedAccount(null)}
        onDeleted={async () => {
          setSelectedAccount(null);
          await loadAccounts();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold flex items-center gap-2" style={{ color: C.text }}>
          <TrendingUp size={22} style={{ color: C.mid }} /> Métricas sociais
        </h1>
        <p className="text-sm mt-1" style={{ color: C.textMid }}>
          Cadastre contas sociais dos clientes, lance snapshots mensais e defina metas.
        </p>
      </div>

      <NewAccountForm clientes={clientes} onCreated={loadAccounts} />

      <div className="rounded-[14px] p-5" style={{ background: "#fff", boxShadow: "0 2px 16px rgba(44,21,5,0.09)" }}>
        <h3 className="font-extrabold mb-3">Contas cadastradas</h3>
        {loading ? (
          <div className="text-sm" style={{ color: C.textMid }}>Carregando…</div>
        ) : accounts.length === 0 ? (
          <div className="text-sm" style={{ color: C.textMid }}>Nenhuma conta cadastrada ainda.</div>
        ) : (
          <ul className="divide-y" style={{ borderColor: C.beige }}>
            {accounts.map((a) => {
              const cli = clientes.find((c) => c.id === a.client_id);
              return (
                <li key={a.id} className="flex items-center justify-between py-3">
                  <div>
                    <div className="font-semibold">{cli?.nome ?? "—"}</div>
                    <div className="text-xs" style={{ color: C.textMid }}>
                      {a.platform} · @{a.username ?? "—"}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedAccount(a.id)}
                    className="rounded-full px-4 py-1.5 text-xs font-bold"
                    style={{ background: C.dark, color: "#fff" }}
                  >
                    Abrir
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function NewAccountForm({ clientes, onCreated }: { clientes: Cliente[]; onCreated: () => Promise<void> }) {
  const [clientId, setClientId] = useState("");
  const [platform, setPlatform] = useState<Account["platform"]>("instagram");
  const [username, setUsername] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!clientId) {
      toast.error("Selecione um cliente");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("social_accounts")
      .insert({ client_id: clientId, platform, username: username || null, connection_type: "manual" });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Conta criada");
    setUsername("");
    await onCreated();
  };

  return (
    <form
      onSubmit={submit}
      className="rounded-[14px] p-5 grid grid-cols-1 md:grid-cols-4 gap-3"
      style={{ background: "#fff", boxShadow: "0 2px 16px rgba(44,21,5,0.09)" }}
    >
      <div className="md:col-span-4">
        <h3 className="font-extrabold">Nova conta social</h3>
      </div>
      <select
        value={clientId}
        onChange={(e) => setClientId(e.target.value)}
        className="rounded-[10px] px-3 py-2 text-sm"
        style={{ border: `1px solid ${C.beige}` }}
      >
        <option value="">Cliente…</option>
        {clientes.map((c) => (
          <option key={c.id} value={c.id}>{c.nome}</option>
        ))}
      </select>
      <select
        value={platform}
        onChange={(e) => setPlatform(e.target.value as Account["platform"])}
        className="rounded-[10px] px-3 py-2 text-sm"
        style={{ border: `1px solid ${C.beige}` }}
      >
        {PLATFORMS.map((p) => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>
      <input
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="@username"
        className="rounded-[10px] px-3 py-2 text-sm"
        style={{ border: `1px solid ${C.beige}` }}
      />
      <button
        type="submit"
        disabled={saving}
        className="rounded-[10px] px-4 py-2 text-sm font-bold inline-flex items-center gap-1 justify-center"
        style={{ background: C.dark, color: "#fff" }}
      >
        <Plus size={14} /> Adicionar
      </button>
    </form>
  );
}

function AccountDetail({
  account,
  cliente,
  onBack,
  onDeleted,
}: {
  account: Account;
  cliente: Cliente | null;
  onBack: () => void;
  onDeleted: () => void | Promise<void>;
}) {
  const [snaps, setSnaps] = useState<Snap[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [s, g] = await Promise.all([
      supabase
        .from("social_metrics_snapshots")
        .select("*")
        .eq("social_account_id", account.id)
        .order("snapshot_date", { ascending: false }),
      supabase.from("social_goals").select("*").eq("social_account_id", account.id),
    ]);
    setSnaps((s.data as Snap[] | null) ?? []);
    setGoals((g.data as Goal[] | null) ?? []);
    setLoading(false);
  };
  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account.id]);

  const latest = snaps[0] ?? null;

  const deleteAccount = async () => {
    if (!confirm("Excluir esta conta e todos os snapshots/metas?")) return;
    const { error } = await supabase.from("social_accounts").delete().eq("id", account.id);
    if (error) return toast.error(error.message);
    toast.success("Conta excluída");
    await onDeleted();
  };

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1 text-sm font-semibold"
        style={{ color: C.mid }}
      >
        <ArrowLeft size={14} /> Voltar
      </button>

      <div
        className="rounded-[14px] p-5 flex items-start justify-between gap-3"
        style={{ background: C.dark, color: "#fff" }}
      >
        <div>
          <div className="text-xs uppercase tracking-wider opacity-70">{account.platform}</div>
          <h1 className="text-2xl font-extrabold">{cliente?.nome ?? "—"}</h1>
          <div className="text-sm opacity-80">@{account.username ?? "—"}</div>
        </div>
        <button
          type="button"
          onClick={deleteAccount}
          className="rounded-full h-9 w-9 flex items-center justify-center hover:bg-white/10"
          aria-label="Excluir conta"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <NewSnapshotForm accountId={account.id} onCreated={load} />

      <div className="rounded-[14px] p-5" style={{ background: "#fff", boxShadow: "0 2px 16px rgba(44,21,5,0.09)" }}>
        <h3 className="font-extrabold mb-3">Snapshots</h3>
        {loading ? (
          <div className="text-sm" style={{ color: C.textMid }}>Carregando…</div>
        ) : snaps.length === 0 ? (
          <div className="text-sm" style={{ color: C.textMid }}>Nenhum snapshot lançado.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left" style={{ color: C.textMuted }}>
                  <th className="py-2 pr-3 text-[11px] uppercase font-bold">Data</th>
                  <th className="py-2 pr-3 text-[11px] uppercase font-bold">Seguidores</th>
                  <th className="py-2 pr-3 text-[11px] uppercase font-bold">Engaj. %</th>
                  <th className="py-2 pr-3 text-[11px] uppercase font-bold">Alcance</th>
                  <th className="py-2 pr-3 text-[11px] uppercase font-bold">Impressões</th>
                  <th className="py-2 pr-3 text-[11px] uppercase font-bold text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {snaps.map((s) => (
                  <tr key={s.id} className="border-t" style={{ borderColor: C.beige }}>
                    <td className="py-2 pr-3">{new Date(s.snapshot_date).toLocaleDateString("pt-BR")}</td>
                    <td className="py-2 pr-3">{s.followers ?? "—"}</td>
                    <td className="py-2 pr-3">{s.engagement_rate ?? "—"}</td>
                    <td className="py-2 pr-3">{s.reach ?? "—"}</td>
                    <td className="py-2 pr-3">{s.impressions ?? "—"}</td>
                    <td className="py-2 pr-3 text-right">
                      <button
                        type="button"
                        onClick={async () => {
                          if (!confirm("Excluir snapshot?")) return;
                          const { error } = await supabase
                            .from("social_metrics_snapshots")
                            .delete()
                            .eq("id", s.id);
                          if (error) return toast.error(error.message);
                          toast.success("Excluído");
                          await load();
                        }}
                        className="text-xs font-bold"
                        style={{ color: "#C8351A" }}
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <NewGoalForm accountId={account.id} onCreated={load} />

      <div className="rounded-[14px] p-5" style={{ background: "#fff", boxShadow: "0 2px 16px rgba(44,21,5,0.09)" }}>
        <h3 className="font-extrabold mb-3">Metas</h3>
        {goals.length === 0 ? (
          <div className="text-sm" style={{ color: C.textMid }}>Nenhuma meta definida.</div>
        ) : (
          <div className="space-y-3">
            {goals.map((g) => {
              const current = latest ? (latest[g.metric] as number | null) : null;
              const pct =
                current != null && g.target_value > 0
                  ? Math.min(100, (current / g.target_value) * 100)
                  : 0;
              const metricLabel = METRICS.find((m) => m.v === g.metric)?.label ?? g.metric;
              return (
                <div key={g.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-semibold">{metricLabel}</span>
                    <span style={{ color: C.textMid }}>
                      {current ?? "—"} / {g.target_value}
                      {g.target_date && ` · até ${new Date(g.target_date).toLocaleDateString("pt-BR")}`}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full overflow-hidden" style={{ background: C.beigeLight }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, background: pct >= 100 ? "#2E7D32" : C.gold }}
                    />
                  </div>
                  <div className="text-right mt-1">
                    <button
                      type="button"
                      onClick={async () => {
                        if (!confirm("Excluir meta?")) return;
                        const { error } = await supabase.from("social_goals").delete().eq("id", g.id);
                        if (error) return toast.error(error.message);
                        toast.success("Excluída");
                        await load();
                      }}
                      className="text-xs font-bold"
                      style={{ color: "#C8351A" }}
                    >
                      Excluir meta
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function NewSnapshotForm({ accountId, onCreated }: { accountId: string; onCreated: () => Promise<void> }) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [followers, setFollowers] = useState("");
  const [engagement, setEngagement] = useState("");
  const [reach, setReach] = useState("");
  const [impressions, setImpressions] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase.from("social_metrics_snapshots").insert({
      social_account_id: accountId,
      snapshot_date: date,
      followers: followers ? Number(followers) : null,
      engagement_rate: engagement ? Number(engagement) : null,
      reach: reach ? Number(reach) : null,
      impressions: impressions ? Number(impressions) : null,
      source: "manual",
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Snapshot lançado");
    setFollowers("");
    setEngagement("");
    setReach("");
    setImpressions("");
    await onCreated();
  };

  const input = "rounded-[10px] px-3 py-2 text-sm";
  const border = { border: `1px solid ${C.beige}` };

  return (
    <form
      onSubmit={submit}
      className="rounded-[14px] p-5 grid grid-cols-2 md:grid-cols-6 gap-3"
      style={{ background: "#fff", boxShadow: "0 2px 16px rgba(44,21,5,0.09)" }}
    >
      <div className="col-span-2 md:col-span-6">
        <h3 className="font-extrabold">Novo snapshot</h3>
      </div>
      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={input} style={border} />
      <input type="number" placeholder="Seguidores" value={followers} onChange={(e) => setFollowers(e.target.value)} className={input} style={border} />
      <input type="number" step="0.01" placeholder="Engaj. %" value={engagement} onChange={(e) => setEngagement(e.target.value)} className={input} style={border} />
      <input type="number" placeholder="Alcance" value={reach} onChange={(e) => setReach(e.target.value)} className={input} style={border} />
      <input type="number" placeholder="Impressões" value={impressions} onChange={(e) => setImpressions(e.target.value)} className={input} style={border} />
      <button
        type="submit"
        disabled={saving}
        className="rounded-[10px] px-4 py-2 text-sm font-bold"
        style={{ background: C.dark, color: "#fff" }}
      >
        Salvar
      </button>
    </form>
  );
}

function NewGoalForm({ accountId, onCreated }: { accountId: string; onCreated: () => Promise<void> }) {
  const [metric, setMetric] = useState<Goal["metric"]>("followers");
  const [target, setTarget] = useState("");
  const [date, setDate] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!target) return toast.error("Informe o valor alvo");
    setSaving(true);
    const { error } = await supabase.from("social_goals").insert({
      social_account_id: accountId,
      metric,
      target_value: Number(target),
      target_date: date || null,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Meta criada");
    setTarget("");
    setDate("");
    await onCreated();
  };

  const input = "rounded-[10px] px-3 py-2 text-sm";
  const border = { border: `1px solid ${C.beige}` };

  return (
    <form
      onSubmit={submit}
      className="rounded-[14px] p-5 grid grid-cols-2 md:grid-cols-4 gap-3"
      style={{ background: "#fff", boxShadow: "0 2px 16px rgba(44,21,5,0.09)" }}
    >
      <div className="col-span-2 md:col-span-4">
        <h3 className="font-extrabold">Nova meta</h3>
      </div>
      <select value={metric} onChange={(e) => setMetric(e.target.value as Goal["metric"])} className={input} style={border}>
        {METRICS.map((m) => (
          <option key={m.v} value={m.v}>{m.label}</option>
        ))}
      </select>
      <input type="number" step="0.01" placeholder="Valor alvo" value={target} onChange={(e) => setTarget(e.target.value)} className={input} style={border} />
      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={input} style={border} />
      <button
        type="submit"
        disabled={saving}
        className="rounded-[10px] px-4 py-2 text-sm font-bold"
        style={{ background: C.dark, color: "#fff" }}
      >
        Salvar meta
      </button>
    </form>
  );
}
