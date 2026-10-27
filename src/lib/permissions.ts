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

/** Abas da página do cliente → perfis. Espelha RLS: arquivos/onboarding/edição do cadastro são só admin. */
export const CLIENT_TAB_ROLES: Record<string, StaffRole[]> = {
  "visao-geral": ["admin", "gestor", "editor", "social", "financeiro"],
  estrategia: ["admin", "gestor"],
  conteudos: ["admin", "gestor", "editor", "social"],
  planejamento: ["admin", "gestor", "editor", "social"],
  metricas: ["admin", "gestor", "social"],
  arquivos: ["admin"],
  financeiro: ["admin", "financeiro"],
  portal: ["admin"],
};

export function canClientTab(tab: string, roles: string[]): boolean {
  const mine = staffRoles(roles);
  if (mine.includes("admin")) return true;
  return (CLIENT_TAB_ROLES[tab] ?? []).some((r) => mine.includes(r));
}

export const isAdmin = (roles: string[]) => roles.includes("admin");
