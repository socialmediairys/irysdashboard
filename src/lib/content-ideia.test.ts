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

import { producaoFaltando } from "./content";
describe("validação da produção final", () => {
  const img = [{ tipo: "imagem" }], vid = [{ tipo: "video" }];
  it("post sem arte é bloqueado", () => expect(producaoFaltando("Post", "x", [])).toMatch(/arte/));
  it("carrossel sem legenda é bloqueado", () => expect(producaoFaltando("Carrossel", " ", img)).toMatch(/legenda/));
  it("reels com só imagem é bloqueado", () => expect(producaoFaltando("Reels", "x", img)).toMatch(/vídeo/));
  it("reels completo passa", () => expect(producaoFaltando("Reels", "x", vid)).toBeNull());
  it("live não exige mídia nem legenda", () => expect(producaoFaltando("Live", null, [])).toBeNull());
});
