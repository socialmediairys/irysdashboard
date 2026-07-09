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

// Métricas básicas da conta do Instagram vinculada à Página do cliente informado.
export const getInstagramAccountInsights = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { clientId: string }) => {
    const clientId = input.clientId?.trim();
    if (!clientId) throw new Error("clientId é obrigatório");
    return { clientId };
  })
  .handler(async ({ data, context }) => {
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
    const url = new URL(`https://graph.facebook.com/${GRAPH_VERSION}/${page.ig_user_id}`);
    url.searchParams.set("fields", "username,followers_count,follows_count,media_count");
    url.searchParams.set("access_token", page.page_access_token);
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
