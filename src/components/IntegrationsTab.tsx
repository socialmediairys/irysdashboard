import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  startGoogleCalendarAuth,
  getGoogleCalendarStatus,
  disconnectGoogleCalendar,
} from "@/lib/google-calendar.functions";
import {
  getWhatsappStatus,
  connectWhatsapp,
  disconnectWhatsapp,
  sendWhatsappTestMessage,
} from "@/lib/whatsapp.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Link as LinkIcon, LogOut, RefreshCw, CheckCircle2, Send } from "lucide-react";
import { toast } from "sonner";

type GStatus = { connected: boolean; email: string | null };
type WStatus = {
  connected: boolean;
  phoneNumber: string | null;
  name: string | null;
  phoneNumberId: string | null;
  wabaId: string | null;
  updatedAt: string | null;
};

const PLACEHOLDERS = [
  { key: "meta", ico: "📘", name: "Meta Business (Instagram/Facebook)", desc: "Publicar e coletar métricas de posts." },
  { key: "drive", ico: "🗂️", name: "Google Drive", desc: "Sincronizar mídias e documentos." },
  { key: "stripe", ico: "💳", name: "Stripe", desc: "Cobranças e assinaturas." },
];

export function IntegrationsTab() {
  const startAuth = useServerFn(startGoogleCalendarAuth);
  const getGStatus = useServerFn(getGoogleCalendarStatus);
  const disconnectG = useServerFn(disconnectGoogleCalendar);

  const getWStatusFn = useServerFn(getWhatsappStatus);
  const connectW = useServerFn(connectWhatsapp);
  const disconnectW = useServerFn(disconnectWhatsapp);
  const sendTest = useServerFn(sendWhatsappTestMessage);

  const [status, setStatus] = useState<GStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [wStatus, setWStatus] = useState<WStatus | null>(null);
  const [wLoading, setWLoading] = useState(true);
  const [wBusy, setWBusy] = useState(false);
  const [wOpen, setWOpen] = useState(false);
  const [wPhoneId, setWPhoneId] = useState("");
  const [wToken, setWToken] = useState("");
  const [wWabaId, setWWabaId] = useState("");
  const [testOpen, setTestOpen] = useState(false);
  const [testPhone, setTestPhone] = useState("");
  const [testBusy, setTestBusy] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      setStatus(await getGStatus());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao carregar status");
    } finally {
      setLoading(false);
    }
  };

  const refreshW = async () => {
    setWLoading(true);
    try {
      setWStatus(await getWStatusFn());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao carregar WhatsApp");
    } finally {
      setWLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    void refreshW();
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
      await disconnectG();
      toast.success("Google Calendar desconectado");
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao desconectar");
    } finally {
      setBusy(false);
    }
  };

  const handleWConnect = async () => {
    console.log("handleWConnect disparado", {
      phoneIdLen: wPhoneId.trim().length,
      tokenLen: wToken.trim().length,
      wabaIdLen: wWabaId.trim().length,
    });
    if (!wPhoneId.trim() || !wToken.trim() || !wWabaId.trim()) {
      toast.error("Preencha Phone Number ID, Access Token e WABA ID");
      return;
    }
    setWBusy(true);
    try {
      const r = await connectW({
        data: {
          phoneNumberId: wPhoneId.trim(),
          accessToken: wToken.trim(),
          wabaId: wWabaId.trim(),
        },
      });
      toast.success(`WhatsApp conectado${r.phoneNumber ? `: ${r.phoneNumber}` : ""}`);
      setWOpen(false);
      setWPhoneId("");
      setWToken("");
      setWWabaId("");
      await refreshW();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao conectar WhatsApp");
    } finally {
      setWBusy(false);
    }
  };

  const handleWDisconnect = async () => {
    if (!confirm("Desconectar o WhatsApp Business?")) return;
    setWBusy(true);
    try {
      await disconnectW();
      toast.success("WhatsApp desconectado");
      await refreshW();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao desconectar");
    } finally {
      setWBusy(false);
    }
  };

  const handleSendTest = async () => {
    if (!testPhone.trim()) {
      toast.error("Informe um telefone de destino");
      return;
    }
    setTestBusy(true);
    try {
      const r = await sendTest({ data: { toPhone: testPhone.trim() } });
      toast.success(`Mensagem de teste enviada para ${r.to}`);
      setTestOpen(false);
      setTestPhone("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao enviar mensagem de teste");
    } finally {
      setTestBusy(false);
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

      {/* Google Calendar */}
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

      {/* WhatsApp Business */}
      <div className="rounded-xl border p-4 bg-card">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-start gap-3">
            <span className="text-2xl">💬</span>
            <div>
              <div className="font-semibold flex items-center gap-2">
                WhatsApp Business
                {wStatus?.connected && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700">
                    <CheckCircle2 size={14} /> Conectado
                  </span>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                Conta via WhatsApp Business Cloud API (Meta).
              </div>
              {wStatus?.connected && (
                <div className="text-xs mt-1 space-y-0.5">
                  {wStatus.phoneNumber && (
                    <div>
                      Número: <span className="font-medium">{wStatus.phoneNumber}</span>
                    </div>
                  )}
                  {wStatus.name && (
                    <div>
                      Conta: <span className="font-medium">{wStatus.name}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {wLoading ? (
              <Button size="sm" variant="outline" disabled>
                <Loader2 className="h-4 w-4 animate-spin" />
              </Button>
            ) : wStatus?.connected ? (
              <>
                <Button size="sm" variant="outline" onClick={refreshW} disabled={wBusy}>
                  <RefreshCw size={14} className="mr-1" /> Atualizar
                </Button>
                <Button size="sm" variant="outline" onClick={handleWDisconnect} disabled={wBusy}>
                  {wBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut size={14} className="mr-1" />}
                  Desconectar
                </Button>
              </>
            ) : (
              <Button size="sm" onClick={() => setWOpen(true)} disabled={wBusy}>
                <LinkIcon size={14} className="mr-1" /> Conectar
              </Button>
            )}
          </div>
        </div>
      </div>

      <Dialog open={wOpen} onOpenChange={setWOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conectar WhatsApp Business</DialogTitle>
            <DialogDescription>
              Informe o <span className="font-medium">Phone Number ID</span> e um{" "}
              <span className="font-medium">Access Token</span> permanente do seu app no
              Meta for Developers. Validamos as credenciais antes de salvar.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="wa-phone-id">Phone Number ID</Label>
              <Input
                id="wa-phone-id"
                value={wPhoneId}
                onChange={(e) => setWPhoneId(e.target.value)}
                placeholder="Ex.: 1234567890"
                disabled={wBusy}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="wa-token">Access Token</Label>
              <Input
                id="wa-token"
                type="password"
                value={wToken}
                onChange={(e) => setWToken(e.target.value)}
                placeholder="EAAG..."
                disabled={wBusy}
              />
              <p className="text-xs text-muted-foreground">
                Obtido em Meta for Developers → seu App → WhatsApp → API Setup.
              </p>
            </div>
            <div className="space-y-1">
              <Label htmlFor="wa-waba-id">WABA ID</Label>
              <Input
                id="wa-waba-id"
                value={wWabaId}
                onChange={(e) => setWWabaId(e.target.value)}
                placeholder="Ex.: 1234567890123456"
                disabled={wBusy}
              />
              <p className="text-xs text-muted-foreground">
                Obtido em Meta for Developers → seu App → WhatsApp → API Setup → WhatsApp Business Account ID.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWOpen(false)} disabled={wBusy}>
              Cancelar
            </Button>
            <Button onClick={handleWConnect} disabled={wBusy}>
              {wBusy ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Conectar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
