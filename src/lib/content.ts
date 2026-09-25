import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { StatusVariant } from "@/components/ui/status-badge";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const cdb = (t: string) => (supabase as any).from(t);

export const CONTENT_STATUS = [
  "ideia", "planejado", "em_producao", "revisao_interna", "com_cliente",
  "alteracao_solicitada", "aprovado", "agendado", "publicado",
] as const;
export type ContentStatus = (typeof CONTENT_STATUS)[number];

export const CONTENT_STATUS_LABEL: Record<ContentStatus, string> = {
  ideia: "Ideia", planejado: "Planejado", em_producao: "Em produção", revisao_interna: "Revisão interna",
  com_cliente: "Com cliente", alteracao_solicitada: "Alteração solicitada", aprovado: "Aprovado",
  agendado: "Agendado", publicado: "Publicado",
};
export const CONTENT_STATUS_VARIANT: Record<ContentStatus, StatusVariant> = {
  ideia: "neutral", planejado: "neutral", em_producao: "info", revisao_interna: "primary",
  com_cliente: "warning", alteracao_solicitada: "danger", aprovado: "success", agendado: "success", publicado: "neutral",
};
/** Workflow (Produção) — Ideia fica no backlog separado. */
export const WORKFLOW: ContentStatus[] = CONTENT_STATUS.filter((s) => s !== "ideia");
export const APPROVAL_STATUSES: ContentStatus[] = ["com_cliente", "alteracao_solicitada"];

export const CANAIS = ["Instagram", "TikTok", "YouTube", "LinkedIn", "Blog", "E-mail", "WhatsApp"];
export const FORMATOS = ["Reels", "Carrossel", "Story", "Post", "Vídeo", "Live"];

export type Conteudo = {
  id: string; cliente_id: string; titulo: string; data_prevista: string | null; horario: string | null;
  canal: string | null; formato: string | null; status: ContentStatus; origem: string;
  calendario_item_id: string | null; pipeline_mes: string | null;
  pilar_id: string | null; tema_id: string | null; mensagem_id: string | null; argumento_id: string | null; evidencia_id: string | null;
  jornada: string | null; objetivo: string | null; cta: string | null; legenda: string | null; hashtags: string | null;
  versao_atual: number; status_arte: string; status_legenda: string; enviado_cliente_em: string | null;
  publicado_em: string | null; publicacao_url: string | null; plataforma: string | null; plataforma_post_id: string | null;
  created_at: string; updated_at: string;
  midias?: { id: string; tipo: string; ordem: number; storage_path: string }[];
};
export type Midia = { id: string; conteudo_id: string; bucket: string; storage_path: string; tipo: "imagem" | "video"; mime: string | null; nome_original: string | null; ordem: number; url?: string };

export const ACCEPT = "image/jpeg,image/png,image/webp,video/mp4";
export const MAX_BYTES = 200 * 1024 * 1024;

export type ContentFilter = { clienteId?: string };

export function useConteudos(filter: ContentFilter = {}) {
  return useQuery({
    queryKey: ["conteudos", filter.clienteId ?? "all"],
    queryFn: async () => {
      let q = cdb("conteudos").select("*, midias:conteudo_midias(id,tipo,ordem,storage_path)").order("data_prevista", { ascending: true, nullsFirst: false }).limit(2000);
      if (filter.clienteId) q = q.eq("cliente_id", filter.clienteId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Conteudo[];
    },
    staleTime: 15_000,
  });
}

export function useClientesLite() {
  return useQuery({
    queryKey: ["clientes-lite"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clientes").select("id,nome").order("nome");
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 60_000,
  });
}

export function useContentActions() {
  const qc = useQueryClient();
  const refresh = useCallback(() => {
    qc.invalidateQueries({ queryKey: ["conteudos"] });
    qc.invalidateQueries({ queryKey: ["conteudo"] });
    qc.invalidateQueries({ queryKey: ["overview"] });
  }, [qc]);
  const fail = (e: unknown) => { console.error(e); toast.error("Não foi possível salvar. Tente de novo."); };

  const create = async (row: Partial<Conteudo>) => {
    const { data, error } = await cdb("conteudos").insert(row).select("id").single();
    if (error) { fail(error); return null; }
    refresh(); return data.id as string;
  };
  const update = async (id: string, patch: Partial<Conteudo>) => {
    const { error } = await cdb("conteudos").update(patch).eq("id", id);
    if (error) { fail(error); return false; }
    refresh(); return true;
  };
  const remove = async (id: string) => {
    const { error } = await cdb("conteudos").delete().eq("id", id);
    if (error) { fail(error); return false; }
    refresh(); return true;
  };
  return { create, update, remove, refresh };
}

/** Converte um item do Calendário Estratégico em Conteúdo, preservando os IDs dos vínculos. */
export async function conteudoFromCalendario(item: {
  id: string; cliente_id?: string; data: string; titulo: string | null; canal: string | null; formato: string | null;
  pilar_id: string | null; tema_id: string | null; mensagem_id: string | null; argumento_id: string | null;
  jornada: string | null; objetivo: string | null; cta: string | null;
}, clienteId: string, fallbackTitle?: string) {
  const { data: arg } = item.argumento_id
    ? await cdb("editorial_argumentos").select("evidencia_id").eq("id", item.argumento_id).maybeSingle()
    : { data: null };
  const { data, error } = await cdb("conteudos").insert({
    cliente_id: clienteId, origem: "calendario_estrategico", calendario_item_id: item.id, status: "planejado",
    titulo: item.titulo || fallbackTitle || "", data_prevista: item.data, pipeline_mes: `${item.data.slice(0, 7)}-01`,
    canal: item.canal, formato: item.formato, pilar_id: item.pilar_id, tema_id: item.tema_id,
    mensagem_id: item.mensagem_id, argumento_id: item.argumento_id, evidencia_id: arg?.evidencia_id ?? null,
    jornada: item.jornada, objetivo: item.objetivo, cta: item.cta,
  }).select("id").single();
  if (error) {
    if (String(error.code) === "23505") toast.info("Este item já virou conteúdo.");
    else { console.error(error); toast.error("Não foi possível criar o conteúdo."); }
    return null;
  }
  toast.success("Conteúdo criado em Planejado.");
  return data.id as string;
}

export async function signedUrl(bucket: string, path: string) {
  const { data } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);
  return data?.signedUrl;
}

export async function uploadMidias(conteudoId: string, clienteId: string, files: File[], startOrder: number) {
  let ok = 0;
  for (const [i, f] of files.entries()) {
    if (!ACCEPT.split(",").includes(f.type)) { toast.error(`${f.name}: formato não suportado (use JPG, PNG, WEBP ou MP4).`); continue; }
    if (f.size > MAX_BYTES) { toast.error(`${f.name}: arquivo acima de 200 MB.`); continue; }
    const ext = f.name.split(".").pop()?.toLowerCase() || "bin";
    const path = `conteudos/${clienteId}/${conteudoId}/${crypto.randomUUID()}.${ext}`;
    const up = await supabase.storage.from("midias-conteudo").upload(path, f, { contentType: f.type });
    if (up.error) { console.error(up.error); toast.error(`Falha ao enviar ${f.name}.`); continue; }
    const { error } = await cdb("conteudo_midias").insert({
      conteudo_id: conteudoId, storage_path: path, bucket: "midias-conteudo",
      tipo: f.type.startsWith("video") ? "video" : "imagem", mime: f.type, nome_original: f.name, tamanho_bytes: f.size, ordem: startOrder + i,
    });
    if (error) { console.error(error); await supabase.storage.from("midias-conteudo").remove([path]); toast.error(`Falha ao registrar ${f.name}.`); continue; }
    ok++;
  }
  if (ok) toast.success(ok === 1 ? "Mídia enviada." : `${ok} mídias enviadas.`);
  return ok;
}

export const parseLocal = (s: string) => new Date(`${s.slice(0, 10)}T00:00:00`);
export const isoDay = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const fmtShort = (s: string | null) => (s ? parseLocal(s).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) : "Sem data");

/** Conteúdo "incompleto" para alertas: sem legenda ou sem mídia. */
export const isIncomplete = (c: Conteudo) => !c.legenda?.trim() || !(c.midias?.length);
export const isLate = (c: Conteudo, today = new Date(new Date().setHours(0, 0, 0, 0))) =>
  !!c.data_prevista && parseLocal(c.data_prevista) < today && !["publicado", "agendado", "ideia"].includes(c.status);
