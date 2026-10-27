import { useRouteContext } from "@tanstack/react-router";
import { canAccess } from "@/lib/permissions";

/** Perfis do usuário (carregados no guard do /admin) + atalho de checagem por seção. Só oculta UI; o banco continua sendo a barreira. */
export function useStaffAccess() {
  const ctx = useRouteContext({ from: "/_authenticated/admin", shouldThrow: false }) as { roles?: string[] } | undefined;
  const roles = ctx?.roles ?? [];
  return { roles, can: (path: string) => canAccess(path, roles) };
}
