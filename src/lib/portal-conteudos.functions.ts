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
  descricao: string | null;
  url: string | null;
  storage_path: string | null;
  storage_bucket: string | null;
  created_at: string;
  ordem?: number;
  is_global?: boolean;
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
      .select("id, cliente_id, topico_id, tipo, titulo, descricao, url, storage_path, storage_bucket, created_at")
      .eq("cliente_id", data.clienteId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (rows ?? []) as Conteudo[];
  });

// Lista conteúdos globais (todos os clientes) — admin
export const listConteudosGlobais = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context);
    const { data: rows, error } = await context.supabase
      .from("conteudos_globais")
      .select("id, topico_id, tipo, titulo, descricao, url, storage_path, storage_bucket, ordem, created_at")
      .order("topico_id")
      .order("ordem")
      .order("created_at");
    if (error) throw error;
    return (rows ?? []).map((r) => ({
      ...r,
      cliente_id: "",
      is_global: true as const,
    })) as Conteudo[];
  });

// Atualiza arquivo/link de um conteúdo global existente (admin)
export const updateConteudoGlobal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: {
    id: string;
    url?: string | null;
    storagePath?: string | null;
    storageBucket?: string | null;
  }) => {
    const id = input.id?.trim();
    if (!id) throw new Error("id é obrigatório");
    const url = input.url?.trim() || null;
    const storagePath = input.storagePath?.trim() || null;
    const storageBucket = input.storageBucket?.trim() || null;
    if (!url && !storagePath) throw new Error("Informe uma URL ou faça upload de um arquivo");
    return { id, url, storagePath, storageBucket };
  })
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { error } = await context.supabase
      .from("conteudos_globais")
      .update({
        url: data.url,
        storage_path: data.storagePath,
        storage_bucket: data.storageBucket,
      })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true as const };
  });


// Cria conteúdo (admin)
export const createConteudoCliente = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: {
    clienteId: string;
    topicoId: string;
    tipo: ConteudoTipo;
    titulo?: string | null;
    descricao?: string | null;
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
      descricao: input.descricao?.trim() || null,
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
        descricao: data.descricao,
        url: data.url,
        storage_path: data.storagePath,
        storage_bucket: data.storageBucket,
        created_by: context.userId,
      })
      .select("id, cliente_id, topico_id, tipo, titulo, descricao, url, storage_path, storage_bucket, created_at")
      .single();
    if (error) throw error;
    return row as Conteudo;
  });

// Cria conteúdo GLOBAL (visível para todos os clientes) — admin
export const createConteudoGlobal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: {
    topicoId: string;
    tipo: ConteudoTipo;
    titulo?: string | null;
    descricao?: string | null;
    url?: string | null;
    storagePath?: string | null;
    storageBucket?: string | null;
  }) => {
    const topicoId = input.topicoId?.trim();
    if (!topicoId) throw new Error("topicoId é obrigatório");
    if (!["video", "audio", "documento"].includes(input.tipo)) throw new Error("tipo inválido");
    const url = input.url?.trim() || null;
    const storagePath = input.storagePath?.trim() || null;
    if (!url && !storagePath) throw new Error("Informe uma URL ou faça upload de um arquivo");
    return {
      topicoId,
      tipo: input.tipo,
      titulo: input.titulo?.trim() || null,
      descricao: input.descricao?.trim() || null,
      url,
      storagePath,
      storageBucket: input.storageBucket?.trim() || null,
    };
  })
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { data: row, error } = await context.supabase
      .from("conteudos_globais")
      .insert({
        topico_id: data.topicoId,
        tipo: data.tipo,
        titulo: data.titulo,
        descricao: data.descricao,
        url: data.url,
        storage_path: data.storagePath,
        storage_bucket: data.storageBucket,
        created_by: context.userId,
      })
      .select("id, topico_id, tipo, titulo, descricao, url, storage_path, storage_bucket, created_at")
      .single();
    if (error) throw error;
    return { ...row, cliente_id: "", is_global: true } as Conteudo;
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

export const deleteConteudoGlobal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => {
    const id = input.id?.trim();
    if (!id) throw new Error("id é obrigatório");
    return { id };
  })
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { error } = await context.supabase
      .from("conteudos_globais")
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

// Nomes normalizados dos tópicos que aceitam conteúdo GLOBAL (mesmo item vale
// para todos os clientes). Mantido em sync com PortalRico.tsx.
const GLOBAL_TOPICO_NAMES = new Set(["video de boas-vindas", "audios da dinamica"]);

function normalizarNome(txt: string | null | undefined): string {
  if (!txt) return "";
  return String(txt).toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

type RawConteudoRow = {
  id: string;
  topico_id: string;
  tipo: ConteudoTipo;
  titulo: string | null;
  descricao: string | null;
  url: string | null;
  storage_path: string | null;
  storage_bucket: string | null;
  created_at?: string;
  topicos_fase?: { nome: string; fase_id: number } | null;
};

async function assinarConteudo(
  supabaseAdmin: import("@supabase/supabase-js").SupabaseClient,
  c: RawConteudoRow,
  extra: { is_global?: boolean } = {},
) {
  let signedUrl = c.url;
  if (c.storage_bucket && c.storage_path) {
    const { data: signed } = await supabaseAdmin.storage
      .from(c.storage_bucket)
      .createSignedUrl(c.storage_path, 60 * 60 * 6);
    if (signed?.signedUrl) signedUrl = signed.signedUrl;
  }
  const topicoFase = c.topicos_fase ?? null;
  return {
    id: c.id,
    topico_id: c.topico_id,
    tipo: c.tipo,
    titulo: c.titulo ?? null,
    descricao: c.descricao ?? null,
    url: signedUrl,
    storage_path: c.storage_path ?? null,
    storage_bucket: c.storage_bucket ?? null,
    fase_id: topicoFase?.fase_id,
    topicos_fase: topicoFase ? { nome: topicoFase.nome } : null,
    is_global: extra.is_global ?? false,
  };
}

async function fetchGlobaisMerge(
  supabaseAdmin: import("@supabase/supabase-js").SupabaseClient,
  topicos: Topico[],
) {
  const topicosGlobais = topicos.filter((t) => GLOBAL_TOPICO_NAMES.has(normalizarNome(t.nome)));
  if (topicosGlobais.length === 0) return [] as Awaited<ReturnType<typeof assinarConteudo>>[];
  const ids = topicosGlobais.map((t) => t.id);
  const { data, error } = await supabaseAdmin
    .from("conteudos_globais")
    .select("id, topico_id, tipo, titulo, descricao, url, storage_path, storage_bucket, created_at, topicos_fase(nome, fase_id)")
    .in("topico_id", ids)
    .order("created_at");
  if (error) throw error;
  return Promise.all((data ?? []).map((c) => assinarConteudo(supabaseAdmin, c as unknown as RawConteudoRow, { is_global: true })));
}

// Público: resolve slug → dados do portal.
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
        .select("id, topico_id, tipo, titulo, descricao, url, storage_path, storage_bucket, created_at, topicos_fase(nome, fase_id)")
        .eq("cliente_id", cliente.id)
        .order("created_at"),
    ]);
    if (fasesRes.error) throw fasesRes.error;
    if (topicosRes.error) throw topicosRes.error;
    if (conteudosRes.error) throw conteudosRes.error;

    const topicos = (topicosRes.data ?? []) as Topico[];
    const conteudosCliente = await Promise.all(
      (conteudosRes.data ?? []).map((c) => assinarConteudo(supabaseAdmin, c as unknown as RawConteudoRow)),
    );
    const conteudosGlobais = await fetchGlobaisMerge(supabaseAdmin, topicos);

    return {
      cliente: {
        id: cliente.id as string,
        nome: cliente.nome as string,
        plano: (cliente.plano_label as string) ?? (cliente.plano_atual as string) ?? null,
        status: cliente.status_contrato as string,
        slug: cliente.slug as string,
      },
      fases: (fasesRes.data ?? []) as Fase[],
      topicos,
      conteudos: [...conteudosCliente, ...conteudosGlobais],
    };
  });

export const getMeuPortal = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: cliente, error: cErr } = await supabaseAdmin
      .from("clientes")
      .select("id, nome, plano_label, plano_atual, status_contrato, status_cadastro")
      .eq("auth_user_id", context.userId)
      .maybeSingle();
    if (cErr) throw cErr;
    if (!cliente) throw new Error("Nenhum portal encontrado para este usuário.");
    if (cliente.status_cadastro !== "ativo") {
      throw new Error("Seu cadastro ainda não está ativo. Fale com a equipe para liberar o acesso.");
    }

    const [fasesRes, topicosRes, conteudosRes] = await Promise.all([
      supabaseAdmin.from("fases").select("id, nome, descricao").order("id"),
      supabaseAdmin.from("topicos_fase").select("id, fase_id, nome, ordem").order("fase_id").order("ordem"),
      supabaseAdmin
        .from("conteudos_cliente")
        .select("id, topico_id, tipo, titulo, descricao, url, storage_path, storage_bucket, created_at, topicos_fase(nome, fase_id)")
        .eq("cliente_id", cliente.id)
        .order("created_at"),
    ]);
    if (fasesRes.error) throw fasesRes.error;
    if (topicosRes.error) throw topicosRes.error;
    if (conteudosRes.error) throw conteudosRes.error;

    const topicos = (topicosRes.data ?? []) as Topico[];
    const conteudosCliente = await Promise.all(
      (conteudosRes.data ?? []).map((c) => assinarConteudo(supabaseAdmin, c as unknown as RawConteudoRow)),
    );
    const conteudosGlobais = await fetchGlobaisMerge(supabaseAdmin, topicos);

    return {
      cliente: {
        id: cliente.id as string,
        nome: cliente.nome as string,
        plano: (cliente.plano_label as string) ?? (cliente.plano_atual as string) ?? null,
        status: cliente.status_contrato as string,
        status_cadastro: cliente.status_cadastro as string,
      },
      fases: (fasesRes.data ?? []) as Fase[],
      topicos,
      conteudos: [...conteudosCliente, ...conteudosGlobais],
    };
  });

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
        .select("id, topico_id, tipo, titulo, descricao, url, storage_path, storage_bucket, created_at, topicos_fase(nome, fase_id)")
        .eq("cliente_id", data.clienteId)
        .order("created_at"),
    ]);
    if (fasesRes.error) throw fasesRes.error;
    if (topicosRes.error) throw topicosRes.error;
    if (conteudosRes.error) throw conteudosRes.error;

    const topicos = (topicosRes.data ?? []) as Topico[];
    const conteudosCliente = await Promise.all(
      (conteudosRes.data ?? []).map((c) => assinarConteudo(supabaseAdmin, c as unknown as RawConteudoRow)),
    );
    const conteudosGlobais = await fetchGlobaisMerge(supabaseAdmin, topicos);

    return {
      cliente: {
        id: cliente.id as string,
        nome: cliente.nome as string,
        plano: (cliente.plano_label as string) ?? (cliente.plano_atual as string) ?? null,
        status: cliente.status_contrato as string,
        status_cadastro: (cliente.status_cadastro as string) ?? null,
      },
      fases: (fasesRes.data ?? []) as Fase[],
      topicos,
      conteudos: [...conteudosCliente, ...conteudosGlobais],
    };
  });
