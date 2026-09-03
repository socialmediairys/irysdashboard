import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2, TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/ui/empty-state";
import { DataTable, Tbody, Td, Th, Thead, Tr } from "@/components/ui/data-table";

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

/** Superfícies e controles usam os tokens neutros do design system. */
const CARD = "rounded-2xl bg-card p-5 shadow-card";
const FIELD =
  "rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground";
const BTN =
  "inline-flex items-center justify-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary-hover active:bg-primary-active disabled:opacity-60";

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
    const { data, error } = await supabase.from("social_accounts").select("id, client_id, platform, username, connection_type, created_at").order("created_at");
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
    <div>
      <PageHeader
        title="Métricas sociais"
        description="Cadastre contas sociais dos clientes, lance snapshots mensais e defina metas."
      />

      <div className="space-y-6">
        <NewAccountForm clientes={clientes} onCreated={loadAccounts} />

        <div className={CARD}>
          <h3 className="mb-3 font-bold text-foreground">Contas cadastradas</h3>
          {loading ? (
            <div className="text-sm text-muted-foreground">Carregando…</div>
          ) : accounts.length === 0 ? (
            <EmptyState
              title="Nenhuma conta cadastrada"
              description="Adicione a primeira conta social no formulário acima."
              icon={<TrendingUp size={24} strokeWidth={1.6} />}
              className="shadow-none"
            />
          ) : (
            <ul className="divide-y divide-border">
              {accounts.map((a) => {
                const cli = clientes.find((c) => c.id === a.client_id);
                return (
                  <li key={a.id} className="flex items-center justify-between py-3">
                    <div>
                      <div className="font-semibold text-foreground">{cli?.nome ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">
                        {a.platform} · @{a.username ?? "—"}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedAccount(a.id)}
                      className="rounded-full border border-border px-4 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-secondary"
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
    <form onSubmit={submit} className={`${CARD} grid grid-cols-1 gap-3 md:grid-cols-4`}>
      <div className="md:col-span-4">
        <h3 className="font-bold text-foreground">Nova conta social</h3>
      </div>
      <select value={clientId} onChange={(e) => setClientId(e.target.value)} className={FIELD}>
        <option value="">Cliente…</option>
        {clientes.map((c) => (
          <option key={c.id} value={c.id}>{c.nome}</option>
        ))}
      </select>
      <select
        value={platform}
        onChange={(e) => setPlatform(e.target.value as Account["platform"])}
        className={FIELD}
      >
        {PLATFORMS.map((p) => (
          <option key={p} value={p}>{p}</option>
        ))}
      </select>
      <input
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="@username"
        className={FIELD}
      />
      <button type="submit" disabled={saving} className={BTN}>
        <Plus size={14} strokeWidth={1.6} /> Adicionar
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
        className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft size={14} strokeWidth={1.6} /> Voltar
      </button>

      <PageHeader
        title={cliente?.nome ?? "—"}
        description={`${account.platform} · @${account.username ?? "—"}`}
        actions={
          <button
            type="button"
            onClick={deleteAccount}
            className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-destructive"
            aria-label="Excluir conta"
          >
            <Trash2 size={16} strokeWidth={1.6} />
          </button>
        }
      />

      <NewSnapshotForm accountId={account.id} onCreated={load} />

      <div>
        <h3 className="mb-3 font-bold text-foreground">Snapshots</h3>
        {loading ? (
          <div className={`${CARD} text-sm text-muted-foreground`}>Carregando…</div>
        ) : snaps.length === 0 ? (
          <EmptyState title="Nenhum snapshot lançado" description="Use o formulário acima para registrar o primeiro." />
        ) : (
          <DataTable>
            <Thead>
              <Th>Data</Th>
              <Th>Seguidores</Th>
              <Th>Engaj. %</Th>
              <Th>Alcance</Th>
              <Th>Impressões</Th>
              <Th align="right">Ações</Th>
            </Thead>
            <Tbody>
              {snaps.map((s) => (
                <Tr key={s.id}>
                  <Td>{new Date(s.snapshot_date).toLocaleDateString("pt-BR")}</Td>
                  <Td>{s.followers ?? "—"}</Td>
                  <Td>{s.engagement_rate ?? "—"}</Td>
                  <Td>{s.reach ?? "—"}</Td>
                  <Td>{s.impressions ?? "—"}</Td>
                  <Td align="right">
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
                      className="text-xs font-semibold text-destructive hover:underline"
                    >
                      Excluir
                    </button>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </DataTable>
        )}
      </div>

      <NewGoalForm accountId={account.id} onCreated={load} />

      <div className={CARD}>
        <h3 className="mb-3 font-bold text-foreground">Metas</h3>
        {goals.length === 0 ? (
          <div className="text-sm text-muted-foreground">Nenhuma meta definida.</div>
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
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-semibold text-foreground">{metricLabel}</span>
                    <span className="text-muted-foreground">
                      {current ?? "—"} / {g.target_value}
                      {g.target_date && ` · até ${new Date(g.target_date).toLocaleDateString("pt-BR")}`}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className={`h-full rounded-full ${pct >= 100 ? "bg-success" : "bg-primary"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="mt-1 text-right">
                    <button
                      type="button"
                      onClick={async () => {
                        if (!confirm("Excluir meta?")) return;
                        const { error } = await supabase.from("social_goals").delete().eq("id", g.id);
                        if (error) return toast.error(error.message);
                        toast.success("Excluída");
                        await load();
                      }}
                      className="text-xs font-semibold text-destructive hover:underline"
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

  return (
    <form onSubmit={submit} className={`${CARD} grid grid-cols-2 gap-3 md:grid-cols-6`}>
      <div className="col-span-2 md:col-span-6">
        <h3 className="font-bold text-foreground">Novo snapshot</h3>
      </div>
      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={FIELD} />
      <input type="number" placeholder="Seguidores" value={followers} onChange={(e) => setFollowers(e.target.value)} className={FIELD} />
      <input type="number" step="0.01" placeholder="Engaj. %" value={engagement} onChange={(e) => setEngagement(e.target.value)} className={FIELD} />
      <input type="number" placeholder="Alcance" value={reach} onChange={(e) => setReach(e.target.value)} className={FIELD} />
      <input type="number" placeholder="Impressões" value={impressions} onChange={(e) => setImpressions(e.target.value)} className={FIELD} />
      <button type="submit" disabled={saving} className={BTN}>
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

  return (
    <form onSubmit={submit} className={`${CARD} grid grid-cols-2 gap-3 md:grid-cols-4`}>
      <div className="col-span-2 md:col-span-4">
        <h3 className="font-bold text-foreground">Nova meta</h3>
      </div>
      <select value={metric} onChange={(e) => setMetric(e.target.value as Goal["metric"])} className={FIELD}>
        {METRICS.map((m) => (
          <option key={m.v} value={m.v}>{m.label}</option>
        ))}
      </select>
      <input type="number" step="0.01" placeholder="Valor alvo" value={target} onChange={(e) => setTarget(e.target.value)} className={FIELD} />
      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={FIELD} />
      <button type="submit" disabled={saving} className={BTN}>
        Salvar meta
      </button>
    </form>
  );
}
