import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { STEPS, STATUS_LABEL, type EtapaStatus } from "@/lib/strategy";
import type { StrategyData } from "@/components/strategy/useStrategy";

const clean = (v: unknown) => String(v ?? "").trim();
const safeName = (v: string) => v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-|-$/g, "").toLowerCase();

export function exportStrategyPdf(clienteNome: string, data: StrategyData) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const margin = 16;
  const width = 210 - margin * 2;
  let y = 18;
  const addPageIfNeeded = (need = 24) => { if (y + need > 282) { doc.addPage(); y = 18; } };
  const title = (text: string) => { addPageIfNeeded(16); doc.setFont("helvetica", "bold"); doc.setFontSize(15); doc.text(text, margin, y); y += 8; };
  const body = (text: string) => { if (!clean(text)) return; doc.setFont("helvetica", "normal"); doc.setFontSize(9.5); const lines = doc.splitTextToSize(text, width); addPageIfNeeded(lines.length * 4 + 4); doc.text(lines, margin, y); y += lines.length * 4 + 4; };
  const kv = (label: string, value: unknown) => { const v = clean(value); if (!v) return; addPageIfNeeded(10); doc.setFont("helvetica", "bold"); doc.setFontSize(8.5); doc.text(label, margin, y); doc.setFont("helvetica", "normal"); const lines = doc.splitTextToSize(v, width - 42); doc.text(lines, margin + 42, y); y += Math.max(5, lines.length * 4); };

  doc.setFont("helvetica", "bold"); doc.setFontSize(22); doc.text("Estratégia de Social Media", margin, y); y += 9;
  doc.setFontSize(13); doc.setFont("helvetica", "normal"); doc.text(clienteNome, margin, y); y += 6;
  doc.setFontSize(8.5); doc.setTextColor(110); doc.text(`Exportado em ${new Date().toLocaleDateString("pt-BR")}`, margin, y); doc.setTextColor(0); y += 12;

  title("Jornada estratégica");
  autoTable(doc, { startY: y, margin: { left: margin, right: margin }, head: [["Etapa", "Status"]], body: STEPS.map(s => [ `${s.n}. ${s.titulo}`, STATUS_LABEL[(data.etapas.find(e => e.etapa === s.n)?.status ?? "nao_iniciada") as EtapaStatus] ]), styles: { fontSize: 8, cellPadding: 2 }, headStyles: { fillColor: [70,70,72] } });
  y = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ? (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10 : y + 20;

  if (data.briefing) {
    title("Briefing estratégico");
    for (const [key, value] of Object.entries(data.briefing.mapa ?? {})) {
      const item = value as { resposta?: string; status?: string };
      if (clean(item?.resposta)) kv(key.replaceAll("_", " "), item.resposta);
    }
    body(data.briefing.lacunas ?? "");
  }

  if (data.fontes.length) {
    title("Fontes");
    autoTable(doc, { startY: y, margin: { left: margin, right: margin }, head: [["Fonte", "Tipo", "Etapa", "Referência"]], body: data.fontes.map(f => [f.nome, f.tipo, String(f.etapa), f.url ?? f.data_ref ?? "—"]), styles: { fontSize: 7.5, cellPadding: 2 }, headStyles: { fillColor: [70,70,72] } });
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  if (data.evidencias.length) {
    title("Banco de evidências");
    autoTable(doc, { startY: y, margin: { left: margin, right: margin }, head: [["Evidência", "Classificação", "Categoria", "Etapa"]], body: data.evidencias.map(e => [e.informacao, e.classificacao, e.categoria ?? "—", e.etapa ? String(e.etapa) : "—"]), styles: { fontSize: 7.2, cellPadding: 2 }, headStyles: { fillColor: [70,70,72] }, columnStyles: { 0: { cellWidth: 92 } } });
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  if (data.concorrentes.length) {
    title("Concorrência");
    const fields = ["nome", "tipo", "posicionamento", "publico", "oferta", "conteudo", "prova", "cta", "diferencial"];
    autoTable(doc, { startY: y, margin: { left: margin, right: margin }, head: [["Critério", ...data.concorrentes.map(c => c.nome)]], body: fields.slice(1).map(f => [f[0].toUpperCase()+f.slice(1), ...data.concorrentes.map(c => clean(c[f]) || "—")]), styles: { fontSize: 6.7, cellPadding: 1.7, overflow: "linebreak" }, headStyles: { fillColor: [70,70,72] } });
    y = (doc as any).lastAutoTable.finalY + 10;
  }

  const achados = data.achados.filter(a => a.status !== "descartado");
  if (achados.length) {
    title("Diagnóstico e decisões");
    for (const a of achados) { kv(a.tipo.replaceAll("_", " "), a.titulo); body(a.descricao ?? ""); }
  }

  const defs = [...data.definicoes].sort((a,b) => a.etapa-b.etapa);
  if (defs.some(d => clean(d.valor))) {
    title("Direcionamento estratégico");
    for (const d of defs) if (clean(d.valor)) kv(`${STEPS[d.etapa-1]?.titulo ?? `Etapa ${d.etapa}`} · ${d.campo.replaceAll("_", " ")}`, d.valor);
  }

  if (data.pilares.length) {
    title("Sistema editorial");
    for (const p of data.pilares) {
      kv("Pilar", p.nome); body(p.descricao ?? "");
      for (const t of data.temas.filter(t => t.pilar_id === p.id)) {
        kv("Tema", t.nome); body(t.descricao ?? "");
        for (const m of data.mensagens.filter(m => m.tema_id === t.id)) { kv("Mensagem", m.mensagem); kv("CTA", m.cta); }
      }
    }
  }

  if (data.calendario.length) {
    title("Calendário estratégico");
    autoTable(doc, { startY: y, margin: { left: margin, right: margin }, head: [["Data", "Tema", "Canal", "Formato", "Objetivo"]], body: data.calendario.map(i => [new Date(`${i.data}T12:00:00`).toLocaleDateString("pt-BR"), i.titulo ?? "—", i.canal ?? "—", i.formato ?? "—", i.objetivo ?? "—"]), styles: { fontSize: 7.3, cellPadding: 2 }, headStyles: { fillColor: [70,70,72] } });
  }

  doc.save(`estrategia-${safeName(clienteNome) || "cliente"}.pdf`);
}
