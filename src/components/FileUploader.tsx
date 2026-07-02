import { useCallback, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Upload, CheckCircle2, XCircle, Loader2, File as FileIcon } from "lucide-react";

type Bucket =
  | "audios-cliente"
  | "videos-sistema"
  | "videos-cliente"
  | "documentos"
  | "midias-conteudo"
  | "recursos-marca"
  | "geral";

type Contexto =
  | "central_cliente"
  | "onboarding_sistema"
  | "tarefa"
  | "recurso_marca"
  | "documento_juridico"
  | "geral";

type TipoArquivo = "audio" | "video" | "documento" | "imagem" | "design" | "outro";

export interface FileUploaderProps {
  bucket: Bucket;
  contexto: Contexto;
  clienteId?: string | null;
  tarefaId?: string | null;
  accept?: string;
  maxBytes?: number;
  titulo?: string;
  descricao?: string;
  visivelCliente?: boolean;
  label?: string;
  onUploaded?: (arquivo: { id: string; url: string; nome: string; bucket: string; path: string }) => void;
}

const LIMITS: Record<Bucket, { max: number; accept: string; tipo: TipoArquivo }> = {
  "audios-cliente":  { max: 50 * 1024 * 1024,  accept: ".mp3,.m4a,.wav,.ogg,audio/*", tipo: "audio" },
  "videos-sistema":  { max: 500 * 1024 * 1024, accept: ".mp4,.mov,.webm,video/*",     tipo: "video" },
  "videos-cliente":  { max: 500 * 1024 * 1024, accept: ".mp4,.mov,.webm,video/*",     tipo: "video" },
  "documentos":      { max: 20 * 1024 * 1024,  accept: ".pdf,.doc,.docx,.xlsx,.png,.jpg", tipo: "documento" },
  "midias-conteudo": { max: 50 * 1024 * 1024,  accept: ".png,.jpg,.webp,.gif,.svg,.mp4,.mov", tipo: "design" },
  "recursos-marca":  { max: 50 * 1024 * 1024,  accept: ".png,.jpg,.webp,.gif,.svg,.pdf", tipo: "imagem" },
  "geral":           { max: 100 * 1024 * 1024, accept: "*/*", tipo: "outro" },
};

function fmtBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

async function probeDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const isAudio = file.type.startsWith("audio/");
    const el = document.createElement(isAudio ? "audio" : "video") as HTMLMediaElement;
    el.preload = "metadata";
    el.src = url;
    el.onloadedmetadata = () => {
      const d = Number.isFinite(el.duration) ? Math.round(el.duration) : null;
      URL.revokeObjectURL(url);
      resolve(d);
    };
    el.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
  });
}

export function FileUploader({
  bucket,
  contexto,
  clienteId,
  tarefaId,
  accept,
  maxBytes,
  titulo,
  descricao,
  visivelCliente = true,
  label = "Arraste o arquivo aqui ou clique para selecionar",
  onUploaded,
}: FileUploaderProps) {
  const cfg = LIMITS[bucket];
  const max = maxBytes ?? cfg.max;
  const acc = accept ?? cfg.accept;

  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [state, setState] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [progress, setProgress] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const [last, setLast] = useState<{ nome: string; url: string; tamanho: number } | null>(null);

  const doUpload = useCallback(
    async (file: File) => {
      setErr(null);
      if (file.size > max) {
        setState("error");
        setErr(`Arquivo excede o limite de ${fmtBytes(max)}.`);
        return;
      }

      setState("uploading");
      setProgress(10);

      const folder = clienteId ?? "geral";
      const safe = file.name.replace(/[^\w.\-]+/g, "_");
      const path = `${folder}/${crypto.randomUUID()}-${safe}`;

      const duracao = ["audio", "video"].includes(cfg.tipo) ? await probeDuration(file) : null;
      setProgress(30);

      const { error: upErr } = await supabase.storage.from(bucket).upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || undefined,
      });
      if (upErr) {
        setState("error");
        setErr(upErr.message);
        return;
      }
      setProgress(70);

      const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path);
      const publicUrl = pub.publicUrl;

      const { data: userData } = await supabase.auth.getUser();
      const uploader = userData.user?.id ?? null;

      const { data: row, error: insErr } = await supabase
        .from("arquivos")
        .insert({
          nome_original: file.name,
          nome_storage: path,
          bucket,
          url_publica: publicUrl,
          tipo_arquivo: cfg.tipo,
          contexto,
          cliente_id: clienteId ?? null,
          tarefa_id: tarefaId ?? null,
          uploader_id: uploader,
          tamanho_bytes: file.size,
          duracao_segundos: duracao,
          titulo: titulo ?? file.name,
          descricao: descricao ?? null,
          visivel_cliente: visivelCliente,
        })
        .select("id")
        .single();

      if (insErr) {
        setState("error");
        setErr(insErr.message);
        return;
      }

      setProgress(100);
      setState("done");
      setLast({ nome: file.name, url: publicUrl, tamanho: file.size });
      onUploaded?.({ id: row.id, url: publicUrl, nome: file.name, bucket, path });
    },
    [bucket, cfg.tipo, clienteId, contexto, descricao, max, onUploaded, tarefaId, titulo, visivelCliente],
  );

  return (
    <div className="w-full">
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const f = e.dataTransfer.files?.[0];
          if (f) void doUpload(f);
        }}
        className={`cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition ${
          dragging
            ? "border-[#C9A46E] bg-[#F5EEE5]"
            : "border-[#E8D8C0] bg-white hover:bg-[#FAF5EC]"
        }`}
      >
        <Upload className="w-8 h-8 mx-auto text-[#C9A46E] mb-2" />
        <p className="text-sm font-medium text-[#2C1505]">{label}</p>
        <p className="text-xs text-[#7A6050] mt-1">
          Máx. {fmtBytes(max)} · {acc.replace(/\*\/\*/, "todos")}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={acc}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void doUpload(f);
            e.target.value = "";
          }}
        />
      </div>

      {state === "uploading" && (
        <div className="mt-3 flex items-center gap-2 text-sm text-[#7A4A18]">
          <Loader2 className="w-4 h-4 animate-spin" />
          <div className="flex-1 h-2 bg-[#F0E5D5] rounded overflow-hidden">
            <div className="h-full bg-[#C9A46E] transition-all" style={{ width: `${progress}%` }} />
          </div>
          <span className="text-xs">{progress}%</span>
        </div>
      )}

      {state === "done" && last && (
        <div className="mt-3 flex items-center gap-2 p-3 bg-[#F5EEE5] rounded border border-[#E8D8C0] text-sm text-[#2C1505]">
          <CheckCircle2 className="w-4 h-4 text-[#7A4A18]" />
          <FileIcon className="w-4 h-4 text-[#7A6050]" />
          <span className="truncate flex-1">{last.nome}</span>
          <span className="text-xs text-[#7A6050]">{fmtBytes(last.tamanho)}</span>
        </div>
      )}

      {state === "error" && (
        <div className="mt-3 flex items-center gap-2 p-3 bg-red-50 rounded border border-red-200 text-sm text-red-800">
          <XCircle className="w-4 h-4" />
          <span>{err ?? "Falha no upload."}</span>
        </div>
      )}
    </div>
  );
}

export default FileUploader;
