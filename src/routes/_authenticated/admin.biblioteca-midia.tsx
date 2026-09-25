import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { FileUploader } from "@/components/FileUploader";
import {
  Search,
  Copy,
  Download,
  Trash2,
  Image as ImageIcon,
  FileText,
  Music,
  Video as VideoIcon,
  Package,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/biblioteca-midia")({
  head: () => ({
    meta: [
      { title: "Biblioteca de Mídia — Irys OS" },
      { name: "description", content: "Gerenciamento centralizado de arquivos, áudios, vídeos e documentos." },
    ],
  }),
  validateSearch: (s: Record<string, unknown>) => ({ cliente: typeof s.cliente === "string" ? s.cliente : undefined }),
  component: BibliotecaMidiaPage,
});

type Arquivo = {
  id: string;
  nome_original: string;
  nome_storage: string;
  bucket: string;
  url_publica: string | null;
  tipo_arquivo: "audio" | "video" | "documento" | "imagem" | "design" | "outro";
  contexto: string;
  cliente_id: string | null;
  tamanho_bytes: number | null;
  duracao_segundos: number | null;
  titulo: string | null;
  created_at: string;
};

const BUCKETS = [
  { id: "todos", label: "Todos" },
  { id: "audios-cliente", label: "Áudios" },
  { id: "videos-cliente", label: "Vídeos (cliente)" },
  { id: "videos-sistema", label: "Vídeos (sistema)" },
  { id: "documentos", label: "Documentos" },
  { id: "midias-conteudo", label: "Mídia de conteúdo" },
  { id: "recursos-marca", label: "Recursos de marca" },
  { id: "geral", label: "Geral" },
] as const;

const TIPOS = [["todos","Todos os tipos"],["imagem","Imagens"],["design","Design"],["video","Vídeos"],["audio","Áudios"],["documento","Documentos"],["outro","Outros"]] as const;
const CONTEXTOS: Record<string, string> = {
  central_cliente: "Central do Cliente", onboarding_sistema: "Onboarding", tarefa: "Tarefa",
  recurso_marca: "Recursos de marca", documento_juridico: "Jurídico", geral: "Geral",
};

function fmtBytes(n: number | null) {
  if (!n) return "—";
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
function fmtDur(s: number | null) {
  if (!s) return "";
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

const iconFor = (t: Arquivo["tipo_arquivo"]) => {
  switch (t) {
    case "audio": return Music;
    case "video": return VideoIcon;
    case "imagem":
    case "design": return ImageIcon;
    case "documento": return FileText;
    default: return Package;
  }
};

function BibliotecaMidiaPage() {
  const [arquivos, setArquivos] = useState<Arquivo[]>([]);
  const [loading, setLoading] = useState(true);
  const [bucketFiltro, setBucketFiltro] = useState<string>("todos");
  const [busca, setBusca] = useState("");
  const [mostraUpload, setMostraUpload] = useState(false);
  const [bucketUpload, setBucketUpload] = useState<Arquivo["bucket"]>("geral");
  const [copiado, setCopiado] = useState<string | null>(null);
  const search = Route.useSearch();
  const [clienteFiltro, setClienteFiltro] = useState(search.cliente ?? "");
  const [tipoFiltro, setTipoFiltro] = useState("todos");
  const [ctxFiltro, setCtxFiltro] = useState("todos");
  const [clientes, setClientes] = useState<{ id: string; nome: string }[]>([]);
  useEffect(() => {
    void supabase.from("clientes").select("id,nome").order("nome").then(({ data }) => setClientes(data ?? []));
  }, []);
  const nomeCliente = (id: string | null) => clientes.find((c) => c.id === id)?.nome;

  async function carregar() {
    setLoading(true);
    const { data } = await supabase
      .from("arquivos")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    setArquivos((data as Arquivo[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    void carregar();
  }, []);

  const filtrados = useMemo(() => {
    return arquivos.filter((a) => {
      if (bucketFiltro !== "todos" && a.bucket !== bucketFiltro) return false;
      if (clienteFiltro === "__sem" ? !!a.cliente_id : clienteFiltro && a.cliente_id !== clienteFiltro) return false;
      if (tipoFiltro !== "todos" && a.tipo_arquivo !== tipoFiltro) return false;
      if (ctxFiltro !== "todos" && a.contexto !== ctxFiltro) return false;
      if (busca && !`${a.nome_original} ${a.titulo ?? ""}`.toLowerCase().includes(busca.toLowerCase()))
        return false;
      return true;
    });
  }, [arquivos, bucketFiltro, busca, clienteFiltro, tipoFiltro, ctxFiltro]);

  const totalBytes = arquivos.reduce((acc, a) => acc + (a.tamanho_bytes ?? 0), 0);

  async function copiar(url: string, id: string) {
    await navigator.clipboard.writeText(url);
    setCopiado(id);
    setTimeout(() => setCopiado(null), 1500);
  }

  async function apagar(a: Arquivo) {
    if (!confirm(`Apagar "${a.nome_original}"?`)) return;
    await supabase.storage.from(a.bucket).remove([a.nome_storage]);
    await supabase.from("arquivos").delete().eq("id", a.id);
    setArquivos((prev) => prev.filter((x) => x.id !== a.id));
  }

  async function baixar(a: Arquivo) {
    const { data, error } = await supabase.storage
      .from(a.bucket)
      .createSignedUrl(a.nome_storage, 60, { download: a.nome_original });
    if (!error && data) window.open(data.signedUrl, "_blank");
  }

  return (
    <div>
      <PageHeader
        title="Biblioteca de Mídia"
        description={`${filtrados.length} de ${arquivos.length} arquivos · ${fmtBytes(totalBytes)} usados. Mídias de conteúdos ficam no próprio conteúdo.`}
        actions={
          <Button variant={mostraUpload ? "outline" : "default"} onClick={() => setMostraUpload((v) => !v)}>
            {mostraUpload ? "Fechar" : "+ Novo arquivo"}
          </Button>
        }
      />

      <div className="space-y-4">
        {mostraUpload && (
          <div className="rounded-2xl bg-card p-5 shadow-card">
            <div className="mb-3 flex items-center gap-3">
              <label className="text-sm font-medium text-muted-foreground">Bucket:</label>
              <select
                value={bucketUpload}
                onChange={(e) => setBucketUpload(e.target.value)}
                className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm text-foreground"
              >
                {BUCKETS.filter((b) => b.id !== "todos").map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.label}
                  </option>
                ))}
              </select>
            </div>
            <FileUploader
              bucket={bucketUpload as never}
              contexto="geral"
              onUploaded={() => {
                void carregar();
              }}
            />
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-card p-4 shadow-card">
          <div className="relative min-w-[200px] flex-1">
            <Search
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              strokeWidth={1.6}
            />
            <Input
              placeholder="Buscar por nome..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-9"
            />
          </div>
          {([
            [clienteFiltro, setClienteFiltro, [["", "Todos os clientes"], ["__sem", "Sem cliente (institucional)"], ...clientes.map((c) => [c.id, c.nome])]],
            [tipoFiltro, setTipoFiltro, TIPOS],
            [ctxFiltro, setCtxFiltro, [["todos", "Todos os contextos"], ...Object.entries(CONTEXTOS)]],
          ] as const).map(([v, set, opts], i) => (
            <select key={i} value={v} onChange={(e) => (set as (x: string) => void)(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground">
              {(opts as readonly (readonly [string, string])[]).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          ))}
          <div className="flex w-full flex-wrap gap-1.5">
            {BUCKETS.map((b) => (
              <button
                key={b.id}
                onClick={() => setBucketFiltro(b.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  bucketFiltro === b.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="rounded-2xl bg-card p-12 text-center text-sm text-muted-foreground shadow-card">
            Carregando arquivos…
          </div>
        ) : filtrados.length === 0 ? (
          <EmptyState
            title="Nenhum arquivo encontrado"
            description="Envie o primeiro arquivo para começar a montar a biblioteca."
            icon={<Package size={24} strokeWidth={1.6} />}
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtrados.map((a) => {
              const Icon = iconFor(a.tipo_arquivo);
              const isImage = a.tipo_arquivo === "imagem" || a.tipo_arquivo === "design";
              return (
                <div key={a.id} className="flex flex-col gap-3 rounded-2xl bg-card p-4 shadow-card">
                  <div className="flex aspect-video items-center justify-center overflow-hidden rounded-lg bg-secondary">
                    {isImage && a.url_publica ? (
                      <img src={a.url_publica} alt="" className="h-full w-full object-cover" loading="lazy" />
                    ) : a.tipo_arquivo === "audio" && a.url_publica ? (
                      <audio controls src={a.url_publica} className="w-full px-3" />
                    ) : a.tipo_arquivo === "video" && a.url_publica ? (
                      <video controls src={a.url_publica} className="h-full w-full object-cover" />
                    ) : (
                      <Icon className="h-10 w-10 text-muted-foreground" strokeWidth={1.6} />
                    )}
                  </div>
                  <div>
                    <p className="truncate text-sm font-medium text-foreground" title={a.nome_original}>
                      {a.titulo || a.nome_original}
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                      <StatusBadge variant="neutral" dot={false}>{a.bucket}</StatusBadge>
                      <span>{CONTEXTOS[a.contexto] ?? a.contexto}</span>
                      <span>{fmtBytes(a.tamanho_bytes)}</span>
                      {a.duracao_segundos ? <span>· {fmtDur(a.duracao_segundos)}</span> : null}
                    </div>
                    {a.cliente_id && nomeCliente(a.cliente_id) && (
                      <Link to="/admin/clientes/$clienteId" params={{ clienteId: a.cliente_id }} search={{ tab: "arquivos" } as never}
                        className="mt-1 block text-[12px] text-muted-foreground hover:text-foreground">{nomeCliente(a.cliente_id)} →</Link>
                    )}
                  </div>
                  <div className="mt-auto flex gap-1.5">
                    {a.url_publica && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs"
                        onClick={() => copiar(a.url_publica!, a.id)}
                      >
                        <Copy className="mr-1 h-3 w-3" strokeWidth={1.6} />
                        {copiado === a.id ? "Copiado" : "URL"}
                      </Button>
                    )}
                    <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => baixar(a)}>
                      <Download className="mr-1 h-3 w-3" strokeWidth={1.6} /> Baixar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs text-destructive hover:bg-destructive-soft"
                      onClick={() => apagar(a)}
                      aria-label="Apagar arquivo"
                    >
                      <Trash2 className="h-3 w-3" strokeWidth={1.6} />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
