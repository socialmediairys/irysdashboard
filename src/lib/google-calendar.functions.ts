import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { createHmac } from "crypto";

const SCOPES = [
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/calendar.events",
  "openid",
  "email",
].join(" ");

type GoogleOAuthConfig =
  | { ok: true; clientId: string; clientSecret: string; signingSecret: string }
  | { ok: false; error: string };

function readGoogleOAuthConfig(): GoogleOAuthConfig {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET?.trim();
  const signingSecret = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || process.env.LOVABLE_API_KEY?.trim();
  const missing = [
    ...(!clientId ? ["GOOGLE_OAUTH_CLIENT_ID"] : []),
    ...(!clientSecret ? ["GOOGLE_OAUTH_CLIENT_SECRET"] : []),
    ...(!signingSecret ? ["chave interna de assinatura"] : []),
  ];

  if (missing.length > 0) {
    console.error("Google Calendar OAuth configuration missing", { missing });
    return {
      ok: false,
      error: `Configuração do Google Calendar incompleta: ${missing.join(", ")}. Atualize as credenciais e reinicie o backend.`,
    };
  }

  return { ok: true, clientId, clientSecret, signingSecret };
}

function signState(userId: string, secret: string): string {
  const nonce = Math.random().toString(36).slice(2, 10);
  const payload = `${userId}.${nonce}`;
  const sig = createHmac("sha256", secret).update(payload).digest("hex");
  return Buffer.from(`${payload}.${sig}`).toString("base64url");
}

export const startGoogleCalendarAuth = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { origin: string }) => input)
  .handler(async ({ data, context }) => {
    const config = readGoogleOAuthConfig();
    if (!config.ok) return { ok: false as const, error: config.error };
    const redirectUri = `${data.origin}/api/public/google-calendar/callback`;
    const state = signState(context.userId, config.signingSecret);
    const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    url.searchParams.set("client_id", config.clientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", SCOPES);
    url.searchParams.set("access_type", "offline");
    url.searchParams.set("prompt", "consent");
    url.searchParams.set("include_granted_scopes", "true");
    url.searchParams.set("state", state);
    return { ok: true as const, url: url.toString() };
  });

export const getGoogleCalendarStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("google_calendar_tokens")
      .select("google_email, expires_at, scope")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw error;
    return { connected: !!data, email: data?.google_email ?? null };
  });

export const disconnectGoogleCalendar = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await context.supabase
      .from("google_calendar_tokens")
      .delete()
      .eq("user_id", context.userId);
    if (error) throw error;
    return { ok: true };
  });

async function refreshIfNeeded(row: {
  access_token: string;
  refresh_token: string;
  expires_at: string;
}, userId: string, supabase: any) {
  const expiresAt = new Date(row.expires_at).getTime();
  if (expiresAt - Date.now() > 60_000) return row.access_token;
  const config = readGoogleOAuthConfig();
  if (!config.ok) throw new Error(config.error);
  const params = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    refresh_token: row.refresh_token,
    grant_type: "refresh_token",
  });
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  if (!res.ok) throw new Error("Falha ao renovar token do Google");
  const t = (await res.json()) as { access_token: string; expires_in: number };
  const newExpires = new Date(Date.now() + t.expires_in * 1000).toISOString();
  await supabase
    .from("google_calendar_tokens")
    .update({ access_token: t.access_token, expires_at: newExpires })
    .eq("user_id", userId);
  return t.access_token;
}

export const listGoogleCalendarEvents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { timeMin?: string; timeMax?: string }) => input)
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("google_calendar_tokens")
      .select("access_token, refresh_token, expires_at")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw error;
    if (!row) return { connected: false, events: [] as any[] };
    const accessToken = await refreshIfNeeded(row, context.userId, context.supabase);
    const url = new URL("https://www.googleapis.com/calendar/v3/calendars/primary/events");
    url.searchParams.set("timeMin", data.timeMin ?? new Date().toISOString());
    if (data.timeMax) url.searchParams.set("timeMax", data.timeMax);
    url.searchParams.set("singleEvents", "true");
    url.searchParams.set("orderBy", "startTime");
    url.searchParams.set("maxResults", "50");
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new Error(`Google Calendar API erro ${res.status}`);
    const json = (await res.json()) as { items?: any[] };
    const events = (json.items ?? []).map((e) => ({
      id: e.id,
      title: e.summary ?? "(sem título)",
      start: e.start?.dateTime ?? e.start?.date,
      end: e.end?.dateTime ?? e.end?.date,
      allDay: !!e.start?.date,
      htmlLink: e.htmlLink,
      location: e.location ?? null,
      description: e.description ?? null,
    }));
    return { connected: true, events };
  });
