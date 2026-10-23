/// <reference types="bun" />
import { describe, expect, mock, test } from "bun:test";
import { createClient } from "@supabase/supabase-js";

// Exercise the actual handlers and PostgREST request, without real account changes.
mock.module("@tanstack/react-start", () => ({
  createServerFn: () => {
    const builder = {
      middleware: () => builder,
      inputValidator: () => builder,
      handler: (handler: unknown) => handler,
    };
    return builder;
  },
}));
mock.module("@/integrations/supabase/auth-middleware", () => ({ requireSupabaseAuth: {} }));

type Row = { auth_user_id: string; nome: string; email: string; status: string; observacao?: string; cliente_id?: string };
let row: Row | undefined;
const client = createClient("https://cadastros-test.invalid", "test-key", {
  auth: { persistSession: false, autoRefreshToken: false },
  global: {
    fetch: async (_input, init) => {
      const incoming = JSON.parse(String(init?.body)) as Row;
      const ignore = new Headers(init?.headers).get("Prefer")?.includes("resolution=ignore-duplicates");
      if (!row || !ignore) row = { ...row, ...incoming };
      return new Response(null, { status: 201 });
    },
  },
});
mock.module("@/integrations/supabase/client.server", () => ({
  supabaseAdmin: {
    from: client.from.bind(client),
    auth: { admin: { getUserById: async () => ({ data: { user: { id: "user-1" } }, error: null }) } },
  },
}));
const functions = await import("./cadastros.functions");
type Handler = (input: { data: { nome: string; email: string; authUserId: string }; context: { supabase: typeof client; userId: string } }) => Promise<unknown>;

for (const name of ["criarSolicitacao", "registrarSolicitacaoPublica"] as const) {
  describe(name, () => {
    const submit = () => (functions[name] as unknown as Handler)({
      data: { nome: "New name", email: "new@example.test", authUserId: "user-1" },
      context: { supabase: client, userId: "user-1" },
    });
    for (const status of ["aprovado", "rejeitado", "pendente"]) {
      test(`preserves an existing ${status} request and its note/client`, async () => {
        row = { auth_user_id: "user-1", nome: "Original", email: "original@example.test", status, observacao: "Decisão da equipe", cliente_id: "client-1" };
        const original = { ...row };
        await submit();
        await submit();
        expect(row).toEqual(original);
      });
    }
    test("creates a pending request only when missing", async () => {
      row = undefined;
      await submit();
      expect(row).toEqual({ auth_user_id: "user-1", nome: "New name", email: "new@example.test", status: "pendente" });
    });
  });
}