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
