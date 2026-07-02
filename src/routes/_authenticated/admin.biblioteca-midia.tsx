import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FileUploader } from "@/components/FileUploader";
import {
  ArrowLeft,
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
      if (busca && !`${a.nome_original} ${a.titulo ?? ""}`.toLowerCase().includes(busca.toLowerCase()))
        return false;
      return true;
    });
  }, [arquivos, bucketFiltro, busca]);

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
    <div className="min-h-screen bg-[#EDEAE5]">
      <header className="bg-[#2C1505] text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/visao-geral"
            className="text-[#C9A46E] hover:text-white flex items-center gap-1 text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Link>
          <span className="text-[#7A6050]">|</span>
          <div>
            <h1 className="text-lg font-bold">Biblioteca de Mídia</h1>
            <p className="text-xs text-[#C9A46E]">
              {arquivos.length} arquivos · {fmtBytes(totalBytes)} usados
            </p>
          </div>
        </div>
        <Button
          onClick={() => setMostraUpload((v) => !v)}
          className="bg-[#C9A46E] hover:bg-[#A87F3E] text-[#2C1505]"
        >
          {mostraUpload ? "Fechar" : "+ Novo arquivo"}
        </Button>
      </header>

      <div className="max-w-7xl mx-auto p-6 space-y-4">
        {mostraUpload && (
          <Card className="p-5 bg-white border-[#E8D8C0]">
            <div className="flex items-center gap-3 mb-3">
              <label className="text-sm text-[#7A4A18] font-medium">Bucket:</label>
              <select
                value={bucketUpload}
                onChange={(e) => setBucketUpload(e.target.value)}
                className="text-sm border border-[#E8D8C0] rounded px-3 py-1.5 bg-white text-[#2C1505]"
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
          </Card>
        )}

        <Card className="p-4 bg-white border-[#E8D8C0] flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#BBA898]" />
            <Input
              placeholder="Buscar por nome..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-9 border-[#E8D8C0]"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {BUCKETS.map((b) => (
              <button
                key={b.id}
                onClick={() => setBucketFiltro(b.id)}
                className={`text-xs px-3 py-1.5 rounded-full transition ${
                  bucketFiltro === b.id
                    ? "bg-[#2C1505] text-white"
                    : "bg-[#F5EEE5] text-[#7A4A18] hover:bg-[#EBDFCB]"
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>
        </Card>

        {loading ? (
          <Card className="p-12 text-center text-[#7A6050]">Carregando arquivos...</Card>
        ) : filtrados.length === 0 ? (
          <Card className="p-12 text-center text-[#7A6050]">
            Nenhum arquivo encontrado. Envie o primeiro para começar.
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtrados.map((a) => {
              const Icon = iconFor(a.tipo_arquivo);
              const isImage = a.tipo_arquivo === "imagem" || a.tipo_arquivo === "design";
              return (
                <Card key={a.id} className="p-4 bg-white border-[#E8D8C0] flex flex-col gap-3">
                  <div className="aspect-video rounded bg-[#F5EEE5] flex items-center justify-center overflow-hidden">
                    {isImage && a.url_publica ? (
                      <img src={a.url_publica} alt="" className="w-full h-full object-cover" />
                    ) : a.tipo_arquivo === "audio" && a.url_publica ? (
                      <audio controls src={a.url_publica} className="w-full px-3" />
                    ) : a.tipo_arquivo === "video" && a.url_publica ? (
                      <video controls src={a.url_publica} className="w-full h-full object-cover" />
                    ) : (
                      <Icon className="w-10 h-10 text-[#C9A46E]" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#2C1505] truncate" title={a.nome_original}>
                      {a.titulo || a.nome_original}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-[#7A6050]">
                      <Badge className="bg-[#F5EEE5] text-[#7A4A18] hover:bg-[#F5EEE5]">
                        {a.bucket}
                      </Badge>
                      <span>{fmtBytes(a.tamanho_bytes)}</span>
                      {a.duracao_segundos ? <span>· {fmtDur(a.duracao_segundos)}</span> : null}
                    </div>
                  </div>
                  <div className="flex gap-1.5 mt-auto">
                    {a.url_publica && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 border-[#E8D8C0] text-[#7A4A18] hover:bg-[#F5EEE5] text-xs"
                        onClick={() => copiar(a.url_publica!, a.id)}
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        {copiado === a.id ? "Copiado" : "URL"}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 border-[#E8D8C0] text-[#7A4A18] hover:bg-[#F5EEE5] text-xs"
                      onClick={() => baixar(a)}
                    >
                      <Download className="w-3 h-3 mr-1" /> Baixar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-200 text-red-700 hover:bg-red-50 text-xs"
                      onClick={() => apagar(a)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
