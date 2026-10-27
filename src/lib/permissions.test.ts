import { describe, expect, it } from "vitest";
import { canAccess } from "./permissions";

describe("acesso da equipe ao Painel", () => {
  it("admin acessa tudo", () => expect(canAccess("/admin/configuracoes", ["admin"])).toBe(true));
  it("financeiro acessa Financeiro, não Estratégia nem Configurações", () => {
    expect(canAccess("/admin/financeiro", ["financeiro"])).toBe(true);
    expect(canAccess("/admin/estrategia", ["financeiro"])).toBe(false);
    expect(canAccess("/admin/configuracoes", ["financeiro"])).toBe(false);
  });
  it("jurídico acessa Jurídico, não Clientes", () => {
    expect(canAccess("/admin/juridico", ["juridico"])).toBe(true);
    expect(canAccess("/admin/clientes/x", ["juridico"])).toBe(false);
  });
  it("gestor acessa Estratégia e Comercial, não Financeiro", () => {
    expect(canAccess("/admin/estrategia", ["gestor"])).toBe(true);
    expect(canAccess("/admin/crm", ["gestor"])).toBe(true);
    expect(canAccess("/admin/financeiro", ["gestor"])).toBe(false);
  });
  it("editor e social acessam Conteúdo; só social vê Relatórios", () => {
    expect(canAccess("/admin/conteudo", ["editor"])).toBe(true);
    expect(canAccess("/admin/relatorios", ["editor"])).toBe(false);
    expect(canAccess("/admin/relatorios", ["social"])).toBe(true);
  });
  it("cliente nunca acessa o Painel", () => {
    expect(canAccess("/admin/visao-geral", ["cliente"])).toBe(false);
    expect(canAccess("/admin/sprints", [])).toBe(false);
  });
  it("cadastros, equipe e Portais são só admin", () => {
    for (const p of ["/admin/cadastros", "/admin/equipe", "/admin/portal-conteudos"]) expect(canAccess(p, ["gestor", "editor", "social", "financeiro", "juridico"])).toBe(false);
  });
});
