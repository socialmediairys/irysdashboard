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
