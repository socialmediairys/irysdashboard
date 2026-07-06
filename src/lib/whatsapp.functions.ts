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
  // Assume Brasil se vier sem código do país (10 ou 11 dígitos).
  const withCountry = digits.length <= 11 ? `55${digits}` : digits;
  // E.164 aceita 8 a 15 dígitos; para BR esperamos 12 ou 13.
  if (withCountry.length < 10 || withCountry.length > 15) {
    return {
      ok: false,
      reason: `Telefone do cliente inválido (${raw}). Use DDD + número, ex.: 11 99999-9999.`,
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

export const sendWhatsappCobrancaTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      clienteId: string;
      templateName: string;
      languageCode?: string;
    }) => {
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
    const logEnvio = async (row: {
      cliente_id: string | null;
      cliente_nome: string | null;
      to_phone: string;
      valor_cobrado: number | null;
      meta_message_id: string | null;
      status: "enviado" | "erro";
      error_message: string | null;
    }) => {
      await context.supabase.from("whatsapp_envios").insert({
        user_id: context.userId,
        cliente_id: row.cliente_id,
        cliente_nome: row.cliente_nome,
        to_phone: row.to_phone,
        template_name: data.templateName,
        language_code: data.languageCode,
        valor_cobrado: row.valor_cobrado,
        meta_message_id: row.meta_message_id,
        status: row.status,
        error_message: row.error_message,
      });
    };

    // 1. Credenciais do WhatsApp do usuário
    const { data: conn, error: connErr } = await context.supabase
      .from("whatsapp_connections")
      .select("phone_number_id, access_token")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (connErr) throw connErr;
    if (!conn) throw new Error("WhatsApp não conectado. Conecte em Configurações → Integrações.");

    // 2. Cliente
    const { data: cliente, error: cliErr } = await context.supabase
      .from("clientes")
      .select("id, nome, telefone, valor_mensal")
      .eq("id", data.clienteId)
      .maybeSingle();
    if (cliErr) throw cliErr;
    if (!cliente) throw new Error("Cliente não encontrado");

    // 3. Validação de telefone (antes de qualquer chamada externa)
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
      throw new Error(phone.reason);
    }
    const to = phone.phone;

    // 4. Valor pendente = soma de entradas_financeiras não pagas
    const { data: pendentes, error: entErr } = await context.supabase
      .from("entradas_financeiras")
      .select("valor, status_pagamento")
      .eq("cliente_id", data.clienteId)
      .neq("status_pagamento", "pago");
    if (entErr) throw entErr;
    const somaPendente = (pendentes ?? []).reduce(
      (acc, row) => acc + Number(row.valor ?? 0),
      0,
    );
    const valorPendente =
      somaPendente > 0 ? somaPendente : Number(cliente.valor_mensal ?? 0);

    // 5. Envia template pela Meta Cloud API
    const url = `https://graph.facebook.com/v20.0/${conn.phone_number_id}/messages`;
    const payload = {
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name: data.templateName,
        language: { code: data.languageCode },
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
        to_phone: to,
        valor_cobrado: valorPendente,
        meta_message_id: null,
        status: "erro",
        error_message: detail,
      });
      throw new Error(detail);
    }

    const messageId = json.messages?.[0]?.id ?? null;
    await logEnvio({
      cliente_id: cliente.id,
      cliente_nome: cliente.nome,
      to_phone: to,
      valor_cobrado: valorPendente,
      meta_message_id: messageId,
      status: "enviado",
      error_message: null,
    });

    return {
      ok: true as const,
      messageId,
      to,
      nome: cliente.nome,
      valorPendente,
      valorFormatado: formatBRL(valorPendente),
    };
  });

export const listWhatsappEnvios = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("whatsapp_envios")
      .select("id, cliente_id, cliente_nome, to_phone, template_name, valor_cobrado, meta_message_id, status, error_message, created_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return data ?? [];
  });
