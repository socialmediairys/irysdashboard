/** Perfis internos e o que cada um vê no Painel. Espelha as policies do banco (que são a barreira real). */
export const STAFF_ROLES = ["admin", "gestor", "editor", "social", "financeiro", "juridico"] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

const ALL: StaffRole[] = [...STAFF_ROLES];
/** Prefixo de rota → perfis permitidos. Rota não listada = só admin. */
export const SECTION_ROLES: Record<string, StaffRole[]> = {
  "/admin/visao-geral": ALL,
  "/admin/sprints": ALL,
  "/admin/agenda": ALL,
  "/admin/clientes": ["admin", "gestor", "editor", "social", "financeiro"],
  "/admin/estrategia": ["admin", "gestor"],
  "/admin/crm": ["admin", "gestor"],
  "/admin/conteudo": ["admin", "gestor", "editor", "social"],
  "/admin/biblioteca-midia": ["admin", "gestor", "editor", "social"],
  "/admin/relatorios": ["admin", "gestor", "social"],
  "/admin/metricas-sociais": ["admin", "gestor", "social"],
  "/admin/financeiro": ["admin", "financeiro"],
  "/admin/juridico": ["admin", "juridico"],
};

export const staffRoles = (roles: string[]) => roles.filter((r): r is StaffRole => (STAFF_ROLES as readonly string[]).includes(r));

export function canAccess(path: string, roles: string[]): boolean {
  const mine = staffRoles(roles);
  if (mine.includes("admin")) return true;
  if (path === "/admin" || path === "/admin/") return mine.length > 0;
  const key = Object.keys(SECTION_ROLES).find((p) => path === p || path.startsWith(`${p}/`));
  return !!key && SECTION_ROLES[key].some((r) => mine.includes(r));
}
