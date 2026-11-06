import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { STEPS, STATUS_LABEL, type EtapaStatus } from "@/lib/strategy";
import type { StrategyData } from "@/components/strategy/useStrategy";

/** Exportação A4 com fluxo de texto paginado (sem cortes/colisões entre blocos). */
const clean = (v: unknown) => String(v ?? "").replace(/\r\n?/g, "\n").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim();
const safeName = (v: string) => v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-|-$/g, "").toLowerCase();
const humanize = (v: string) => v.replaceAll("_", " ").replace(/^./, (first) => first.toUpperCase());
const NAVY: [number, number, number] = [35, 43, 60];
const MUTED: [number, number, number] = [102, 111, 126];
const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 17;
const CONTENT_W = PAGE_W - MARGIN * 2;
const TOP = 21;
const BOTTOM = 278;

export function exportStrategyPdf(clienteNome: string, data: StrategyData) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = TOP;

  const ensure = (height: number) => {
    if (y + height > BOTTOM && y > TOP) {
      doc.addPage();
      y = TOP;
    }
  };

  const writeLines = (value: unknown, opts: { x?: number; width?: number; fontSize?: number; bold?: boolean; color?: [number, number, number]; lineHeight?: number; after?: number } = {}) => {
    const str = clean(value);
    if (!str) return;
    const { x = MARGIN, width = CONTENT_W, fontSize = 9.5, bold = false, color = NAVY, lineHeight = 4.8, after = 3 } = opts;
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(fontSize);
    doc.setTextColor(...color);
    // Preserva parágrafos e divide também valores maiores que uma página.
    for (const paragraph of str.split("\n")) {
      if (!paragraph.trim()) {
        ensure(lineHeight);
        y += lineHeight;
        continue;
      }
      const lines: string[] = doc.splitTextToSize(paragraph, width);
      for (const line of lines) {
        ensure(lineHeight);
        doc.text(line, x, y);
        y += lineHeight;
      }
    }
    y += after;
  };

  const section = (heading: string) => {
    // Evita título órfão e reserva ao menos duas linhas de conteúdo.
    ensure(23);
    y += 3;
    doc.setDrawColor(221, 225, 231);
    doc.line(MARGIN, y - 4, PAGE_W - MARGIN, y - 4);
    writeLines(heading, { fontSize: 14, bold: true, lineHeight: 7, after: 5 });
  };

  const field = (label: string, value: unknown) => {
    const str = clean(value);
    if (!str) return;
    // Rótulo permanece junto das primeiras linhas da resposta.
    ensure(18);
    writeLines(humanize(label), { fontSize: 8.5, bold: true, color: MUTED, lineHeight: 4.5, after: 1.5 });
    writeLines(str, { fontSize: 9.5, lineHeight: 5, after: 4 });
  };

  const table = (headers: string[], rows: string[][], widths?: Record<number, { cellWidth: number }>) => {
    if (!rows.length) return;
    ensure(19);
    autoTable(doc, {
      startY: y,
      margin: { left: MARGIN, right: MARGIN, top: TOP, bottom: PAGE_H - BOTTOM },
      head: [headers],
      body: rows,
      theme: "striped",
      styles: { font: "helvetica", fontSize: 8, cellPadding: 2.8, overflow: "linebreak", valign: "top", textColor: NAVY, lineColor: [229, 233, 239] },
      headStyles: { fillColor: NAVY, textColor: [255, 255, 255], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [248, 249, 251] },
      columnStyles: widths,
      rowPageBreak: "auto",
      showHead: "everyPage",
      pageBreak: "auto",
    });
    const finalY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY;
    y = (finalY ?? y) + 8;
    if (y > BOTTOM) { doc.addPage(); y = TOP; }
  };

  // Cabeçalho do documento, sem consumir uma página inteira de capa.
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, PAGE_W, 8, "F");
  y = 29;
  writeLines("ESTRATÉGIA DE SOCIAL MEDIA", { fontSize: 19, bold: true, lineHeight: 9, after: 4 });
  writeLines(clienteNome, { fontSize: 13, lineHeight: 7, after: 2 });
  writeLines(`Documento exportado em ${new Date().toLocaleDateString("pt-BR")}`, { fontSize: 8.5, color: MUTED, lineHeight: 5, after: 9 });

  section("Jornada estratégica");
  table(["Etapa", "Status"], STEPS.map((step) => [
    `${step.n}. ${step.titulo}`,
    STATUS_LABEL[(data.etapas.find((e) => e.etapa === step.n)?.status ?? "nao_iniciada") as EtapaStatus],
  ]), { 0: { cellWidth: 130 } });

  if (data.briefing) {
    section("Briefing estratégico");
    for (const [key, value] of Object.entries(data.briefing.mapa ?? {})) {
      const item = value as { resposta?: string } | null;
      if (clean(item?.resposta)) field(key, item?.resposta);
    }
    field("Lacunas e pontos de atenção", data.briefing.lacunas);
  }

  if (data.fontes.length) {
    section("Fontes");
    table(["Fonte", "Tipo", "Etapa", "Referência"], data.fontes.map((f) => [
      clean(f.nome), clean(f.tipo), String(f.etapa), clean(f.url || f.data_ref) || "—",
    ]), { 0: { cellWidth: 49 }, 1: { cellWidth: 33 }, 2: { cellWidth: 17 }, 3: { cellWidth: 77 } });
  }

  if (data.evidencias.length) {
    section("Banco de evidências");
    table(["Evidência", "Classificação", "Categoria", "Etapa"], data.evidencias.map((e) => [
      clean(e.informacao), clean(e.classificacao), clean(e.categoria) || "—", e.etapa ? String(e.etapa) : "—",
    ]), { 0: { cellWidth: 91 }, 1: { cellWidth: 39 }, 2: { cellWidth: 30 }, 3: { cellWidth: 16 } });
  }

  if (data.concorrentes.length) {
    section("Análise de concorrentes");
    // Um bloco por concorrente: evita colunas minúsculas quando há muitos nomes.
    const fields = ["tipo", "posicionamento", "publico", "oferta", "conteudo", "prova", "cta", "diferencial"];
    for (const [index, competitor] of data.concorrentes.entries()) {
      ensure(20);
      writeLines(`${index + 1}. ${clean(competitor.nome) || "Concorrente"}`, { fontSize: 11, bold: true, lineHeight: 6, after: 3 });
      table(["Critério", "Análise"], fields
        .filter((key) => clean(competitor[key]))
        .map((key) => [humanize(key), clean(competitor[key])]), { 0: { cellWidth: 44 }, 1: { cellWidth: 132 } });
    }
  }

  const findings = data.achados.filter((a) => a.status !== "descartado");
  if (findings.length) {
    section("Diagnóstico e decisões");
    for (const finding of findings) {
      field(humanize(finding.tipo), finding.titulo);
      writeLines(finding.descricao, { lineHeight: 5, after: 5 });
    }
  }

  const definitions = [...data.definicoes].sort((a, b) => a.etapa - b.etapa);
  if (definitions.some((d) => clean(d.valor))) {
    section("Direcionamento estratégico");
    for (const definition of definitions) {
      if (clean(definition.valor)) field(`${STEPS[definition.etapa - 1]?.titulo ?? `Etapa ${definition.etapa}`} · ${humanize(definition.campo)}`, definition.valor);
    }
  }

  if (data.pilares.length) {
    section("Sistema editorial");
    for (const pillar of data.pilares) {
      field("Pilar", pillar.nome);
      writeLines(pillar.descricao, { lineHeight: 5, after: 3 });
      for (const topic of data.temas.filter((t) => t.pilar_id === pillar.id)) {
        field("Tema", topic.nome);
        writeLines(topic.descricao, { lineHeight: 5, after: 2 });
        for (const message of data.mensagens.filter((m) => m.tema_id === topic.id)) {
          field("Mensagem", message.mensagem);
          field("CTA", message.cta);
        }
      }
      y += 3;
    }
  }

  if (data.calendario.length) {
    section("Calendário estratégico");
    table(["Data", "Tema", "Canal", "Formato", "Objetivo"], data.calendario.map((item) => [
      item.data ? new Date(`${item.data}T12:00:00`).toLocaleDateString("pt-BR") : "—",
      clean(item.titulo) || "—", clean(item.canal) || "—", clean(item.formato) || "—", clean(item.objetivo) || "—",
    ]), { 0: { cellWidth: 23 }, 1: { cellWidth: 45 }, 2: { cellWidth: 30 }, 3: { cellWidth: 31 }, 4: { cellWidth: 47 } });
  }

  // Rodapé discreto e constante, inclusive nas páginas criadas pelo autoTable.
  const totalPages = doc.getNumberOfPages();
  for (let page = 1; page <= totalPages; page++) {
    doc.setPage(page);
    doc.setDrawColor(225, 229, 234);
    doc.line(MARGIN, 285, PAGE_W - MARGIN, 285);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text("Irys Dashboard · Estratégia", MARGIN, 291);
    doc.text(`${page} / ${totalPages}`, PAGE_W - MARGIN, 291, { align: "right" });
  }

  doc.save(`estrategia-${safeName(clienteNome) || "cliente"}.pdf`);
}
