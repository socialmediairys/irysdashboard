import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Reportei API v2 (https://developers.reportei.com). O token fica apenas no
 * servidor (secret REPORTEI_API_TOKEN) e nunca é devolvido ao navegador.
 * Endpoints usados: GET /companies/settings, GET /projects, GET /integrations?project_id,
 * GET /metrics?integration_slug, POST /metrics/get-data, GET /reports?project_id.
 */
const BASE = "https://app.reportei.com/api/v2";
const MAX_METRICS = 12;

class ReporteiError extends Error {
  constructor(message: string, public status = 0) { super(message); }
}

async function rp<T>(path: string, init?: RequestInit): Promise<T> {
  const token = process.env["REPORTEI_API_TOKEN"];
  if (!token) throw new ReporteiError("Token do Reportei não configurado.", 0);
  let res: Response;
  try {
    res = await fetch(BASE + path, {
      ...init,
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json", "Content-Type": "application/json" },
      signal: AbortSignal.timeout(20000),
    });
  } catch (e) {
    console.error("[reportei] rede", e);
    throw new ReporteiError("Reportei indisponível no momento.", 0);
  }
  if (res.status === 401 || res.status === 403) throw new ReporteiError("Credencial do Reportei inválida ou sem permissão.", res.status);
  if (res.status === 429 && !(init as { _retry?: boolean } | undefined)?._retry) {
    await new Promise((r) => setTimeout(r, 1500));
    return rp<T>(path, { ...init, _retry: true } as RequestInit);
  }
  if (res.status === 429) throw new ReporteiError("Limite de requisições do Reportei atingido. Tente em instantes.", 429);
  if (!res.ok) {
    console.error("[reportei]", path, res.status, (await res.text()).slice(0, 300));
    throw new ReporteiError("O Reportei não respondeu corretamente.", res.status);
  }
  return (await res.json()) as T;
}
const msg = (e: unknown) => (e instanceof ReporteiError ? e.message : "Falha ao consultar o Reportei.");

type Page<T> = { data: T[]; meta?: { last_page?: number } };
async function all<T>(path: string): Promise<T[]> {
  const out: T[] = [];
  for (let p = 1; p <= 5; p++) {
    const sep = path.includes("?") ? "&" : "?";
    const r = await rp<Page<T>>(`${path}${sep}per_page=100&page=${p}`);
    out.push(...r.data);
    if (!r.meta?.last_page || p >= r.meta.last_page) break;
  }
  return out;
}

type MetricDef = { id: string; reference_key: string; component: string; metrics: string[]; dimensions: unknown[]; filters?: unknown; custom?: unknown; type?: unknown };
// Catálogo de métricas muda raramente: cache curto por instância do servidor.
const catalogCache = new Map<string, { at: number; defs: MetricDef[] }>();
async function catalog(slug: string) {
  const c = catalogCache.get(slug);
  if (c && Date.now() - c.at < 6 * 3600e3) return c.defs;
  const defs = await all<MetricDef>(`/metrics?integration_slug=${encodeURIComponent(slug)}`);
  catalogCache.set(slug, { at: Date.now(), defs });
  return defs;
}

async function isTeam(ctx: { supabase: any; userId: string }) {
  const { data } = await ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "cliente" });
  return !data;
}
async function myOrg(ctx: { supabase: any; userId: string }): Promise<string | null> {
  const { data } = await ctx.supabase.from("profiles").select("org_id").eq("id", ctx.userId).maybeSingle();
  return data?.org_id ?? null;
}

/* ---------------- Conexão ---------------- */
export type ReporteiStatus = { configured: boolean; enabled: boolean; ok: boolean; companyName: string | null; error: string | null; checkedAt: string | null };

export const getReporteiStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { test?: boolean } | undefined) => ({ test: !!i?.test }))
  .handler(async ({ data, context }): Promise<ReporteiStatus> => {
    if (!(await isTeam(context))) throw new Error("Sem permissão");
    const org = await myOrg(context);
    const { data: row } = await context.supabase.from("reportei_connections" as never).select("enabled, company_name, last_checked_at").eq("org_id", org ?? "").maybeSingle();
    const r = row as { enabled: boolean; company_name: string | null; last_checked_at: string | null } | null;
    const configured = !!process.env["REPORTEI_API_TOKEN"];
    const base = { configured, enabled: !!r?.enabled, ok: false, companyName: r?.company_name ?? null, error: null as string | null, checkedAt: r?.last_checked_at ?? null };
    if (!data.test || !configured) return base;
    try {
      const s = await rp<{ company?: { name?: string } }>("/companies/settings");
      return { ...base, ok: true, companyName: s.company?.name ?? null };
    } catch (e) { return { ...base, error: msg(e) }; }
  });

export const setReporteiConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { enabled: boolean }) => ({ enabled: !!i.enabled }))
  .handler(async ({ data, context }) => {
    if (!(await isTeam(context))) throw new Error("Sem permissão");
    const org = await myOrg(context);
    if (!org) throw new Error("Organização não encontrada");
    let company: string | null = null;
    if (data.enabled) {
      try { company = (await rp<{ company?: { name?: string } }>("/companies/settings")).company?.name ?? null; }
      catch (e) { return { ok: false, error: msg(e) }; }
    }
    const { error } = await context.supabase.from("reportei_connections" as never)
      .upsert({ org_id: org, enabled: data.enabled, ...(data.enabled ? { company_name: company, last_checked_at: new Date().toISOString() } : {}) } as never);
    if (error) { console.error(error); return { ok: false, error: "Não foi possível salvar." }; }
    return { ok: true, error: null };
  });

/* ---------------- Projetos e vínculos ---------------- */
export const listReporteiProjects = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    if (!(await isTeam(context))) throw new Error("Sem permissão");
    try {
      const p = await all<{ id: number; name: string }>("/projects");
      return { projects: p.map((x) => ({ id: x.id, name: x.name })), error: null as string | null };
    } catch (e) { return { projects: [], error: msg(e) }; }
  });

export const linkReporteiProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { clienteId: string; projectId: number | null; projectName?: string }) => {
    if (!i.clienteId) throw new Error("clienteId obrigatório");
    return { clienteId: i.clienteId, projectId: i.projectId == null ? null : Number(i.projectId), projectName: (i.projectName ?? "").slice(0, 200) };
  })
  .handler(async ({ data, context }) => {
    if (!(await isTeam(context))) throw new Error("Sem permissão");
    const t = context.supabase.from("reportei_links" as never);
    if (data.projectId == null) {
      const { error } = await t.delete().eq("cliente_id", data.clienteId);
      return { ok: !error, error: error ? "Não foi possível desvincular." : null };
    }
    const { data: cli } = await context.supabase.from("clientes").select("org_id").eq("id", data.clienteId).maybeSingle();
    if (!cli?.org_id) return { ok: false, error: "Cliente não encontrado." };
    const { data: dup } = await context.supabase.from("reportei_links" as never).select("cliente_id").eq("project_id", data.projectId).neq("cliente_id", data.clienteId).maybeSingle();
    if (dup) return { ok: false, error: "Este projeto do Reportei já está vinculado a outro cliente." };
    const { error } = await context.supabase.from("reportei_links" as never)
      .upsert({ cliente_id: data.clienteId, org_id: cli.org_id, project_id: data.projectId, project_name: data.projectName } as never, { onConflict: "cliente_id" });
    if (error) { console.error(error); return { ok: false, error: "Não foi possível salvar o vínculo." }; }
    return { ok: true, error: null };
  });

export const listReporteiLinks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    if (!(await isTeam(context))) return [] as { cliente_id: string; project_id: number; project_name: string | null }[];
    const { data } = await context.supabase.from("reportei_links" as never).select("cliente_id, project_id, project_name");
    return (data ?? []) as unknown as { cliente_id: string; project_id: number; project_name: string | null }[];
  });

/* ---------------- Métricas ---------------- */
export type ReporteiMetric = { key: string; label: string; value: number | null; trend: number[]; warning: string | null };
export type ReporteiSource = { name: string; slug: string; network: string; metrics: ReporteiMetric[]; available: number; others: string[]; error: string | null };
export type ReporteiResult = {
  state: "not_linked" | "disabled" | "error" | "ok";
  error: string | null;
  projectName: string | null;
  sources: ReporteiSource[];
  reportUrl: string | null;
  fetchedAt: string;
};

const NETWORK: Record<string, string> = { instagram_business: "instagram", facebook: "facebook", facebook_ads: "facebook", tiktok: "tiktok", tiktok_business: "tiktok", youtube: "youtube", linkedin: "linkedin", linkedin_company: "linkedin" };
export const reporteiNetwork = (slug: string) => NETWORK[slug] ?? slug.split("_")[0];

const LABEL: Record<string, string> = {
  views: "Visualizações", reach: "Alcance", profile_views: "Visitas ao perfil", total_clicks: "Cliques", media_count: "Publicações",
  like_count: "Curtidas", comments_count: "Comentários", media_reach: "Alcance das publicações", media_engagement: "Engajamento das publicações",
  media_saved: "Salvamentos", followers_count: "Seguidores", new_followers_count: "Novos seguidores", current_followers_count: "Seguidores atuais",
  page_reach: "Alcance da página", page_media_views: "Visualizações", page_posts_count: "Publicações", page_follows: "Seguidores da página",
  page_post_engagements: "Engajamentos", spend: "Investimento", impressions: "Impressões", clicks: "Cliques", ctr: "CTR", cpc: "CPC", cpm: "CPM",
};
const labelOf = (ref: string) => {
  const k = ref.split(":").slice(1).join(":");
  return LABEL[k] ?? k.replace(/[_.]/g, " ").replace(/^\w/, (c) => c.toUpperCase());
};

export const getReporteiMetrics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: { clienteId?: string; start: string; end: string; network?: string }) => {
    const d = /^\d{4}-\d{2}-\d{2}$/;
    if (!d.test(i.start) || !d.test(i.end)) throw new Error("Período inválido");
    return { clienteId: i.clienteId ?? null, start: i.start, end: i.end, network: i.network ?? "" };
  })
  .handler(async ({ data, context }): Promise<ReporteiResult> => {
    const fetchedAt = new Date().toISOString();
    const empty = (state: ReporteiResult["state"], error: string | null = null): ReporteiResult => ({ state, error, projectName: null, sources: [], reportUrl: null, fetchedAt });
    const team = await isTeam(context);
    type Link = { project_id: number; project_name: string | null; org_id: string };
    let link: Link | null = null;
    let enabled = false;
    if (team) {
      if (!data.clienteId) return empty("not_linked");
      const { data: l } = await context.supabase.from("reportei_links" as never).select("project_id, project_name, org_id").eq("cliente_id", data.clienteId).maybeSingle();
      link = l as unknown as Link | null;
      if (link) {
        const { data: c } = await context.supabase.from("reportei_connections" as never).select("enabled").eq("org_id", link.org_id).maybeSingle();
        enabled = !!(c as { enabled?: boolean } | null)?.enabled;
      }
    } else {
      // Cliente: sempre o próprio cadastro, resolvido pelo banco (ignora clienteId enviado).
      const { data: own } = await context.supabase.rpc("current_cliente_id" as never);
      if (!own) return empty("not_linked");
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: l } = await supabaseAdmin.from("reportei_links" as never).select("project_id, project_name, org_id").eq("cliente_id", own as unknown as string).maybeSingle();
      link = l as unknown as Link | null;
      if (link) {
        const { data: c } = await supabaseAdmin.from("reportei_connections" as never).select("enabled").eq("org_id", link.org_id).maybeSingle();
        enabled = !!(c as { enabled?: boolean } | null)?.enabled;
      }
    }
    if (!link) return empty("not_linked");
    if (!enabled) return empty("disabled");

    try {
      const integ = await all<{ id: number; name: string; slug: string; status: string }>(`/integrations?project_id=${link.project_id}`);
      const chosen = integ.filter((i) => !data.network || reporteiNetwork(i.slug) === data.network);
      const one = async (i: (typeof chosen)[number]): Promise<ReporteiSource> => {
        const network = reporteiNetwork(i.slug);
        try {
          const defs = (await catalog(i.slug)).filter((m) => m.component === "number_v1" && (!m.dimensions || m.dimensions.length === 0));
          const pick = defs.slice(0, MAX_METRICS);
          const res = pick.length
            ? await rp<{ data: Record<string, { values?: number | null; trend?: { data?: number[] }; warning?: string }> }>("/metrics/get-data", {
                method: "POST",
                body: JSON.stringify({ start: data.start, end: data.end, integration_id: i.id, metrics: pick }),
              })
            : { data: {} };
          return {
            name: i.name, slug: i.slug, network, available: defs.length, error: null,
            others: defs.slice(MAX_METRICS).map((m) => labelOf(m.reference_key)),
            metrics: pick.map((m) => {
              const v = res.data?.[m.id];
              return { key: m.reference_key, label: labelOf(m.reference_key), value: typeof v?.values === "number" ? v.values : null, trend: v?.trend?.data ?? [], warning: v?.warning ? "Sem histórico disponível para este período." : null };
            }),
          };
        } catch (e) {
          return { name: i.name, slug: i.slug, network, metrics: [], available: 0, others: [], error: msg(e) };
        }
      };
      // Sequencial para respeitar o limite de 4 req/s do Reportei.
      const sources: ReporteiSource[] = [];
      for (const i of chosen) sources.push(await one(i));
      let reportUrl: string | null = null;
      if (team) {
        try {
          const reps = await rp<Page<{ external_url?: string; internal_url?: string }>>(`/reports?project_id=${link.project_id}&per_page=1`);
          reportUrl = reps.data[0]?.internal_url ?? null;
        } catch { /* ação secundária opcional */ }
      }
      return { state: "ok", error: null, projectName: team ? link.project_name : null, sources, reportUrl, fetchedAt };
    } catch (e) {
      return { ...empty("error", msg(e)) };
    }
  });
