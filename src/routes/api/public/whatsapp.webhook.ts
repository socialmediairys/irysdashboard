import { createFileRoute } from "@tanstack/react-router";

// Meta WhatsApp Cloud API webhook
// - GET: verifica o webhook (hub.challenge)
// - POST: recebe eventos de status (sent/delivered/read/failed) e atualiza whatsapp_envios

type StatusEvent = {
  id: string; // wamid retornado pela Meta no envio
  status: "sent" | "delivered" | "read" | "failed";
  timestamp: string;
  errors?: Array<{ code?: number; title?: string; message?: string; error_data?: { details?: string } }>;
};

type WebhookPayload = {
  object?: string;
  entry?: Array<{
    changes?: Array<{
      value?: {
        statuses?: StatusEvent[];
      };
    }>;
  }>;
};

export const Route = createFileRoute("/api/public/whatsapp/webhook")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
        const url = new URL(request.url);
        const mode = url.searchParams.get("hub.mode");
        const token = url.searchParams.get("hub.verify_token");
        const challenge = url.searchParams.get("hub.challenge");
        if (mode === "subscribe" && token && verifyToken && token === verifyToken) {
          return new Response(challenge ?? "", { status: 200 });
        }
        return new Response("Forbidden", { status: 403 });
      },
      POST: async ({ request }) => {
        let payload: WebhookPayload;
        try {
          payload = (await request.json()) as WebhookPayload;
        } catch {
          return new Response("Bad Request", { status: 400 });
        }

        const statuses: StatusEvent[] = [];
        for (const entry of payload.entry ?? []) {
          for (const change of entry.changes ?? []) {
            for (const s of change.value?.statuses ?? []) {
              statuses.push(s);
            }
          }
        }
        if (statuses.length === 0) {
          return Response.json({ ok: true, processed: 0 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        let processed = 0;
        for (const s of statuses) {
          const ts = s.timestamp ? new Date(Number(s.timestamp) * 1000).toISOString() : new Date().toISOString();
          const patch: {
            delivery_status: "sent" | "delivered" | "read" | "failed";
            delivered_at?: string;
            read_at?: string;
            failed_at?: string;
            failure_reason?: string;
          } = { delivery_status: s.status };
          if (s.status === "delivered") patch.delivered_at = ts;
          if (s.status === "read") patch.read_at = ts;
          if (s.status === "failed") {
            patch.failed_at = ts;
            const err = s.errors?.[0];
            patch.failure_reason = err?.error_data?.details || err?.message || err?.title || "Falha reportada pela Meta";
          }
          const { error } = await supabaseAdmin
            .from("whatsapp_envios")
            .update(patch)
            .eq("meta_message_id", s.id);
          if (!error) processed++;
        }
        return Response.json({ ok: true, processed });
      },
    },
  },
});
