import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  getReporteiStatus, setReporteiConnection, listReporteiProjects, linkReporteiProject, listReporteiLinks, type ReporteiStatus,
} from "@/lib/reportei.functions";

/** Configurações → Integrações → Reportei. O token fica só no servidor. */
export function ReporteiIntegration() {
  const statusFn = useServerFn(getReporteiStatus);
  const setConn = useServerFn(setReporteiConnection);
  const projFn = useServerFn(listReporteiProjects);
  const linkFn = useServerFn(linkReporteiProject);
  const linksFn = useServerFn(listReporteiLinks);

  const [st, setSt] = useState<ReporteiStatus | null>(null);
  const [busy, setBusy] = useState(false);
  const [projects, setProjects] = useState<{ id: number; name: string }[]>([]);
  const [projErr, setProjErr] = useState<string | null>(null);
  const [links, setLinks] = useState<Record<string, number>>({});
  const [clientes, setClientes] = useState<{ id: string; nome: string }[]>([]);

  const load = async (test = false) => {
    const s = await statusFn({ data: { test } }).catch(() => null);
    setSt(s);
    if (s?.enabled) {
      const [p, l] = await Promise.all([projFn(), linksFn()]);
      setProjects(p.projects); setProjErr(p.error);
      setLinks(Object.fromEntries(l.map((x) => [x.cliente_id, x.project_id])));
    }
  };
  useEffect(() => {
    void load(true);
    void supabase.from("clientes").select("id, nome").order("nome").then(({ data }) => setClientes(data ?? []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = async (enabled: boolean) => {
    setBusy(true);
    const r = await setConn({ data: { enabled } }).catch(() => ({ ok: false, error: "Falha ao salvar." }));
    setBusy(false);
    if (!r.ok) { toast.error(r.error ?? "Falha"); return; }
    toast.success(enabled ? "Reportei conectado." : "Reportei desconectado.");
    await load(enabled);
  };
  const test = async () => { setBusy(true); await load(true); setBusy(false); };

  const vincular = async (clienteId: string, value: string) => {
    const p = projects.find((x) => String(x.id) === value);
    const r = await linkFn({ data: { clienteId, projectId: p ? p.id : null, projectName: p?.name } });
    if (!r.ok) { toast.error(r.error ?? "Falha"); return; }
    toast.success(p ? "Projeto vinculado." : "Vínculo removido.");
    setLinks((m) => { const n = { ...m }; if (p) n[clienteId] = p.id; else delete n[clienteId]; return n; });
  };

  const usados = new Set(Object.values(links));
  const statusText = !st ? "Verificando…"
    : !st.configured ? "Token não configurado"
    : !st.enabled ? "Desconectado"
    : st.error ? st.error
    : st.ok ? `Conectado${st.companyName ? ` · ${st.companyName}` : ""}` : "Conectado";

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="font-semibold text-foreground">Reportei</div>
          <p className="text-sm text-muted-foreground">Fonte de métricas e histórico dos clientes em Relatórios, Métricas do cliente e Portal.</p>
          <p className={`mt-1 text-[13px] ${st?.error ? "text-destructive" : "text-muted-foreground"}`}>Status: {statusText}</p>
        </div>
        <div className="flex gap-2">
          {st?.enabled && <Button variant="outline" size="sm" disabled={busy} onClick={test}>Testar conexão</Button>}
          {st?.enabled
            ? <Button variant="outline" size="sm" disabled={busy} onClick={() => toggle(false)}>Desconectar</Button>
            : <Button size="sm" disabled={busy || !st?.configured} onClick={() => toggle(true)}>Conectar</Button>}
        </div>
      </div>

      {st?.enabled && (
        <div className="border-t border-border pt-4">
          <div className="mb-2 text-sm font-medium text-foreground">Cliente IRYS ↔ Projeto Reportei</div>
          {projErr ? <p className="text-sm text-destructive">{projErr}</p> : (
            <div className="divide-y divide-border">
              {clientes.map((c) => (
                <div key={c.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                  <span className="text-sm text-foreground">{c.nome}</span>
                  <select
                    className="w-full rounded-lg border border-border bg-card px-3 py-1.5 text-sm text-foreground sm:w-64"
                    value={links[c.id] ? String(links[c.id]) : ""}
                    onChange={(e) => vincular(c.id, e.target.value)}
                  >
                    <option value="">Não vinculado</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id} disabled={usados.has(p.id) && links[c.id] !== p.id}>
                        {p.name}{usados.has(p.id) && links[c.id] !== p.id ? " (já vinculado)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
