import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createHmac } from "crypto";

const GRAPH_VERSION = "v20.0";

// Escopos necessários para publicar no Instagram e ler métricas básicas via
// a Página do Facebook vinculada. Nota: instagram_content_publish e
// business_management são permissões avançadas — para contas fora do time
// de desenvolvedores do seu App da Meta, é preciso passar pelo App Review.
const SCOPES = [
  "pages_show_list",
  "pages_read_engagement",
  "instagram_basic",
  "instagram_content_publish",
  "business_management",
].join(",");

type MetaOAuthConfig =
  | { ok: true; appId: string; appSecret: string; signingSecret: string }
  | { ok: false; error: string };

function readMetaOAuthConfig(): MetaOAuthConfig {
  const appId = process.env.META_APP_ID?.trim();
  const appSecret = process.env.META_APP_SECRET?.trim();
  const signingSecret = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || process.env.LOVABLE_API_KEY?.trim();
  const missing = [
    ...(!appId ? ["META_APP_ID"] : []),
    ...(!appSecret ? ["META_APP_SECRET"] : []),
    ...(!signingSecret ? ["chave interna de assinatura"] : []),
  ];
  if (!appId || !appSecret || !signingSecret) {
    console.error("Meta Business OAuth configuration missing", { missing });
    return {
      ok: false,
      error: `Configuração do Meta Business incompleta: ${missing.join(", ")}. Adicione as credenciais em Cloud → Secrets.`,
    };
  }
  return { ok: true, appId, appSecret, signingSecret };
}

function signState(userId: string, secret: string): string {
  const nonce = Math.random().toString(36).slice(2, 10);
  const payload = `${userId}.${nonce}`;
  const sig = createHmac("sha256", secret).update(payload).digest("hex");
  return Buffer.from(`${payload}.${sig}`).toString("base64url");
}

export const startMetaBusinessAuth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { origin: string }) => input)
  .handler(async ({ data, context }) => {
    const config = readMetaOAuthConfig();
    if (!config.ok) return { ok: false as const, error: config.error };
    const redirectUri = `${data.origin}/api/public/meta-business/callback`;
    const state = signState(context.userId, config.signingSecret);
    const url = new URL(`https://www.facebook.com/${GRAPH_VERSION}/dialog/oauth`);
    url.searchParams.set("client_id", config.appId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", SCOPES);
    url.searchParams.set("state", state);
    return { ok: true as const, url: url.toString() };
  });

export type MetaBusinessPage = {
  id: string;
  pageId: string;
  pageName: string | null;
  igUsername: string | null;
  hasInstagram: boolean;
  clientId: string | null;
  clientName: string | null;
  updatedAt: string | null;
};

export type MetaBusinessStatus = {
  connected: boolean;
  pagesCount: number;
  updatedAt: string | null;
};

export const getMetaBusinessStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MetaBusinessStatus> => {
    const { data, error } = await context.supabase
      .from("meta_business_pages")
      .select("updated_at")
      .eq("user_id", context.userId)
      .order("updated_at", { ascending: false });
    if (error) throw error;
    const rows = data ?? [];
    return {
      connected: rows.length > 0,
      pagesCount: rows.length,
      updatedAt: rows[0]?.updated_at ?? null,
    };
  });

export const getMetaBusinessPages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MetaBusinessPage[]> => {
    const { data, error } = await context.supabase
      .from("meta_business_pages")
      .select("id, page_id, page_name, ig_user_id, ig_username, client_id, updated_at, clientes(nome)")
      .eq("user_id", context.userId)
      .order("page_name", { ascending: true });
    if (error) throw error;
    return (data ?? []).map((r) => ({
      id: r.id,
      pageId: r.page_id,
      pageName: r.page_name,
      igUsername: r.ig_username,
      hasInstagram: !!r.ig_user_id,
      clientId: r.client_id,
      clientName: (r.clientes as { nome: string | null } | null)?.nome ?? null,
      updatedAt: r.updated_at,
    }));
  });

export const setMetaBusinessPageClient = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { pageRowId: string; clientId: string | null }) => {
    const pageRowId = input.pageRowId?.trim();
    if (!pageRowId) throw new Error("pageRowId é obrigatório");
    return { pageRowId, clientId: input.clientId?.trim() || null };
  })
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("meta_business_pages")
      .update({ client_id: data.clientId })
      .eq("id", data.pageRowId)
      .eq("user_id", context.userId);
    if (error) throw error;
    return { ok: true as const };
  });

export const disconnectMetaBusiness = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await context.supabase
      .from("meta_business_pages")
      .delete()
      .eq("user_id", context.userId);
    if (error) throw error;
    return { ok: true as const };
  });

export type InstagramPostMetrics = {
  id: string;
  caption: string | null;
  mediaType: string | null;
  permalink: string | null;
  timestamp: string | null;
  likes: number | null;
  comments: number | null;
  reach: number | null;
  saved: number | null;
  engagementRate: number | null; // 0..1
};

export type InstagramAccountInsights = {
  username: string | null;
  followersCount: number | null;
  followsCount: number | null;
  mediaCount: number | null;
  avgEngagementRate: number | null; // 0..1 across sampled posts
  followerGrowth: number | null;    // net delta in the selected period (days)
  periodDays: number;
  posts: InstagramPostMetrics[];
};

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url);
    const json = (await res.json()) as T & { error?: { message?: string } };
    if (!res.ok) {
      console.warn("meta insights request failed", { status: res.status, error: (json as { error?: unknown }).error });
      return null;
    }
    return json;
  } catch (e) {
    console.warn("meta insights request threw", e);
    return null;
  }
}

// Métricas básicas da conta do Instagram vinculada à Página do cliente informado.
export const getInstagramAccountInsights = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { clientId: string; periodDays?: number }) => {
    const clientId = input.clientId?.trim();
    if (!clientId) throw new Error("clientId é obrigatório");
    const periodDays = Math.min(Math.max(Number(input.periodDays) || 30, 1), 90);
    return { clientId, periodDays };
  })
  .handler(async ({ data, context }): Promise<InstagramAccountInsights> => {
    const { data: page, error } = await context.supabase
      .from("meta_business_pages")
      .select("ig_user_id, page_access_token")
      .eq("user_id", context.userId)
      .eq("client_id", data.clientId)
      .maybeSingle();
    if (error) throw error;
    if (!page) {
      throw new Error(
        "Nenhuma Página do Meta Business vinculada a este cliente ainda. Vincule em Configurações → Integrações.",
      );
    }
    if (!page.ig_user_id) {
      throw new Error("A Página vinculada não tem uma Conta Business do Instagram.");
    }

    const token = page.page_access_token;
    const igId = page.ig_user_id;

    // 1) Conta: username, followers_count, follows_count, media_count
    const accountUrl = new URL(`https://graph.facebook.com/${GRAPH_VERSION}/${igId}`);
    accountUrl.searchParams.set("fields", "username,followers_count,follows_count,media_count");
    accountUrl.searchParams.set("access_token", token);
    const account = await fetchJson<{
      username?: string;
      followers_count?: number;
      follows_count?: number;
      media_count?: number;
    }>(accountUrl.toString());

    // 2) Crescimento de seguidores no período (métrica follower_count, period=day)
    let followerGrowth: number | null = null;
    try {
      const until = Math.floor(Date.now() / 1000);
      const since = until - data.periodDays * 24 * 60 * 60;
      const growthUrl = new URL(`https://graph.facebook.com/${GRAPH_VERSION}/${igId}/insights`);
      growthUrl.searchParams.set("metric", "follower_count");
      growthUrl.searchParams.set("period", "day");
      growthUrl.searchParams.set("since", String(since));
      growthUrl.searchParams.set("until", String(until));
      growthUrl.searchParams.set("access_token", token);
      const growth = await fetchJson<{
        data?: Array<{ values?: Array<{ value?: number }> }>;
      }>(growthUrl.toString());
      const values = growth?.data?.[0]?.values ?? [];
      if (values.length > 0) {
        followerGrowth = values.reduce((acc, v) => acc + (typeof v.value === "number" ? v.value : 0), 0);
      }
    } catch (e) {
      console.warn("follower_count insights failed", e);
    }

    // 3) Últimas publicações + insights (reach, saved) por post
    const posts: InstagramPostMetrics[] = [];
    let avgEngagementRate: number | null = null;
    try {
      const mediaUrl = new URL(`https://graph.facebook.com/${GRAPH_VERSION}/${igId}/media`);
      mediaUrl.searchParams.set(
        "fields",
        "id,caption,media_type,permalink,timestamp,like_count,comments_count",
      );
      mediaUrl.searchParams.set("limit", "12");
      mediaUrl.searchParams.set("access_token", token);
      const media = await fetchJson<{
        data?: Array<{
          id: string;
          caption?: string;
          media_type?: string;
          permalink?: string;
          timestamp?: string;
          like_count?: number;
          comments_count?: number;
        }>;
      }>(mediaUrl.toString());
      const items = media?.data ?? [];

      const enriched = await Promise.all(
        items.map(async (m) => {
          const insightsUrl = new URL(`https://graph.facebook.com/${GRAPH_VERSION}/${m.id}/insights`);
          insightsUrl.searchParams.set("metric", "reach,saved");
          insightsUrl.searchParams.set("access_token", token);
          const ins = await fetchJson<{
            data?: Array<{ name: string; values?: Array<{ value?: number }> }>;
          }>(insightsUrl.toString());
          let reach: number | null = null;
          let saved: number | null = null;
          for (const row of ins?.data ?? []) {
            const v = typeof row.values?.[0]?.value === "number" ? row.values[0].value : null;
            if (row.name === "reach") reach = v;
            if (row.name === "saved") saved = v;
          }
          const likes = typeof m.like_count === "number" ? m.like_count : null;
          const comments = typeof m.comments_count === "number" ? m.comments_count : null;
          let engagementRate: number | null = null;
          if (reach && reach > 0) {
            engagementRate = ((likes ?? 0) + (comments ?? 0) + (saved ?? 0)) / reach;
          }
          return {
            id: m.id,
            caption: m.caption ?? null,
            mediaType: m.media_type ?? null,
            permalink: m.permalink ?? null,
            timestamp: m.timestamp ?? null,
            likes,
            comments,
            reach,
            saved,
            engagementRate,
          } satisfies InstagramPostMetrics;
        }),
      );
      posts.push(...enriched);

      const rates = enriched.map((p) => p.engagementRate).filter((r): r is number => typeof r === "number");
      if (rates.length > 0) {
        avgEngagementRate = rates.reduce((a, b) => a + b, 0) / rates.length;
      }
    } catch (e) {
      console.warn("media insights failed", e);
    }

    return {
      username: account?.username ?? null,
      followersCount: typeof account?.followers_count === "number" ? account.followers_count : null,
      followsCount: typeof account?.follows_count === "number" ? account.follows_count : null,
      mediaCount: typeof account?.media_count === "number" ? account.media_count : null,
      avgEngagementRate,
      followerGrowth,
      periodDays: data.periodDays,
      posts,
    };
  });

