import { describe, expect, it } from "vitest";
import { contentDragCheck, ordemBetween, ordemForDrop } from "./kanban";

const col = [{ id: "a", ordem: 10 }, { id: "b", ordem: 20 }, { id: "c", ordem: 30 }];

describe("ordem manual", () => {
  it("coloca entre dois vizinhos", () => expect(ordemBetween(10, 20)).toBe(15));
  it("mover c para o topo fica antes de a", () => expect(ordemForDrop(col, "c", 0)).toBeLessThan(10));
  it("mover a para o fim fica depois de c", () => expect(ordemForDrop(col, "a", 2)).toBeGreaterThan(30));
  it("soltar em outra coluna no meio", () => expect(ordemForDrop(col, "x", 1)).toBe(15));
});

describe("regras de arraste em Produção", () => {
  it("não envia ao cliente arrastando", () => expect(contentDragCheck("revisao_interna", "com_cliente").ok).toBe(false));
  it("não aprova arrastando", () => expect(contentDragCheck("com_cliente", "aprovado").ok).toBe(false));
  it("não publica sem aprovação", () => expect(contentDragCheck("em_producao", "publicado").ok).toBe(false));
  it("aprovado pode ir para agendado", () => expect(contentDragCheck("aprovado", "agendado").ok).toBe(true));
  it("produção livre entre etapas internas", () => expect(contentDragCheck("planejado", "em_producao").ok).toBe(true));
});
