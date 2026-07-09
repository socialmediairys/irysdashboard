import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";

const GRAPH_VERSION = "v20.0";

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
    console.error("Meta Business callback configuration missing", { missing });
    return {
      ok: false,
      error: `Configuração do Meta Business incompleta: ${missing.join(", ")}. Adicione as credenciais em Cloud → Secrets.`,
    };
  }
  return { ok: true, appId, appSecret, signingSecret };
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char] ?? char);
}

function verifyState(state: string, secret: string): string | null {
  try {
    const decoded = Buffer.from(state, "base64url").toString("utf8");
    const parts = decoded.split(".");
    if (parts.length !== 3) return null;
    const [userId, nonce, sig] = parts;
    const expected = createHmac("sha256", secret).update(`${userId}.${nonce}`).digest("hex");
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    return userId;
  } catch {
    return null;
  }
}

function html(body: string, status = 200) {
  return new Response(
    `<!doctype html><html><head><meta charset="utf-8"><title>Meta Business</title></head><body style="font-family:system-ui;padding:2rem;background:#EDEAE5;color:#2C1505">${body}</body></html>`,
    { status, headers: { "content-type": "text/html; charset=utf-8" } },
  );
}

type PageWithInstagram = {
  id: string;
  name: string;
  access_token: string;
  ig_user_id: string | null;
  ig_username: string | null;
};

async function fetchPagesWithInstagram(userAccessToken: string): Promise<PageWithInstagram[]> {
  const url = new URL(`https://graph.facebook.com/${GRAPH_VERSION}/me/accounts`);
  url.searchParams.set("fields", "id,name,access_token,instagram_business_account{id,username}");
  url.searchParams.set("access_token", userAccessToken);
  const res = await fetch(url.toString());
  const json = (await res.json()) as {
    error?: { message?: string };
    data?: Array<{
      id: string;
      name: string;
      access_token: string;
      instagram_business_account?: { id: string; username: string };
    }>;
  };
  if (!res.ok) throw new Error(json.error?.message || `Falha ao listar Páginas (HTTP ${res.status})`);
  return (json.data ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    access_token: p.access_token,
    ig_user_id: p.instagram_business_account?.id ?? null,
    ig_username: p.instagram_business_account?.username ?? null,
  }));
}

export const Route = createFileRoute("/api/public/meta-business/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        const errParam = url.searchParams.get("error_message") || url.searchParams.get("error");
        if (errParam) return html(`<h1>Autorização cancelada</h1><p>${escapeHtml(errParam)}</p><a href="/">Voltar</a>`, 400);
        if (!code || !state) return html("<h1>Requisição inválida</h1>", 400);

        const config = readMetaOAuthConfig();
        if (!config.ok) return html(`<h1>Configuração incompleta</h1><p>${escapeHtml(config.error)}</p>`, 500);

        const userId = verifyState(state, config.signingSecret);
        if (!userId) return html("<h1>Estado inválido ou expirado</h1>", 400);

        const redirectUri = `${url.origin}/api/public/meta-business/callback`;

        // 1) Troca o "code" por um token de usuário de curta duração
        const shortTokenUrl = new URL(`https://graph.facebook.com/${GRAPH_VERSION}/oauth/access_token`);
        shortTokenUrl.searchParams.set("client_id", config.appId);
        shortTokenUrl.searchParams.set("client_secret", config.appSecret);
        shortTokenUrl.searchParams.set("redirect_uri", redirectUri);
        shortTokenUrl.searchParams.set("code", code);
        const shortRes = await fetch(shortTokenUrl.toString());
        const shortJson = (await shortRes.json()) as { access_token?: string; error?: { message?: string } };
        if (!shortRes.ok || !shortJson.access_token) {
          console.error("meta short token exchange failed", shortJson);
          return html("<h1>Falha ao trocar código por token</h1>", 500);
        }

        // 2) Troca por um token de usuário de longa duração (~60 dias)
        const longTokenUrl = new URL(`https://graph.facebook.com/${GRAPH_VERSION}/oauth/access_token`);
        longTokenUrl.searchParams.set("grant_type", "fb_exchange_token");
        longTokenUrl.searchParams.set("client_id", config.appId);
        longTokenUrl.searchParams.set("client_secret", config.appSecret);
        longTokenUrl.searchParams.set("fb_exchange_token", shortJson.access_token);
        const longRes = await fetch(longTokenUrl.toString());
        const longJson = (await longRes.json()) as { access_token?: string; error?: { message?: string } };
        const userAccessToken = longRes.ok && longJson.access_token ? longJson.access_token : shortJson.access_token;

        // 3) Lista as Páginas do Facebook administradas e a Instagram Business
        //    Account vinculada a cada uma (os tokens de página retornados aqui
        //    já são de longa duração quando o token de usuário também é).
        let pages: PageWithInstagram[];
        try {
          pages = await fetchPagesWithInstagram(userAccessToken);
        } catch (e) {
          console.error("failed to list pages", e);
          return html("<h1>Falha ao listar suas Páginas do Facebook</h1>", 500);
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        if (pages.length === 0) {
          return html(
            "<h1>Nenhuma Página do Facebook encontrada</h1><p>Você precisa ser administrador de ao menos uma Página do Facebook com uma Conta Business do Instagram vinculada.</p><a href=\"/admin/visao-geral?tab=integracoes\">Voltar</a>",
            400,
          );
        }

        if (pages.length === 1) {
          // Só uma página: conecta direto, sem precisar escolher.
          const p = pages[0];
          const { error } = await supabaseAdmin.from("meta_business_connections").upsert({
            user_id: userId,
            page_id: p.id,
            page_name: p.name,
            page_access_token: p.access_token,
            ig_user_id: p.ig_user_id,
            ig_username: p.ig_username,
          });
          if (error) {
            console.error("upsert meta connection error", error);
            return html("<h1>Falha ao salvar conexão</h1>", 500);
          }
          await supabaseAdmin.from("meta_business_pending").delete().eq("user_id", userId);
          return new Response(null, {
            status: 302,
            headers: { location: "/admin/visao-geral?tab=integracoes&meta=connected" },
          });
        }

        // Mais de uma página: guarda a lista e deixa o usuário escolher na tela.
        const { error: pendingErr } = await supabaseAdmin.from("meta_business_pending").upsert({
          user_id: userId,
          pages,
        });
        if (pendingErr) {
          console.error("upsert meta pending error", pendingErr);
          return html("<h1>Falha ao salvar suas Páginas</h1>", 500);
        }
        return new Response(null, {
          status: 302,
          headers: { location: "/admin/visao-geral?tab=integracoes&meta=choose-page" },
        });
      },
    },
  },
});
