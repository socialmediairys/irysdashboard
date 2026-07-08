import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type SolicitacaoStatus = "pendente" | "aprovado" | "rejeitado";

export type Solicitacao = {
  id: string;
  auth_user_id: string;
  nome: string;
  email: string;
  status: SolicitacaoStatus;
  cliente_id: string | null;
  observacao: string | null;
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
  if (!data) throw new Error("Apenas administradores podem executar esta ação.");
}

// Retorna a situação de cadastro do usuário logado.
export const meuStatusCadastro = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const isAdmin = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (isAdmin.data) return { tipo: "admin" as const };

    const { data: cliente } = await context.supabase
      .from("clientes")
      .select("id, nome, status_cadastro")
      .eq("auth_user_id", context.userId)
      .maybeSingle();

    if (cliente && cliente.status_cadastro === "ativo") {
      return {
        tipo: "cliente_ativo" as const,
        cliente_id: cliente.id as string,
        nome: cliente.nome as string,
      };
    }

    const { data: sol } = await context.supabase
      .from("solicitacoes_cadastro")
      .select("status, observacao")
      .eq("auth_user_id", context.userId)
      .maybeSingle();

    if (sol?.status === "rejeitado") {
      return { tipo: "rejeitado" as const, observacao: sol.observacao ?? null };
    }
    if (sol?.status === "pendente") {
      return { tipo: "pendente" as const };
    }
    return { tipo: "sem_cadastro" as const };
  });

// Cria/atualiza a solicitação de cadastro do usuário logado.
export const criarSolicitacao = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { nome: string; email: string }) => {
    const nome = input.nome?.trim();
    const email = input.email?.trim().toLowerCase();
    if (!nome) throw new Error("Nome é obrigatório");
    if (!email) throw new Error("E-mail é obrigatório");
    return { nome, email };
  })
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("solicitacoes_cadastro")
      .upsert(
        {
          auth_user_id: context.userId,
          nome: data.nome,
          email: data.email,
          status: "pendente",
        },
        { onConflict: "auth_user_id" },
      );
    if (error) throw error;
    return { ok: true as const };
  });

// Admin: lista pendentes.
export const listarPendentes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context);
    const { data, error } = await context.supabase
      .from("solicitacoes_cadastro")
      .select("id, auth_user_id, nome, email, status, cliente_id, observacao, created_at")
      .eq("status", "pendente")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Solicitacao[];
  });

// Admin: aprova, vinculando a um cliente existente.
export const aprovarSolicitacao = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { solicitacaoId: string; clienteId: string }) => {
    const solicitacaoId = input.solicitacaoId?.trim();
    const clienteId = input.clienteId?.trim();
    if (!solicitacaoId) throw new Error("solicitacaoId é obrigatório");
    if (!clienteId) throw new Error("clienteId é obrigatório");
    return { solicitacaoId, clienteId };
  })
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: sol, error: solErr } = await supabaseAdmin
      .from("solicitacoes_cadastro")
      .select("id, auth_user_id, status")
      .eq("id", data.solicitacaoId)
      .maybeSingle();
    if (solErr) throw solErr;
    if (!sol) throw new Error("Solicitação não encontrada.");
    if (sol.status !== "pendente") throw new Error("Esta solicitação já foi processada.");

    const { data: existente } = await supabaseAdmin
      .from("clientes")
      .select("id, auth_user_id")
      .eq("id", data.clienteId)
      .maybeSingle();
    if (!existente) throw new Error("Cliente não encontrado.");
    if (existente.auth_user_id && existente.auth_user_id !== sol.auth_user_id) {
      throw new Error("Este cliente já está vinculado a outra conta.");
    }

    const { error: updCliErr } = await supabaseAdmin
      .from("clientes")
      .update({ auth_user_id: sol.auth_user_id, status_cadastro: "ativo" })
      .eq("id", data.clienteId);
    if (updCliErr) throw updCliErr;

    // Mantém profiles.cliente_id em sincronia (usado por policies via current_cliente_id()).
    const { error: profErr } = await supabaseAdmin
      .from("profiles")
      .update({ cliente_id: data.clienteId })
      .eq("id", sol.auth_user_id);
    if (profErr) throw profErr;

    const { error: updSolErr } = await supabaseAdmin
      .from("solicitacoes_cadastro")
      .update({ status: "aprovado", cliente_id: data.clienteId })
      .eq("id", data.solicitacaoId);
    if (updSolErr) throw updSolErr;

    return { ok: true as const };
  });

// Admin: rejeita.
export const rejeitarSolicitacao = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { solicitacaoId: string; motivo?: string }) => {
    const solicitacaoId = input.solicitacaoId?.trim();
    if (!solicitacaoId) throw new Error("solicitacaoId é obrigatório");
    return { solicitacaoId, motivo: input.motivo?.trim() || null };
  })
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { error } = await context.supabase
      .from("solicitacoes_cadastro")
      .update({ status: "rejeitado", observacao: data.motivo })
      .eq("id", data.solicitacaoId);
    if (error) throw error;
    return { ok: true as const };
  });

// Admin: lista clientes candidatos para vinculação (sem auth vinculado).
export const listarClientesDisponiveis = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context);
    const { data, error } = await context.supabase
      .from("clientes")
      .select("id, nome, email")
      .is("auth_user_id", null)
      .order("nome");
    if (error) throw error;
    return (data ?? []) as { id: string; nome: string; email: string | null }[];
  });
