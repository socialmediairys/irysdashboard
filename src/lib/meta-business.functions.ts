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

export type MetaBusinessStatus = {
  connected: boolean;
  pageName: string | null;
  igUsername: string | null;
  updatedAt: string | null;
  pendingPages: Array<{ id: string; name: string; hasInstagram: boolean }> | null;
};

export const getMetaBusinessStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MetaBusinessStatus> => {
    const { data: conn, error } = await context.supabase
      .from("meta_business_connections")
      .select("page_name, ig_username, updated_at")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw error;

    if (conn) {
      return {
        connected: true,
        pageName: conn.page_name ?? null,
        igUsername: conn.ig_username ?? null,
        updatedAt: conn.updated_at ?? null,
        pendingPages: null,
      };
    }

    // Sem conexão final — verifica se há uma escolha de página pendente
    // (usuário administra mais de uma Página do Facebook).
    const { data: pending, error: pendErr } = await context.supabase
      .from("meta_business_pending")
      .select("pages")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (pendErr) throw pendErr;

    return {
      connected: false,
      pageName: null,
      igUsername: null,
      updatedAt: null,
      pendingPages: ((pending?.pages as unknown as Array<{ id: string; name: string; ig_user_id: string | null }>) ?? []).map(
        (p) => ({ id: p.id, name: p.name, hasInstagram: !!p.ig_user_id }),
      ),
    };
  });

export const selectMetaBusinessPage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { pageId: string }) => {
    const pageId = input.pageId?.trim();
    if (!pageId) throw new Error("pageId é obrigatório");
    return { pageId };
  })
  .handler(async ({ data, context }) => {
    const { data: pending, error: pendErr } = await context.supabase
      .from("meta_business_pending")
      .select("pages")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (pendErr) throw pendErr;
    if (!pending) throw new Error("Nenhuma seleção pendente encontrada. Conecte novamente.");

    type FullPage = {
      id: string;
      name: string;
      access_token: string;
      ig_user_id: string | null;
      ig_username: string | null;
    };
    const pages = (pending.pages as unknown as FullPage[]) ?? [];
    const chosen = pages.find((p) => p.id === data.pageId);
    if (!chosen) throw new Error("Página não encontrada na seleção. Conecte novamente.");

    const { error: upsertErr } = await context.supabase.from("meta_business_connections").upsert({
      user_id: context.userId,
      page_id: chosen.id,
      page_name: chosen.name,
      page_access_token: chosen.access_token,
      ig_user_id: chosen.ig_user_id,
      ig_username: chosen.ig_username,
    });
    if (upsertErr) throw upsertErr;

    await context.supabase.from("meta_business_pending").delete().eq("user_id", context.userId);

    return { ok: true as const, pageName: chosen.name, igUsername: chosen.ig_username };
  });

export const disconnectMetaBusiness = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await context.supabase.from("meta_business_connections").delete().eq("user_id", context.userId);
    await context.supabase.from("meta_business_pending").delete().eq("user_id", context.userId);
    return { ok: true as const };
  });

// Métricas básicas da conta do Instagram conectada (seguidores, nº de mídias).
// Base para a futura tela de "Métricas sociais" — publicar posts e insights
// por publicação ficam para uma próxima etapa.
export const getInstagramAccountInsights = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: conn, error } = await context.supabase
      .from("meta_business_connections")
      .select("ig_user_id, page_access_token")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw error;
    if (!conn || !conn.ig_user_id) {
      throw new Error("Instagram não conectado. Conecte em Configurações → Integrações.");
    }
    const url = new URL(`https://graph.facebook.com/${GRAPH_VERSION}/${conn.ig_user_id}`);
    url.searchParams.set("fields", "username,followers_count,follows_count,media_count");
    url.searchParams.set("access_token", conn.page_access_token);
    const res = await fetch(url.toString());
    const json = (await res.json()) as {
      error?: { message?: string };
      username?: string;
      followers_count?: number;
      follows_count?: number;
      media_count?: number;
    };
    if (!res.ok) throw new Error(json.error?.message || `Falha ao buscar métricas (HTTP ${res.status})`);
    return {
      username: json.username ?? null,
      followersCount: json.followers_count ?? null,
      followsCount: json.follows_count ?? null,
      mediaCount: json.media_count ?? null,
    };
  });
