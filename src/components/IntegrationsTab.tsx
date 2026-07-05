import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  startGoogleCalendarAuth,
  getGoogleCalendarStatus,
  disconnectGoogleCalendar,
} from "@/lib/google-calendar.functions";
import { Button } from "@/components/ui/button";
import { Loader2, Link as LinkIcon, LogOut, RefreshCw, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

type GStatus = { connected: boolean; email: string | null };

const PLACEHOLDERS = [
  { key: "meta", ico: "📘", name: "Meta Business (Instagram/Facebook)", desc: "Publicar e coletar métricas de posts." },
  { key: "whatsapp", ico: "💬", name: "WhatsApp Business", desc: "Enviar mensagens e receber leads." },
  { key: "drive", ico: "🗂️", name: "Google Drive", desc: "Sincronizar mídias e documentos." },
  { key: "stripe", ico: "💳", name: "Stripe", desc: "Cobranças e assinaturas." },
];

export function IntegrationsTab() {
  const startAuth = useServerFn(startGoogleCalendarAuth);
  const getStatus = useServerFn(getGoogleCalendarStatus);
  const disconnect = useServerFn(disconnectGoogleCalendar);

  const [status, setStatus] = useState<GStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      setStatus(await getStatus());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao carregar status");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const handleConnect = async () => {
    setBusy(true);
    try {
      const r = await startAuth({ data: { origin: window.location.origin } });
      if (!r.ok) {
        toast.error(r.error);
        setBusy(false);
        return;
      }
      window.location.href = r.url;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao conectar");
      setBusy(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Desconectar o Google Calendar?")) return;
    setBusy(true);
    try {
      await disconnect();
      toast.success("Google Calendar desconectado");
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao desconectar");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-extrabold text-lg">Integrações</h3>
        <p className="text-sm text-muted-foreground">
          Conecte serviços externos à sua conta. Os tokens ficam vinculados ao seu usuário.
        </p>
      </div>

      {/* Google Calendar — real */}
      <div className="rounded-xl border p-4 bg-card">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-start gap-3">
            <span className="text-2xl">📅</span>
            <div>
              <div className="font-semibold flex items-center gap-2">
                Google Calendar
                {status?.connected && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700">
                    <CheckCircle2 size={14} /> Conectado
                  </span>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                Sincroniza sua agenda pessoal com o painel.
              </div>
              {status?.connected && status.email && (
                <div className="text-xs mt-1">
                  Conta: <span className="font-medium">{status.email}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {loading ? (
              <Button size="sm" variant="outline" disabled>
                <Loader2 className="h-4 w-4 animate-spin" />
              </Button>
            ) : status?.connected ? (
              <>
                <Button size="sm" variant="outline" onClick={refresh} disabled={busy}>
                  <RefreshCw size={14} className="mr-1" /> Atualizar
                </Button>
                <Button size="sm" variant="outline" onClick={handleDisconnect} disabled={busy}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut size={14} className="mr-1" />}
                  Desconectar
                </Button>
              </>
            ) : (
              <Button size="sm" onClick={handleConnect} disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <LinkIcon size={14} className="mr-1" />}
                Conectar
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Placeholders */}
      <div className="space-y-2">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">Em breve</div>
        {PLACEHOLDERS.map((it) => (
          <div
            key={it.key}
            className="flex items-center justify-between p-3 rounded-xl border bg-muted/30"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">{it.ico}</span>
              <div>
                <div className="font-semibold">{it.name}</div>
                <div className="text-xs text-muted-foreground">{it.desc}</div>
              </div>
            </div>
            <Button size="sm" variant="outline" disabled>
              Em breve
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
