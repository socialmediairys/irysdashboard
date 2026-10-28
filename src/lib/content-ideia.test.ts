import { describe, expect, it } from "vitest";
import { canSendIdea, canSendProduction } from "./content";

describe("aprovação em duas etapas", () => {
  it("produção final só vai à cliente com a ideia aprovada", () => {
    expect(canSendProduction("aguardando", false)).toBe(false);
    expect(canSendProduction("nao_enviada", false)).toBe(false);
    expect(canSendProduction("aprovada", false)).toBe(true);
  });
  it("conteúdos antigos já enviados continuam podendo ser reenviados", () => {
    expect(canSendProduction("nao_enviada", true)).toBe(true);
  });
  it("ideia só é enviada quando ainda não foi ou quando a cliente pediu alteração", () => {
    expect(canSendIdea("nao_enviada")).toBe(true);
    expect(canSendIdea("alteracao_solicitada")).toBe(true);
    expect(canSendIdea("aguardando")).toBe(false);
    expect(canSendIdea("aprovada")).toBe(false);
  });
});
