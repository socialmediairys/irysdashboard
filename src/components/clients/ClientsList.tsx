import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { CalendarClock, ChevronRight, Clock, FolderOpen, Plus, Search, UserCheck } from "lucide-react";
import { useCrud } from "@/components/crud/CrudProvider";
import { CobrancaLoteButton } from "@/components/Painel360";
import { supabase } from "@/integrations/supabase/client";
import { GROUP_LABEL, type ClientGroup } from "@/lib/client-workspace";
import { cn } from "@/lib/utils";
import { ClientStatusPill } from "./ClientStatusPill";
import { useClientsData } from "./useClientsData";

type Filter = "todos" | ClientGroup;
const FILTERS: { key: Filter; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "ativo", label: "Ativos" },
  { key: "onboarding", label: "Onboarding" },
  { key: "pausado", label: "Pausados" },
];

const fmtDate = (d: Date) => d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });

export function ClientsList() {
  const { data, isLoading, error, refetch } = useClientsData();
  const { openCreate } = useCrud();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>("todos");
  const [q, setQ] = useState("");

  // Refresh after create/edit/delete made through the shared CRUD sheet.
  useEffect(() => {
    const ch = supabase
      .channel("clients-list")
      .on("postgres_changes", { event: "*", schema: "public", table: "clientes" }, () => {
        void qc.invalidateQueries({ queryKey: ["clients-summary"] });
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { todos: 0, ativo: 0, onboarding: 0, pausado: 0 };
    for (const r of data ?? []) { c.todos++; c[r.group]++; }
    return c;
  }, [data]);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (data ?? []).filter((r) => (filter === "todos" || r.group === filter) && (!term || r.cliente.nome.toLowerCase().includes(term)));
  }, [data, filter, q]);

  return (
    <div>
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-[28px] font-semibold leading-tight tracking-tight text-foreground">Clientes</h1>
          <p className="mt-2 text-sm text-muted-foreground">As contas que você gerencia. Abra um cliente para ver todo o trabalho dele.</p>
        </div>
        <button
          onClick={() => openCreate("cliente")}
          className="inline-flex h-9 shrink-0 items-center gap-1.5 self-start rounded-md bg-primary px-3.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
        >
          <Plus size={16} strokeWidth={1.8} /> Novo cliente
        </button>
      </header>

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-1 overflow-x-auto border-b border-border md:border-0">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "-mb-px flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2 text-sm transition-colors md:mb-0 md:rounded-md md:border-b-0",
                filter === f.key
                  ? "border-primary font-medium text-foreground md:bg-accent"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {f.label}
              <span className="text-xs text-muted-foreground">{counts[f.key]}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 md:w-64 md:flex-none">
            <Search size={15} strokeWidth={1.6} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nome"
              className="h-9 w-full rounded-md border border-border bg-card pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/20"
              aria-label="Buscar cliente por nome"
            />
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        {isLoading && <div className="px-5 py-10 text-center text-sm text-muted-foreground">Carregando clientes…</div>}
        {error && (
          <div className="px-5 py-10 text-center text-sm text-muted-foreground">
            Não foi possível carregar. <button onClick={() => refetch()} className="text-primary hover:underline">Tentar de novo</button>
          </div>
        )}
        {data && rows.length === 0 && (
          <div className="px-5 py-12 text-center text-sm text-muted-foreground">
            {data.length === 0 ? "Nenhum cliente cadastrado ainda." : "Nenhum cliente neste filtro."}
          </div>
        )}
        {rows.length > 0 && (
          <table className="w-full text-sm">
            <thead className="hidden border-b border-border text-left text-[13px] text-muted-foreground md:table-header-group">
              <tr>
                <th className="px-5 py-3 font-normal">Cliente</th>
                <th className="px-3 py-3 font-normal">Status</th>
                <th className="px-3 py-3 font-normal">Serviço</th>
                <th className="px-3 py-3 font-normal">Próxima ação</th>
                <th className="px-3 py-3 font-normal">Última atividade</th>
                <th className="px-3 py-3 font-normal">Atenção</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((r) => {
                const go = () => navigate({ to: "/admin/clientes/$clienteId", params: { clienteId: r.cliente.id }, search: { tab: "visao-geral" } });
                return (
                  <tr key={r.cliente.id} onClick={go} className="cursor-pointer transition-colors hover:bg-accent/50">
                    <td className="px-5 py-3.5">
                      <Link
                        to="/admin/clientes/$clienteId"
                        params={{ clienteId: r.cliente.id }}
                        search={{ tab: "visao-geral" }}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-3"
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-muted-foreground">
                          {r.cliente.nome.charAt(0).toUpperCase()}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-medium text-foreground">{r.cliente.nome}</span>
                          <span className="block truncate text-[13px] text-muted-foreground md:hidden">
                            {GROUP_LABEL[r.group]} · {r.servico}
                          </span>
                        </span>
                      </Link>
                      {r.signals.length > 0 && (
                        <div className="mt-1.5 pl-11 text-[12px] text-primary md:hidden">{r.signals.join(" · ")}</div>
                      )}
                    </td>
                    <td className="hidden px-3 py-3.5 md:table-cell"><ClientStatusPill group={r.group} /></td>
                    <td className="hidden max-w-[160px] truncate px-3 py-3.5 text-muted-foreground md:table-cell">{r.servico}</td>
                    <td className="hidden px-3 py-3.5 md:table-cell">
                      {r.nextAction ? (
                        <div className="flex max-w-[220px] items-center gap-2">
                          {r.nextAction.kind === "reuniao"
                            ? <CalendarClock size={14} strokeWidth={1.6} className="shrink-0 text-muted-foreground" />
                            : <Clock size={14} strokeWidth={1.6} className="shrink-0 text-muted-foreground" />}
                          <span className="truncate text-foreground">{r.nextAction.label}</span>
                          <span className="shrink-0 text-[12px] text-muted-foreground">{fmtDate(r.nextAction.date)}</span>
                        </div>
                      ) : <span className="text-text-tertiary">—</span>}
                    </td>
                    <td className="hidden px-3 py-3.5 text-muted-foreground md:table-cell">{fmtDate(r.lastActivity)}</td>
                    <td className="hidden px-3 py-3.5 md:table-cell">
                      {r.signals.length ? (
                        <div className="flex max-w-[260px] flex-wrap gap-1">
                          {r.signals.slice(0, 2).map((s) => (
                            <span key={s} className="rounded bg-primary-soft px-1.5 py-0.5 text-[12px] text-primary">{s}</span>
                          ))}
                          {r.signals.length > 2 && <span className="text-[12px] text-muted-foreground">+{r.signals.length - 2}</span>}
                        </div>
                      ) : <span className="text-text-tertiary">—</span>}
                    </td>
                    <td className="hidden pr-4 md:table-cell"><ChevronRight size={16} strokeWidth={1.6} className="text-text-tertiary" /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px]">
        <Link to="/admin/cadastros" className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
          <UserCheck size={14} strokeWidth={1.6} /> Cadastros pendentes
        </Link>
        <Link to="/admin/portal-conteudos" className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground">
          <FolderOpen size={14} strokeWidth={1.6} /> Portais de todos os clientes
        </Link>
        {data && <CobrancaLoteButton clientes={data.map((r) => ({ id: r.cliente.id, nome: r.cliente.nome }))} />}
      </div>
    </div>
  );
}
