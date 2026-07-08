import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import {
  listFasesComTopicos,
  listConteudosCliente,
  createConteudoCliente,
  deleteConteudoCliente,
  regenerarSlugCliente,
  type Fase,
  type Topico,
  type Conteudo,
  type ConteudoTipo,
} from "@/lib/portal-conteudos.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { FileUploader } from "@/components/FileUploader";
import { toast } from "sonner";
import { Copy, ExternalLink, Loader2, RefreshCw, Trash2, Video, FileText, Headphones } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/portal-conteudos")({
  component: PortalConteudosPage,
});

type ClienteRef = { id: string; nome: string; slug: string | null };

function PortalConteudosPage() {
  const [clientes, setClientes] = useState<ClienteRef[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [fases, setFases] = useState<Fase[]>([]);
  const [topicos, setTopicos] = useState<Topico[]>([]);
  const [conteudos, setConteudos] = useState<Conteudo[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingConteudos, setLoadingConteudos] = useState(false);

  const listFases = useServerFn(listFasesComTopicos);
  const listConteudos = useServerFn(listConteudosCliente);
  const regenerarSlug = useServerFn(regenerarSlugCliente);

  const selected = clientes.find((c) => c.id === selectedId) ?? null;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [{ data: cliData }, meta] = await Promise.all([
        supabase.from("clientes").select("id, nome, slug").order("nome"),
        listFases(),
      ]);
      setClientes((cliData ?? []) as ClienteRef[]);
      setFases(meta.fases);
      setTopicos(meta.topicos);
      if (cliData && cliData.length > 0 && !selectedId) setSelectedId(cliData[0].id);
      setLoading(false);
    };
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshConteudos = async (clienteId: string) => {
    setLoadingConteudos(true);
    try {
      const rows = await listConteudos({ data: { clienteId } });
      setConteudos(rows);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao carregar conteúdos");
    } finally {
      setLoadingConteudos(false);
    }
  };

  useEffect(() => {
    if (selectedId) void refreshConteudos(selectedId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  // Realtime: qualquer INSERT/UPDATE/DELETE em conteudos_cliente do cliente selecionado
  // atualiza a lista automaticamente, sem precisar de refresh manual.
  useEffect(() => {
    if (!selectedId) return;
    const channel = supabase
      .channel(`conteudos-cliente-${selectedId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conteudos_cliente", filter: `cliente_id=eq.${selectedId}` },
        () => { void refreshConteudos(selectedId); },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);


  const topicosPorFase = useMemo(() => {
    const m: Record<number, Topico[]> = {};
    for (const t of topicos) {
      if (!m[t.fase_id]) m[t.fase_id] = [];
      m[t.fase_id].push(t);
    }
    return m;
  }, [topicos]);

  const conteudosPorTopico = useMemo(() => {
    const m: Record<string, Conteudo[]> = {};
    for (const c of conteudos) {
      if (!m[c.topico_id]) m[c.topico_id] = [];
      m[c.topico_id].push(c);
    }
    return m;
  }, [conteudos]);

  const portalUrl = selected?.slug ? `${typeof window !== "undefined" ? window.location.origin : ""}/portal/${selected.slug}` : null;

  const copyPortalUrl = async () => {
    if (!portalUrl) return;
    try {
      await navigator.clipboard.writeText(portalUrl);
      toast.success("Link do portal copiado!");
    } catch {
      toast.error("Não consegui copiar. Copie manualmente o link.");
    }
  };

  const handleRegenSlug = async () => {
    if (!selectedId) return;
    const custom = prompt("Novo slug (deixe em branco para gerar aleatório):", selected?.slug ?? "");
    if (custom === null) return;
    try {
      const r = await regenerarSlug({ data: { clienteId: selectedId, slug: custom || null } });
      toast.success(`Slug atualizado: ${r.slug}`);
      setClientes((prev) => prev.map((c) => (c.id === selectedId ? { ...c, slug: r.slug } : c)));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao atualizar slug");
    }
  };

  if (loading) {
    return <div className="p-8 text-sm text-muted-foreground">Carregando…</div>;
  }

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold break-words">Portal do cliente — Conteúdos por fase</h1>
        <p className="text-sm text-muted-foreground">
          Gerencie vídeos, áudios e documentos vinculados a cada cliente. Cada cliente vê apenas o próprio portal via link exclusivo.
        </p>
      </div>


      <Card className="p-4 space-y-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-full md:flex-1 md:min-w-[240px]">
            <Label className="text-xs">Cliente</Label>
            <Select value={selectedId ?? ""} onValueChange={(v) => setSelectedId(v)}>
              <SelectTrigger><SelectValue placeholder="Selecione um cliente" /></SelectTrigger>
              <SelectContent>
                {clientes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {portalUrl && (
            <div className="w-full md:flex-1 md:min-w-[280px] min-w-0">
              <Label className="text-xs">Link personalizado do portal</Label>
              <div className="flex flex-wrap gap-2">
                <Input readOnly value={portalUrl} className="font-mono text-xs w-full sm:flex-1 min-w-0" />
                <div className="flex gap-2 shrink-0">
                  <Button variant="outline" size="icon" onClick={copyPortalUrl} title="Copiar link">
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => window.open(portalUrl!, "_blank", "noopener,noreferrer")} title="Abrir portal">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={handleRegenSlug} title="Alterar slug">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card>


      {!selectedId && (
        <div className="text-sm text-muted-foreground">Selecione um cliente para gerenciar os conteúdos.</div>
      )}

      {selectedId && (
        <div className="space-y-6">
          {fases.map((fase) => (
            <Card key={fase.id} className="p-4 sm:p-5">
              <div className="mb-3">
                <div className="text-xs uppercase tracking-wider text-muted-foreground">Fase {fase.id}</div>
                <h2 className="text-lg font-bold">{fase.nome}</h2>
                {fase.descricao && <p className="text-sm text-muted-foreground">{fase.descricao}</p>}
              </div>
              <div className="space-y-4">
                {(topicosPorFase[fase.id] ?? []).map((topico) => (
                  <TopicoBlock
                    key={topico.id}
                    topico={topico}
                    clienteId={selectedId}
                    conteudos={conteudosPorTopico[topico.id] ?? []}
                    onChanged={() => refreshConteudos(selectedId)}
                    loading={loadingConteudos}
                  />
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

const BUCKET_BY_TIPO: Record<ConteudoTipo, "videos-cliente" | "audios-cliente" | "documentos"> = {
  video: "videos-cliente",
  audio: "audios-cliente",
  documento: "documentos",
};

function TipoIcon({ tipo }: { tipo: ConteudoTipo }) {
  if (tipo === "video") return <Video className="h-4 w-4" />;
  if (tipo === "audio") return <Headphones className="h-4 w-4" />;
  return <FileText className="h-4 w-4" />;
}

function TopicoBlock({
  topico,
  clienteId,
  conteudos,
  onChanged,
  loading,
}: {
  topico: Topico;
  clienteId: string;
  conteudos: Conteudo[];
  onChanged: () => void;
  loading: boolean;
}) {
  const [tipo, setTipo] = useState<ConteudoTipo>("video");
  const [titulo, setTitulo] = useState("");
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);
  

  const create = useServerFn(createConteudoCliente);
  const remove = useServerFn(deleteConteudoCliente);

  const submit = async () => {
    if (!url.trim()) {
      toast.error("Cole o link do conteúdo antes de salvar.");
      return;
    }
    setSaving(true);
    try {
      await create({
        data: {
          clienteId,
          topicoId: topico.id,
          tipo,
          titulo: titulo || null,
          url: url.trim(),
        },
      });
      setTitulo("");
      setUrl("");
      toast.success("Conteúdo adicionado");
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const handleUploaded = async (arquivo: { url: string; nome: string; bucket: string; path: string }) => {
    setSaving(true);
    try {
      await create({
        data: {
          clienteId,
          topicoId: topico.id,
          tipo,
          titulo: titulo || arquivo.nome,
          url: arquivo.url,
          storagePath: arquivo.path,
          storageBucket: arquivo.bucket,
        },
      });
      setTitulo("");
      toast.success("Arquivo enviado e vinculado ao tópico");
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao registrar upload");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remover este conteúdo?")) return;
    try {
      await remove({ data: { id } });
      onChanged();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao remover");
    }
  };

  return (
    <div className="rounded-lg border p-4 bg-muted/20">
      <div className="font-semibold mb-2">{topico.nome}</div>
      {loading ? (
        <div className="text-xs text-muted-foreground">Carregando…</div>
      ) : conteudos.length === 0 ? (
        <div className="text-xs text-muted-foreground mb-3">Nenhum conteúdo cadastrado para este tópico.</div>
      ) : (
        <ul className="space-y-1.5 mb-3">
          {conteudos.map((c) => (
            <li key={c.id} className="flex items-center gap-2 text-sm">
              <TipoIcon tipo={c.tipo} />
              <span className="flex-1 truncate">{c.titulo || c.url || c.storage_path}</span>
              {c.url && (
                <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline">
                  Abrir
                </a>
              )}
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(c.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <div className="grid grid-cols-1 md:grid-cols-[120px_1fr] gap-2 items-end">
        <div>
          <Label className="text-xs">Tipo</Label>
          <Select value={tipo} onValueChange={(v) => setTipo(v as ConteudoTipo)}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="video">Vídeo</SelectItem>
              <SelectItem value="audio">Áudio</SelectItem>
              <SelectItem value="documento">Documento</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs">Título (opcional)</Label>
          <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex.: Vídeo de onboarding" />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-md border bg-background p-3">
          <div className="text-xs font-semibold mb-1">Enviar arquivo do seu computador</div>
          <p className="text-[11px] text-muted-foreground mb-2">
            Vídeo, áudio ou documento — vai direto para o portal do cliente.
          </p>
          <FileUploader
            bucket={BUCKET_BY_TIPO[tipo]}
            contexto="central_cliente"
            clienteId={clienteId}
            visivelCliente={true}
            label={`Enviar ${tipo}`}
            onUploaded={handleUploaded}
          />
        </div>
        <div className="rounded-md border bg-background p-3">
          <div className="text-xs font-semibold mb-1">Ou colar um link (Loom / YouTube / Drive)</div>
          <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" className="mb-2" />
          <Button onClick={submit} disabled={saving || !url.trim()} size="sm" className="w-full">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Adicionar link"}
          </Button>
        </div>
      </div>

    </div>
  );
}
