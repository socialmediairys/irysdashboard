import { describe, expect, it } from "vitest";
import { canSendIdea, canSendProduction, ideaEligible, canWithdrawIdea, canWithdrawProduction, publicationFormat } from "./content";

describe("aprovação em duas etapas", () => {
  it("produção final só vai à cliente com a ideia aprovada", () => {
    expect(canSendProduction("aguardando", false)).toBe(false);
    expect(canSendProduction("nao_enviada", false)).toBe(false);
    expect(canSendProduction("aprovada", false)).toBe(true);
  });
  it("conteúdos antigos já enviados continuam podendo ser reenviados", () => {
    expect(canSendProduction("nao_enviada", true)).toBe(true);
  });
  it("reabrir ideia invalida autorização anterior para enviar produção", () => {
    expect(canSendProduction("nao_enviada", true, true)).toBe(false);
    expect(canSendProduction("aguardando", true, true)).toBe(false);
    expect(canSendProduction("aprovada", true, true)).toBe(true);
  });
  it("lote seleciona somente ideias elegíveis e completas", () => {
    expect(ideaEligible({ status_ideia: "nao_enviada", titulo: "Ideia", desenvolvimento: null })).toBe(true);
    expect(ideaEligible({ status_ideia: "alteracao_solicitada", titulo: "Ideia", desenvolvimento: null })).toBe(true);
    expect(ideaEligible({ status_ideia: "aguardando", titulo: "Ideia", desenvolvimento: null })).toBe(false);
    expect(ideaEligible({ status_ideia: "aprovada", titulo: "Ideia", desenvolvimento: null })).toBe(false);
    expect(ideaEligible({ status_ideia: "nao_enviada", titulo: " ", desenvolvimento: null })).toBe(false);
  });
  it("retirada comum só permite estados pendentes ou com alterações", () => {
    expect(canWithdrawIdea("aguardando")).toBe(true);
    expect(canWithdrawIdea("alteracao_solicitada")).toBe(true);
    expect(canWithdrawIdea("aprovada")).toBe(false);
    expect(canWithdrawProduction("com_cliente")).toBe(true);
    expect(canWithdrawProduction("alteracao_solicitada")).toBe(true);
    expect(canWithdrawProduction("aprovado")).toBe(false);
  });
  it("formato legado é exibido como Reels sem modificar outros formatos", () => {
    expect(publicationFormat("Vídeo")).toBe("Reels");
    expect(publicationFormat("video")).toBe("Reels");
    expect(publicationFormat("Story")).toBe("Story");
    expect(publicationFormat("Live")).toBe("Live");
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
