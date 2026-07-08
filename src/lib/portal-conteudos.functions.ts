import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type Fase = { id: number; nome: string; descricao: string | null };
export type Topico = { id: string; fase_id: number; nome: string; ordem: number };
export type ConteudoTipo = "video" | "audio" | "documento";
export type Conteudo = {
  id: string;
  cliente_id: string;
  topico_id: string;
  tipo: ConteudoTipo;
  titulo: string | null;
  url: string | null;
  storage_path: string | null;
  storage_bucket: string | null;
  created_at: string;
};

async function requireAdmin(context: {
  supabase: import("@supabase/supabase-js").SupabaseClient;
  userId: string;
}) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error) throw error;
  if (!data) throw new Error("Apenas administradores podem gerenciar conteúdos do portal.");
}

// Fases + tópicos (admin ou cliente autenticado)
export const listFasesComTopicos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const [fasesRes, topicosRes] = await Promise.all([
      context.supabase.from("fases").select("id, nome, descricao").order("id"),
      context.supabase.from("topicos_fase").select("id, fase_id, nome, ordem").order("fase_id").order("ordem"),
    ]);
    if (fasesRes.error) throw fasesRes.error;
    if (topicosRes.error) throw topicosRes.error;
    return {
      fases: (fasesRes.data ?? []) as Fase[],
      topicos: (topicosRes.data ?? []) as Topico[],
    };
  });

// Lista conteúdos de um cliente (admin)
export const listConteudosCliente = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { clienteId: string }) => {
    const clienteId = input.clienteId?.trim();
    if (!clienteId) throw new Error("clienteId é obrigatório");
    return { clienteId };
  })
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { data: rows, error } = await context.supabase
      .from("conteudos_cliente")
      .select("id, cliente_id, topico_id, tipo, titulo, url, storage_path, storage_bucket, created_at")
      .eq("cliente_id", data.clienteId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (rows ?? []) as Conteudo[];
  });

// Cria conteúdo (admin)
export const createConteudoCliente = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: {
    clienteId: string;
    topicoId: string;
    tipo: ConteudoTipo;
    titulo?: string | null;
    url?: string | null;
    storagePath?: string | null;
    storageBucket?: string | null;
  }) => {
    const clienteId = input.clienteId?.trim();
    const topicoId = input.topicoId?.trim();
    if (!clienteId) throw new Error("clienteId é obrigatório");
    if (!topicoId) throw new Error("topicoId é obrigatório");
    if (!["video", "audio", "documento"].includes(input.tipo)) throw new Error("tipo inválido");
    const url = input.url?.trim() || null;
    const storagePath = input.storagePath?.trim() || null;
    if (!url && !storagePath) throw new Error("Informe uma URL ou faça upload de um arquivo");
    return {
      clienteId,
      topicoId,
      tipo: input.tipo,
      titulo: input.titulo?.trim() || null,
      url,
      storagePath,
      storageBucket: input.storageBucket?.trim() || null,
    };
  })
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { data: row, error } = await context.supabase
      .from("conteudos_cliente")
      .insert({
        cliente_id: data.clienteId,
        topico_id: data.topicoId,
        tipo: data.tipo,
        titulo: data.titulo,
        url: data.url,
        storage_path: data.storagePath,
        storage_bucket: data.storageBucket,
        created_by: context.userId,
      })
      .select("id, cliente_id, topico_id, tipo, titulo, url, storage_path, storage_bucket, created_at")
      .single();
    if (error) throw error;
    return row as Conteudo;
  });

export const deleteConteudoCliente = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => {
    const id = input.id?.trim();
    if (!id) throw new Error("id é obrigatório");
    return { id };
  })
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { error } = await context.supabase
      .from("conteudos_cliente")
      .delete()
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true as const };
  });

// Regenera slug do cliente (admin) — permite trocar o link personalizado
export const regenerarSlugCliente = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { clienteId: string; slug?: string | null }) => {
    const clienteId = input.clienteId?.trim();
    if (!clienteId) throw new Error("clienteId é obrigatório");
    const requested = input.slug?.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
    return { clienteId, slug: requested || null };
  })
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    let novo = data.slug;
    if (!novo) {
      novo = Array.from(crypto.getRandomValues(new Uint8Array(6)))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")
        .slice(0, 12);
    }
    const { data: row, error } = await context.supabase
      .from("clientes")
      .update({ slug: novo })
      .eq("id", data.clienteId)
      .select("slug")
      .single();
    if (error) throw error;
    return { slug: (row?.slug as string) ?? novo };
  });

// Público: resolve slug → dados do portal. Usa client publishable/anon com policies.
// As tabelas fases e topicos_fase têm SELECT público. Para conteudos e cliente,
// usamos supabaseAdmin dentro do handler apenas para projetar campos seguros.
export const getPortalBySlug = createServerFn({ method: "GET" })
  .inputValidator((input: { slug: string }) => {
    const slug = input.slug?.trim().toLowerCase();
    if (!slug) throw new Error("slug é obrigatório");
    return { slug };
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: cliente, error: cErr } = await supabaseAdmin
      .from("clientes")
      .select("id, nome, plano_label, plano_atual, status_contrato, slug")
      .eq("slug", data.slug)
      .maybeSingle();
    if (cErr) throw cErr;
    if (!cliente) throw new Error("Portal não encontrado.");

    const [fasesRes, topicosRes, conteudosRes] = await Promise.all([
      supabaseAdmin.from("fases").select("id, nome, descricao").order("id"),
      supabaseAdmin.from("topicos_fase").select("id, fase_id, nome, ordem").order("fase_id").order("ordem"),
      supabaseAdmin
        .from("conteudos_cliente")
        .select("id, topico_id, tipo, titulo, url, storage_path, storage_bucket, created_at")
        .eq("cliente_id", cliente.id)
        .order("created_at"),
    ]);
    if (fasesRes.error) throw fasesRes.error;
    if (topicosRes.error) throw topicosRes.error;
    if (conteudosRes.error) throw conteudosRes.error;

    // Gera signed URLs para conteúdos armazenados em buckets privados
    const conteudos = await Promise.all(
      (conteudosRes.data ?? []).map(async (c) => {
        let signedUrl = c.url as string | null;
        if (!signedUrl && c.storage_bucket && c.storage_path) {
          const { data: signed } = await supabaseAdmin.storage
            .from(c.storage_bucket as string)
            .createSignedUrl(c.storage_path as string, 60 * 60 * 6); // 6 horas
          signedUrl = signed?.signedUrl ?? null;
        }
        return {
          id: c.id as string,
          topico_id: c.topico_id as string,
          tipo: c.tipo as ConteudoTipo,
          titulo: (c.titulo as string) ?? null,
          url: signedUrl,
        };
      }),
    );

    return {
      cliente: {
        id: cliente.id as string,
        nome: cliente.nome as string,
        plano: (cliente.plano_label as string) ?? (cliente.plano_atual as string) ?? null,
        status: cliente.status_contrato as string,
        slug: cliente.slug as string,
      },
      fases: (fasesRes.data ?? []) as Fase[],
      topicos: (topicosRes.data ?? []) as Topico[],
      conteudos,
    };
  });

// Admin: preview do portal de um cliente específico (mesmos dados que o cliente vê).
export const getPortalPreviewByClienteId = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { clienteId: string }) => {
    const clienteId = input.clienteId?.trim();
    if (!clienteId) throw new Error("clienteId é obrigatório");
    return { clienteId };
  })
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: cliente, error: cErr } = await supabaseAdmin
      .from("clientes")
      .select("id, nome, plano_label, plano_atual, status_contrato, status_cadastro")
      .eq("id", data.clienteId)
      .maybeSingle();
    if (cErr) throw cErr;
    if (!cliente) throw new Error("Cliente não encontrado.");

    const [fasesRes, topicosRes, conteudosRes] = await Promise.all([
      supabaseAdmin.from("fases").select("id, nome, descricao").order("id"),
      supabaseAdmin.from("topicos_fase").select("id, fase_id, nome, ordem").order("fase_id").order("ordem"),
      supabaseAdmin
        .from("conteudos_cliente")
        .select("id, topico_id, tipo, titulo, url, storage_path, storage_bucket, created_at")
        .eq("cliente_id", data.clienteId)
        .order("created_at"),
    ]);
    if (fasesRes.error) throw fasesRes.error;
    if (topicosRes.error) throw topicosRes.error;
    if (conteudosRes.error) throw conteudosRes.error;

    const conteudos = await Promise.all(
      (conteudosRes.data ?? []).map(async (c) => {
        let signedUrl = (c.url as string | null) ?? null;
        if (!signedUrl && c.storage_bucket && c.storage_path) {
          const { data: signed } = await supabaseAdmin.storage
            .from(c.storage_bucket as string)
            .createSignedUrl(c.storage_path as string, 60 * 60 * 6);
          signedUrl = signed?.signedUrl ?? null;
        }
        return {
          id: c.id as string,
          topico_id: c.topico_id as string,
          tipo: c.tipo as ConteudoTipo,
          titulo: (c.titulo as string) ?? null,
          url: signedUrl,
        };
      }),
    );

    return {
      cliente: {
        id: cliente.id as string,
        nome: cliente.nome as string,
        plano: (cliente.plano_label as string) ?? (cliente.plano_atual as string) ?? null,
        status: cliente.status_contrato as string,
        status_cadastro: (cliente.status_cadastro as string) ?? null,
      },
      fases: (fasesRes.data ?? []) as Fase[],
      topicos: (topicosRes.data ?? []) as Topico[],
      conteudos,
    };
  });
