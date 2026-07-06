import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type MetaPhoneInfo = {
  id: string;
  display_phone_number?: string;
  verified_name?: string;
  whatsapp_business_account_id?: string;
};

async function fetchPhoneInfo(phoneNumberId: string, accessToken: string): Promise<MetaPhoneInfo> {
  const url = new URL(`https://graph.facebook.com/v20.0/${phoneNumberId}`);
  url.searchParams.set("fields", "id,display_phone_number,verified_name,whatsapp_business_account_id");
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const json = (await res.json()) as { error?: { message?: string } } & MetaPhoneInfo;
  if (!res.ok) {
    throw new Error(json.error?.message || `Falha ao validar credenciais (HTTP ${res.status})`);
  }
  return json;
}

export const getWhatsappStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("whatsapp_connections")
      .select("display_phone_number, verified_name, phone_number_id, waba_id, updated_at")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw error;
    return {
      connected: !!data,
      phoneNumber: data?.display_phone_number ?? null,
      name: data?.verified_name ?? null,
      phoneNumberId: data?.phone_number_id ?? null,
      wabaId: data?.waba_id ?? null,
      updatedAt: data?.updated_at ?? null,
    };
  });

export const connectWhatsapp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { phoneNumberId: string; accessToken: string }) => {
    const phoneNumberId = input.phoneNumberId?.trim();
    const accessToken = input.accessToken?.trim();
    if (!phoneNumberId) throw new Error("Phone Number ID é obrigatório");
    if (!accessToken) throw new Error("Access Token é obrigatório");
    return { phoneNumberId, accessToken };
  })
  .handler(async ({ data, context }) => {
    const info = await fetchPhoneInfo(data.phoneNumberId, data.accessToken);
    const { error } = await context.supabase
      .from("whatsapp_connections")
      .upsert(
        {
          user_id: context.userId,
          phone_number_id: info.id,
          access_token: data.accessToken,
          waba_id: info.whatsapp_business_account_id ?? null,
          display_phone_number: info.display_phone_number ?? null,
          verified_name: info.verified_name ?? null,
        },
        { onConflict: "user_id" },
      );
    if (error) throw error;
    return {
      ok: true as const,
      phoneNumber: info.display_phone_number ?? null,
      name: info.verified_name ?? null,
    };
  });

export const disconnectWhatsapp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { error } = await context.supabase
      .from("whatsapp_connections")
      .delete()
      .eq("user_id", context.userId);
    if (error) throw error;
    return { ok: true as const };
  });

type PhoneValidation =
  | { ok: true; phone: string }
  | { ok: false; reason: string };

function validatePhone(raw: string | null | undefined): PhoneValidation {
  if (!raw || !raw.trim()) {
    return { ok: false, reason: "Cliente não tem telefone cadastrado." };
  }
  const digits = raw.replace(/\D+/g, "");
  if (!digits) {
    return { ok: false, reason: "Telefone do cliente não contém números válidos." };
  }
  const withCountry = digits.length <= 11 ? `55${digits}` : digits;
  if (withCountry.length < 10 || withCountry.length > 15) {
    return {
      ok: false,
      reason: `Telefone inválido (${raw}). Use DDD + número, ex.: 11 99999-9999.`,
    };
  }
  if (withCountry.startsWith("55") && withCountry.length !== 12 && withCountry.length !== 13) {
    return {
      ok: false,
      reason: `Telefone brasileiro inválido (${raw}). Precisa ter DDD + 8 ou 9 dígitos.`,
    };
  }
  return { ok: true, phone: withCountry };
}

function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

type EnvioResult = {
  ok: boolean;
  clienteId: string;
  nome: string | null;
  to: string | null;
  valorPendente: number | null;
  valorFormatado: string | null;
  messageId: string | null;
  error?: string;
};

async function enviarCobrancaParaCliente(
  supabase: import("@supabase/supabase-js").SupabaseClient,
  userId: string,
  clienteId: string,
  templateName: string,
  languageCode: string,
  conn: { phone_number_id: string; access_token: string },
): Promise<EnvioResult> {
  const base = {
    ok: false,
    clienteId,
    nome: null as string | null,
    to: null as string | null,
    valorPendente: null as number | null,
    valorFormatado: null as string | null,
    messageId: null as string | null,
  };

  const logEnvio = async (row: {
    cliente_id: string | null;
    cliente_nome: string | null;
    to_phone: string;
    valor_cobrado: number | null;
    meta_message_id: string | null;
    status: "enviado" | "erro";
    error_message: string | null;
  }) => {
    await supabase.from("whatsapp_envios").insert({
      user_id: userId,
      cliente_id: row.cliente_id,
      cliente_nome: row.cliente_nome,
      to_phone: row.to_phone,
      template_name: templateName,
      language_code: languageCode,
      valor_cobrado: row.valor_cobrado,
      meta_message_id: row.meta_message_id,
      status: row.status,
      delivery_status: row.status === "enviado" ? "sent" : null,
      error_message: row.error_message,
    });
  };

  const { data: cliente, error: cliErr } = await supabase
    .from("clientes")
    .select("id, nome, telefone, valor_mensal")
    .eq("id", clienteId)
    .maybeSingle();
  if (cliErr) return { ...base, error: cliErr.message };
  if (!cliente) return { ...base, error: "Cliente não encontrado" };

  base.nome = cliente.nome;

  const phone = validatePhone(cliente.telefone);
  if (!phone.ok) {
    await logEnvio({
      cliente_id: cliente.id,
      cliente_nome: cliente.nome,
      to_phone: cliente.telefone ?? "",
      valor_cobrado: null,
      meta_message_id: null,
      status: "erro",
      error_message: phone.reason,
    });
    return { ...base, error: phone.reason };
  }
  base.to = phone.phone;

  const { data: pendentes, error: entErr } = await supabase
    .from("entradas_financeiras")
    .select("valor, status_pagamento")
    .eq("cliente_id", clienteId)
    .neq("status_pagamento", "pago");
  if (entErr) return { ...base, error: entErr.message };
  const somaPendente = (pendentes ?? []).reduce(
    (acc, row) => acc + Number(row.valor ?? 0),
    0,
  );
  const valorPendente = somaPendente > 0 ? somaPendente : Number(cliente.valor_mensal ?? 0);
  base.valorPendente = valorPendente;
  base.valorFormatado = formatBRL(valorPendente);

  const url = `https://graph.facebook.com/v20.0/${conn.phone_number_id}/messages`;
  const payload = {
    messaging_product: "whatsapp",
    to: phone.phone,
    type: "template",
    template: {
      name: templateName,
      language: { code: languageCode },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: cliente.nome ?? "cliente" },
            { type: "text", text: formatBRL(valorPendente) },
          ],
        },
      ],
    },
  };
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${conn.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const json = (await res.json()) as {
    error?: { message?: string; error_data?: { details?: string } };
    messages?: { id: string }[];
  };
  if (!res.ok) {
    const detail = json.error?.error_data?.details || json.error?.message ||
      `Falha ao enviar mensagem (HTTP ${res.status})`;
    await logEnvio({
      cliente_id: cliente.id,
      cliente_nome: cliente.nome,
      to_phone: phone.phone,
      valor_cobrado: valorPendente,
      meta_message_id: null,
      status: "erro",
      error_message: detail,
    });
    return { ...base, error: detail };
  }

  const messageId = json.messages?.[0]?.id ?? null;
  await logEnvio({
    cliente_id: cliente.id,
    cliente_nome: cliente.nome,
    to_phone: phone.phone,
    valor_cobrado: valorPendente,
    meta_message_id: messageId,
    status: "enviado",
    error_message: null,
  });
  return { ...base, ok: true, messageId };
}

async function requireConnection(
  supabase: import("@supabase/supabase-js").SupabaseClient,
  userId: string,
) {
  const { data, error } = await supabase
    .from("whatsapp_connections")
    .select("phone_number_id, access_token, waba_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("WhatsApp não conectado. Conecte em Configurações → Integrações.");
  return data;
}

export const sendWhatsappCobrancaTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: { clienteId: string; templateName: string; languageCode?: string }) => {
      const clienteId = input.clienteId?.trim();
      const templateName = input.templateName?.trim();
      if (!clienteId) throw new Error("clienteId é obrigatório");
      if (!templateName) throw new Error("templateName é obrigatório");
      return {
        clienteId,
        templateName,
        languageCode: input.languageCode?.trim() || "pt_BR",
      };
    },
  )
  .handler(async ({ data, context }) => {
    const conn = await requireConnection(context.supabase, context.userId);
    const res = await enviarCobrancaParaCliente(
      context.supabase,
      context.userId,
      data.clienteId,
      data.templateName,
      data.languageCode,
      conn,
    );
    if (!res.ok) throw new Error(res.error || "Falha ao enviar cobrança");
    return {
      ok: true as const,
      messageId: res.messageId,
      to: res.to!,
      nome: res.nome,
      valorPendente: res.valorPendente!,
      valorFormatado: res.valorFormatado!,
    };
  });

export const sendWhatsappCobrancaLote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: { clienteIds: string[]; templateName: string; languageCode?: string }) => {
      const templateName = input.templateName?.trim();
      const clienteIds = (input.clienteIds ?? []).map(s => s?.trim()).filter(Boolean);
      if (!templateName) throw new Error("templateName é obrigatório");
      if (clienteIds.length === 0) throw new Error("Selecione ao menos um cliente");
      if (clienteIds.length > 50) throw new Error("Máximo de 50 clientes por lote");
      return {
        clienteIds,
        templateName,
        languageCode: input.languageCode?.trim() || "pt_BR",
      };
    },
  )
  .handler(async ({ data, context }) => {
    const conn = await requireConnection(context.supabase, context.userId);
    const results: EnvioResult[] = [];
    for (const clienteId of data.clienteIds) {
      const r = await enviarCobrancaParaCliente(
        context.supabase,
        context.userId,
        clienteId,
        data.templateName,
        data.languageCode,
        conn,
      );
      results.push(r);
      // pequeno respiro entre chamadas para evitar rate-limit da Meta
      await new Promise(res => setTimeout(res, 120));
    }
    const enviados = results.filter(r => r.ok).length;
    const falhas = results.length - enviados;
    return { total: results.length, enviados, falhas, results };
  });

export const listWhatsappTemplates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const conn = await requireConnection(context.supabase, context.userId);
    if (!conn.waba_id) {
      throw new Error("WABA ID não encontrado — reconecte o WhatsApp para atualizar as credenciais.");
    }
    const url = new URL(`https://graph.facebook.com/v20.0/${conn.waba_id}/message_templates`);
    url.searchParams.set("fields", "name,language,status,category,components");
    url.searchParams.set("limit", "100");
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${conn.access_token}` },
    });
    const json = (await res.json()) as {
      error?: { message?: string };
      data?: Array<{
        name: string;
        language: string;
        status: string;
        category: string;
        components?: Array<{ type: string; text?: string }>;
      }>;
    };
    if (!res.ok) {
      throw new Error(json.error?.message || `Falha ao listar templates (HTTP ${res.status})`);
    }
    const templates = (json.data ?? []).map(t => {
      const body = t.components?.find(c => c.type === "BODY");
      const variables = body?.text ? (body.text.match(/\{\{\d+\}\}/g)?.length ?? 0) : 0;
      return {
        name: t.name,
        language: t.language,
        status: t.status,
        category: t.category,
        variables,
        bodyPreview: body?.text ?? null,
      };
    });
    return templates;
  });

export const listWhatsappEnvios = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("whatsapp_envios")
      .select("id, cliente_id, cliente_nome, to_phone, template_name, valor_cobrado, meta_message_id, status, delivery_status, delivered_at, read_at, failed_at, failure_reason, error_message, created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return data ?? [];
  });
