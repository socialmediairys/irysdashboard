import { describe, expect, it } from "vitest";
import { competencia, isMonthKey, monthLabel, shiftMonth } from "./content";

describe("competência mensal", () => {
  it("usa pipeline_mes mesmo com data prevista em outro mês", () => {
    expect(competencia({ pipeline_mes: "2026-11-01", data_prevista: "2026-12-03" })).toBe("2026-11");
  });
  it("cai para a data prevista quando não há competência", () => {
    expect(competencia({ pipeline_mes: null, data_prevista: "2026-12-03" })).toBe("2026-12");
  });
  it("navega entre anos", () => {
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
  });
  it("formata Novembro/2026", () => expect(monthLabel("2026-11")).toBe("Novembro/2026"));
  it("rejeita mês inválido salvo", () => { expect(isMonthKey("2026-13")).toBe(false); expect(isMonthKey("2026-11")).toBe(true); });
});
