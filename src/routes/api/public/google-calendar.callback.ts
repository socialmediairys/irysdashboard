import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";

function verifyState(state: string): string | null {
  try {
    const secret = process.env.SUPABASE_SERVICE_ROLE_KEY!;
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
    `<!doctype html><html><head><meta charset="utf-8"><title>Google Calendar</title></head><body style="font-family:system-ui;padding:2rem;background:#EDEAE5;color:#2C1505">${body}</body></html>`,
    { status, headers: { "content-type": "text/html; charset=utf-8" } },
  );
}

export const Route = createFileRoute("/api/public/google-calendar/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        const errParam = url.searchParams.get("error");
        if (errParam) return html(`<h1>Autorização cancelada</h1><p>${errParam}</p><a href="/">Voltar</a>`, 400);
        if (!code || !state) return html("<h1>Requisição inválida</h1>", 400);
        const userId = verifyState(state);
        if (!userId) return html("<h1>Estado inválido ou expirado</h1>", 400);

        const redirectUri = `${url.origin}/api/public/google-calendar/callback`;
        const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            code,
            client_id: process.env.GOOGLE_OAUTH_CLIENT_ID!,
            client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET!,
            redirect_uri: redirectUri,
            grant_type: "authorization_code",
          }).toString(),
        });
        if (!tokenRes.ok) {
          const t = await tokenRes.text();
          console.error("google token exchange failed", t);
          return html("<h1>Falha ao trocar código por token</h1>", 500);
        }
        const tokens = (await tokenRes.json()) as {
          access_token: string;
          refresh_token?: string;
          expires_in: number;
          scope: string;
        };

        let googleEmail: string | null = null;
        try {
          const uinfo = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
          });
          if (uinfo.ok) {
            const j = (await uinfo.json()) as { email?: string };
            googleEmail = j.email ?? null;
          }
        } catch {}

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

        // Se veio sem refresh_token (reconexão), preserva o anterior
        let refreshToken = tokens.refresh_token;
        if (!refreshToken) {
          const { data: existing } = await supabaseAdmin
            .from("google_calendar_tokens")
            .select("refresh_token")
            .eq("user_id", userId)
            .maybeSingle();
          refreshToken = existing?.refresh_token;
        }
        if (!refreshToken) {
          return html(
            "<h1>Reautorize com prompt=consent</h1><p>Não recebemos refresh_token. Desconecte e tente de novo.</p>",
            400,
          );
        }

        const { error } = await supabaseAdmin.from("google_calendar_tokens").upsert({
          user_id: userId,
          access_token: tokens.access_token,
          refresh_token: refreshToken,
          expires_at: expiresAt,
          scope: tokens.scope,
          google_email: googleEmail,
        });
        if (error) {
          console.error("upsert token error", error);
          return html("<h1>Falha ao salvar tokens</h1>", 500);
        }

        return new Response(null, {
          status: 302,
          headers: { location: "/admin/visao-geral?gcal=connected" },
        });
      },
    },
  },
});
