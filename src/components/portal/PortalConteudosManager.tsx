import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import {
  listFasesComTopicos,
  listConteudosCliente,
  listConteudosGlobais,
  createConteudoCliente,
  createConteudoGlobal,
  deleteConteudoCliente,
  deleteConteudoGlobal,
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
import { Switch } from "@/components/ui/switch";
import { FileUploader } from "@/components/FileUploader";
import { toast } from "sonner";
import { Loader2, Trash2, Video, FileText, Headphones, Globe } from "lucide-react";

const BUCKET_BY_TIPO: Record<ConteudoTipo, "videos-cliente" | "audios-cliente" | "documentos"> = {
  video: "videos-cliente",
  audio: "audios-cliente",
  documento: "documentos",
};

// Tópicos que aceitam conteúdo global (mesmo item vale pra todos os clientes).
// Mantido em sync com PortalRico.tsx e portal-conteudos.functions.ts.
function normalizarNome(txt: string): string {
  return txt.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
const GLOBAL_TOPICO_NAMES = new Set(["video de boas-vindas", "audios da dinamica"]);
function topicoAceitaGlobal(t: Topico) {
  return GLOBAL_TOPICO_NAMES.has(normalizarNome(t.nome));
}

function TipoIcon({ tipo }: { tipo: ConteudoTipo }) {
  if (tipo === "video") return <Video className="h-4 w-4" />;
  if (tipo === "audio") return <Headphones className="h-4 w-4" />;
  return <FileText className="h-4 w-4" />;
}

export function PortalConteudosManager({ clienteId }: { clienteId: string }) {
  const [fases, setFases] = useState<Fase[]>([]);
  const [topicos, setTopicos] = useState<Topico[]>([]);
  const [conteudos, setConteudos] = useState<Conteudo[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingConteudos, setLoadingConteudos] = useState(false);

  const listFases = useServerFn(listFasesComTopicos);
  const listConteudos = useServerFn(listConteudosCliente);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const meta = await listFases();
        setFases(meta.fases);
        setTopicos(meta.topicos);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erro ao carregar fases");
      } finally {
        setLoading(false);
      }
    };
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshConteudos = async () => {
    if (!clienteId) return;
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
    void refreshConteudos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteId]);

  useEffect(() => {
    if (!clienteId) return;
    const channel = supabase
      .channel(`conteudos-cliente-mgr-${clienteId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conteudos_cliente", filter: `cliente_id=eq.${clienteId}` },
        () => { void refreshConteudos(); },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteId]);

  const topicosPorFase = useMemo(() => {
    const m: Record<number, Topico[]> = {};
    for (const t of topicos) (m[t.fase_id] ??= []).push(t);
    return m;
  }, [topicos]);

  const conteudosPorTopico = useMemo(() => {
    const m: Record<string, Conteudo[]> = {};
    for (const c of conteudos) (m[c.topico_id] ??= []).push(c);
    return m;
  }, [conteudos]);

  if (loading) return <div className="p-4 text-sm text-muted-foreground">Carregando…</div>;

  return (
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
                clienteId={clienteId}
                conteudos={conteudosPorTopico[topico.id] ?? []}
                onChanged={() => refreshConteudos()}
                loading={loadingConteudos}
              />
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
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
  const [descricao, setDescricao] = useState("");
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
        data: { clienteId, topicoId: topico.id, tipo, titulo: titulo || null, descricao: descricao || null, url: url.trim() },
      });
      setTitulo("");
      setDescricao("");
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
          descricao: descricao || null,
          // Não salvamos a "url pública" aqui: os buckets são privados,
          // então esse link nunca funcionaria. Guardamos só o caminho no
          // storage — o portal do cliente gera um link assinado (temporário
          // e seguro) na hora de exibir, usando storagePath + storageBucket.
          url: null,
          storagePath: arquivo.path,
          storageBucket: arquivo.bucket,
        },
      });
      setTitulo("");
      setDescricao("");
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
    <div className="rounded-lg border p-3 sm:p-4 bg-muted/20 min-w-0">
      <div className="font-semibold mb-2 break-words">{topico.nome}</div>
      {loading ? (
        <div className="text-xs text-muted-foreground">Carregando…</div>
      ) : conteudos.length === 0 ? (
        <div className="text-xs text-muted-foreground mb-3">Nenhum conteúdo cadastrado para este tópico.</div>
      ) : (
        <ul className="space-y-1.5 mb-3">
          {conteudos.map((c) => (
            <li key={c.id} className="flex items-center gap-2 text-sm min-w-0">
              <span className="shrink-0"><TipoIcon tipo={c.tipo} /></span>
              <span className="flex-1 truncate min-w-0">
                {c.titulo || c.url || c.storage_path}
                {c.descricao && <span className="text-muted-foreground"> — {c.descricao}</span>}
              </span>
              {c.url && (
                <a href={c.url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-xs text-primary underline">
                  Abrir
                </a>
              )}
              <Button variant="ghost" size="icon" className="shrink-0 h-7 w-7 text-destructive" onClick={() => handleDelete(c.id)}>
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

      <div className="mt-2">
        <Label className="text-xs">Frase/descrição (opcional)</Label>
        <Input
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          placeholder="Ex.: Como vai funcionar o dia a dia da nossa comunicação."
        />
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
