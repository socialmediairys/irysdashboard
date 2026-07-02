import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FileText, Shield, Cookie, FileSignature, Download, Copy, Check } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/juridico")({
  head: () => ({
    meta: [
      { title: "Jurídico — Irys OS" },
      { name: "description", content: "Documentos jurídicos: Termos de Uso, Política de Privacidade, Cookies e Contrato de Licença." },
    ],
  }),
  component: JuridicoPage,
});

type DocKey = "termos" | "privacidade" | "cookies" | "contrato";

const EMPRESA = {
  razao: "Thamirys Santos Aguiar Tonial",
  marca: "Irys Social Media",
  produto: "Irys OS",
  cnpj: "48.315.622/0001-35",
  email: "iryssocialmedia@gmail.com",
  cidade: "Florianópolis",
  uf: "SC",
  pais: "Brasil",
  versao: "1.0",
  atualizado: "Julho de 2026",
};

const TERMOS = `# TERMOS DE USO — IRYS OS
Versão ${EMPRESA.versao} — ${EMPRESA.atualizado}

## 1. Sobre o Produto
O Irys OS é um sistema de gestão desenvolvido por ${EMPRESA.razao}, sob a marca ${EMPRESA.marca}, destinado exclusivamente a profissionais de social media e agências de marketing digital.
Ao acessar, adquirir ou utilizar o Irys OS, você (doravante "Usuário") concorda integralmente com os termos descritos neste documento.

## 2. Licença de Uso

### 2.1 O que está permitido
- Utilizar o sistema para gerenciar sua própria operação de social media ou agência.
- Personalizar campos, dados e configurações para uso pessoal/profissional.
- Utilizar o Portal do Cliente para compartilhar conteúdo com seus próprios clientes finais.

### 2.2 O que é estritamente proibido
- Redistribuir, revender, alugar ou sublicenciar o sistema ou qualquer parte dele a terceiros.
- Copiar, reproduzir ou replicar a estrutura, design, lógica ou funcionalidades do sistema com o objetivo de criar um produto concorrente.
- Compartilhar credenciais de acesso com pessoas não autorizadas.
- Remover ou ocultar qualquer identificação de autoria da marca Irys Social Media.
- Utilizar o sistema para fins ilegais, antiéticos ou que violem direitos de terceiros.

## 3. Propriedade Intelectual
Todo o conteúdo do Irys OS — incluindo mas não se limitando a design, estrutura de banco de dados, lógica de funcionamento, textos, nomenclaturas, fluxos e identidade visual — é de propriedade exclusiva de ${EMPRESA.razao} / ${EMPRESA.marca}.
A marca Irys OS e Irys Social Media são de uso exclusivo da criadora. Qualquer uso não autorizado poderá ser tratado como violação de propriedade intelectual nos termos da Lei nº 9.610/1998 (Lei de Direitos Autorais) e da Lei nº 9.279/1996 (Lei de Propriedade Industrial).

## 4. Acesso e Conta
- O acesso ao sistema é pessoal e intransferível.
- O Usuário é responsável por manter a confidencialidade de seus dados de login.
- A criadora se reserva o direito de suspender ou encerrar o acesso em caso de violação destes termos, sem direito a reembolso.

## 5. Planos e Valores

| Plano | Mensal | Pagamento Único |
|---|---|---|
| Irys OS Starter | R$ 97/mês | R$ 697 |
| Irys OS Pro | R$ 197/mês | R$ 1.497 |
| Irys OS Agência | R$ 297/mês | Sob consulta |

Os valores vigentes sempre serão os publicados na página oficial do produto no momento da contratação.

## 6. Atualizações e Disponibilidade
- A criadora poderá atualizar, modificar ou descontinuar funcionalidades a qualquer momento, com aviso prévio sempre que possível.
- Não há garantia de disponibilidade ininterrupta do sistema, especialmente por fatores externos (plataformas terceiras, integrações de API, etc.).

## 7. Limitação de Responsabilidade
O Irys OS é uma ferramenta de apoio à gestão. A criadora não se responsabiliza por:
- Decisões de negócio tomadas com base nos dados exibidos no sistema.
- Perdas financeiras decorrentes do uso ou não uso da plataforma.
- Falhas em integrações com plataformas terceiras (Google, Meta, Instagram, etc.).

## 8. Dados e Privacidade
- Os dados inseridos pelo Usuário no sistema são de sua responsabilidade.
- A criadora não compartilha dados de clientes com terceiros.
- Consulte a Política de Privacidade completa para mais detalhes.

## 9. Suporte
O suporte está disponível conforme o plano contratado. Dúvidas e solicitações devem ser enviadas para: ${EMPRESA.email}

## 10. Foro
Fica eleito o foro da comarca de ${EMPRESA.cidade}, ${EMPRESA.uf}, ${EMPRESA.pais}, para dirimir quaisquer questões decorrentes destes Termos.

---
${EMPRESA.marca} — Todos os direitos reservados.
${EMPRESA.razao} — CNPJ ${EMPRESA.cnpj} — ${EMPRESA.cidade}/${EMPRESA.uf}
Última atualização: ${EMPRESA.atualizado}`;

const PRIVACIDADE = `# POLÍTICA DE PRIVACIDADE — IRYS OS
Versão ${EMPRESA.versao} — ${EMPRESA.atualizado}

## 1. Quem somos
O Irys OS é um sistema de gestão desenvolvido por ${EMPRESA.razao}, sob a marca ${EMPRESA.marca}, CNPJ nº ${EMPRESA.cnpj}, com sede em ${EMPRESA.cidade}, ${EMPRESA.uf}, ${EMPRESA.pais}.
Para dúvidas sobre esta política, entre em contato: ${EMPRESA.email}

## 2. Quais dados coletamos

### 2.1 Dados fornecidos diretamente por você
- Nome completo e e-mail
- Dados de login (usuário e senha criptografada)
- Informações de perfil profissional (agência, clientes, serviços)
- Dados financeiros inseridos manualmente (faturamento, despesas)
- Conteúdos, tarefas e registros criados dentro do sistema

### 2.2 Dados coletados automaticamente
- Endereço IP, tipo de dispositivo e navegador
- Data, hora e páginas acessadas dentro do sistema
- Cookies de sessão e autenticação

### 2.3 Dados de integrações (quando ativadas por você)
- Google Calendar — eventos e compromissos
- Meta Business / Instagram — métricas de desempenho
- Supabase — armazenamento seguro dos dados do sistema

## 3. Para que usamos seus dados

| Finalidade | Base Legal (LGPD) |
|---|---|
| Criar e manter sua conta | Execução de contrato |
| Funcionamento do sistema | Execução de contrato |
| Enviar notificações e alertas | Execução de contrato |
| Melhorar funcionalidades | Legítimo interesse |
| Cumprir obrigações legais | Obrigação legal |
| Comunicações sobre atualizações | Consentimento |

## 4. Por quanto tempo guardamos seus dados
- Conta ativa: enquanto ativa
- Após cancelamento: até 90 dias para auditoria
- Dados financeiros: até 5 anos (exigência fiscal)
- Logs de acesso: até 6 meses (Marco Civil da Internet)

## 5. Com quem compartilhamos
Não vendemos dados. Compartilhamos apenas com:
- Supabase — banco de dados seguro
- Google / Meta — integrações autorizadas por você
- Autoridades legais — quando exigido por lei

## 6. Seus direitos (LGPD — Lei 13.709/2018)
- Confirmar, acessar e corrigir seus dados
- Solicitar exclusão dos seus dados
- Revogar consentimento a qualquer momento
- Solicitar portabilidade dos dados
- Ser informada sobre compartilhamentos

Para exercer qualquer direito: ${EMPRESA.email}

## 7. Segurança
- Senhas criptografadas
- Conexões via HTTPS
- Controle de acesso por perfil (ADMIN / PROFISSIONAL / CLIENTE)
- Armazenamento seguro via Supabase

## 8. Encarregado de Dados (DPO)
${EMPRESA.razao} — ${EMPRESA.marca}
E-mail: ${EMPRESA.email}
${EMPRESA.cidade}, ${EMPRESA.uf}, ${EMPRESA.pais}

Última atualização: ${EMPRESA.atualizado}`;

const COOKIES_DOC = `# POLÍTICA DE COOKIES — IRYS OS
Versão ${EMPRESA.versao} — ${EMPRESA.atualizado}

## 1. O que são cookies
Cookies são pequenos arquivos armazenados no seu navegador quando você acessa o Irys OS. Permitem que o sistema funcione corretamente, mantendo sua sessão ativa e preferências salvas.

## 2. Cookies que utilizamos

### Essenciais (obrigatórios)

| Cookie | Finalidade | Duração |
|---|---|---|
| sb-auth-token | Autenticação Supabase | Sessão / 7 dias |
| sb-refresh-token | Renovação de sessão | 30 dias |
| user-role | Perfil do usuário (Admin/Profissional/Cliente) | Sessão |
| user-preferences | Preferências de layout | 1 ano |

### Analíticos

| Cookie | Finalidade | Duração |
|---|---|---|
| _session_id | Uso anônimo para melhorias | Sessão |

### Terceiros (quando integrações ativas)
- Google — sujeito à Política do Google
- Meta — sujeito à Política da Meta

## 3. Como gerenciar
Você pode deletar cookies nas configurações do seu navegador. Desativar cookies essenciais impedirá o login no sistema.

## 4. Contato
${EMPRESA.email}

Última atualização: ${EMPRESA.atualizado}`;

const CONTRATO = `# CONTRATO DE LICENÇA DE USO — IRYS OS
Versão ${EMPRESA.versao} — ${EMPRESA.atualizado}

## Partes

LICENCIANTE:
${EMPRESA.razao}, CNPJ nº ${EMPRESA.cnpj}, responsável pela marca ${EMPRESA.marca} e pelo sistema ${EMPRESA.produto}, com sede em ${EMPRESA.cidade}, ${EMPRESA.uf}, ${EMPRESA.pais}.
E-mail: ${EMPRESA.email}

LICENCIADO(A):
[Nome completo do cliente], CPF/CNPJ nº [___________], residente ou com sede em [cidade/estado].
E-mail: [e-mail do cliente]

## 1. Objeto do Contrato
Concessão de licença de uso não exclusiva, intransferível e pessoal do sistema Irys OS — plataforma de gestão para profissionais de social media e agências de marketing digital.

## 2. Plano Contratado

| Item | Descrição |
|---|---|
| Plano | ( ) Irys OS Starter   ( ) Irys OS Pro   ( ) Irys OS Agência |
| Modalidade | ( ) Mensal   ( ) Pagamento Único |
| Valor | R$ ___________ |
| Forma de pagamento | ( ) Pix   ( ) Boleto   ( ) Cartão recorrente |
| Data de vencimento | Todo dia ___ de cada mês |
| Início da vigência | ___/___/______ |
| Prazo mínimo | ( ) 3 meses   ( ) 6 meses   ( ) 12 meses |

## 3. O que está incluído por plano

Irys OS Starter — R$ 97/mês ou R$ 697 único
Dashboard 360°, Gestão de Clientes, CRM/Pipeline, Financeiro, Calendário Editorial, Criação & Aprovação, Biblioteca de Prompts IA.

Irys OS Pro — R$ 197/mês ou R$ 1.497 único
Tudo do Starter + Portal do Cliente (Central do Cliente), Métricas Sociais, Estratégia de Conteúdo, Swipe File, Integrações, Módulo Jurídico, Suporte prioritário.

Irys OS Agência — R$ 297/mês
Tudo do Pro + Gestão de Equipe & Performance, Portal do Profissional (Meu Irys), Time Tracking, Sprint & Projetos, Gestão de Capacidade, Rentabilidade por Profissional, Multi-usuário com permissões, Onboarding automatizado de equipe.

Setup de Implantação (serviço opcional): R$ 500 a R$ 1.000 — configuração personalizada do sistema + treinamento da equipe.

## 4. Obrigações do Licenciado
- Usar o sistema exclusivamente para sua própria operação
- Não redistribuir, revender ou compartilhar acesso com terceiros
- Não copiar, replicar ou fazer engenharia reversa do sistema
- Manter dados de acesso em sigilo
- Realizar pagamentos nas datas acordadas

## 5. Obrigações da Licenciante
- Manter o sistema disponível e funcional
- Notificar sobre manutenções programadas
- Prestar suporte conforme o plano
- Manter confidencialidade dos dados do Licenciado
- Notificar sobre atualizações relevantes

## 6. Pagamento e Inadimplência
- Pagamento até a data de vencimento acordada
- Após 5 dias de atraso: acesso suspenso automaticamente
- Após 15 dias de atraso: contrato rescindido, dados arquivados por 30 dias
- Taxa de reativação após suspensão: R$ 50

## 7. Renovação e Cancelamento
- Renovação automática mensal, salvo aviso prévio
- Cancelamento com 15 dias de antecedência via e-mail para ${EMPRESA.email}
- Sem reembolso proporcional de mensalidades pagas
- Após cancelamento: 30 dias para exportar dados

## 8. Rescisão por Justa Causa
Rescisão imediata, sem reembolso, em caso de:
- Violação dos termos de uso ou deste contrato
- Uso para fins ilegais ou antiéticos
- Tentativa de cópia ou redistribuição do sistema

## 9. Propriedade Intelectual
O sistema Irys OS é de propriedade exclusiva da Licenciante. Este contrato não transfere qualquer direito de propriedade ao Licenciado.

## 10. Foro
Foro da comarca de ${EMPRESA.cidade}, ${EMPRESA.uf}, ${EMPRESA.pais}.

## 11. Aceite
Licenciante: ${EMPRESA.razao} — ${EMPRESA.marca}
Data: ___/___/______

Licenciado(a): [Nome do cliente]
Data: ___/___/______

Pode ser assinado digitalmente via Clicksign ou confirmação por e-mail.`;

const DOCS: Record<
  DocKey,
  { titulo: string; subtitulo: string; icon: typeof FileText; conteudo: string; filename: string }
> = {
  termos: {
    titulo: "Termos de Uso",
    subtitulo: "Regras gerais de utilização do Irys OS",
    icon: FileText,
    conteudo: TERMOS,
    filename: "irys-os-termos-de-uso.md",
  },
  privacidade: {
    titulo: "Política de Privacidade",
    subtitulo: "Tratamento de dados conforme LGPD (Lei 13.709/2018)",
    icon: Shield,
    conteudo: PRIVACIDADE,
    filename: "irys-os-politica-privacidade.md",
  },
  cookies: {
    titulo: "Política de Cookies",
    subtitulo: "Cookies essenciais, analíticos e de terceiros",
    icon: Cookie,
    conteudo: COOKIES_DOC,
    filename: "irys-os-politica-cookies.md",
  },
  contrato: {
    titulo: "Contrato de Licença de Uso",
    subtitulo: "Modelo para licenciamento aos clientes",
    icon: FileSignature,
    conteudo: CONTRATO,
    filename: "irys-os-contrato-licenca.md",
  },
};

function JuridicoPage() {
  const [ativo, setAtivo] = useState<DocKey>("termos");
  const [copiado, setCopiado] = useState(false);
  const doc = DOCS[ativo];
  const Icon = doc.icon;

  const html = useMemo(() => renderMarkdown(doc.conteudo), [doc.conteudo]);

  const baixar = () => {
    const blob = new Blob([doc.conteudo], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = doc.filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copiar = async () => {
    await navigator.clipboard.writeText(doc.conteudo);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const imprimir = () => window.print();

  return (
    <div className="min-h-screen bg-[#EDEAE5]">
      <header className="bg-[#2C1505] text-white px-6 py-4 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/visao-geral"
            className="text-[#C9A46E] hover:text-white flex items-center gap-1 text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Link>
          <span className="text-[#7A6050]">|</span>
          <div>
            <h1 className="text-lg font-bold">Jurídico</h1>
            <p className="text-xs text-[#C9A46E]">
              {EMPRESA.marca} · CNPJ {EMPRESA.cnpj}
            </p>
          </div>
        </div>
        <Badge className="bg-[#C9A46E] text-[#2C1505]">v{EMPRESA.versao}</Badge>
      </header>

      <div className="max-w-6xl mx-auto p-6 grid gap-6 md:grid-cols-[260px_1fr]">
        <aside className="print:hidden">
          <Card className="p-2 bg-white border-[#E8D8C0]">
            {(Object.keys(DOCS) as DocKey[]).map((k) => {
              const D = DOCS[k];
              const I = D.icon;
              const on = k === ativo;
              return (
                <button
                  key={k}
                  onClick={() => setAtivo(k)}
                  className={`w-full flex items-start gap-3 px-3 py-3 rounded text-left transition ${
                    on
                      ? "bg-[#F5EEE5] border-l-4 border-[#C9A46E]"
                      : "hover:bg-[#F5EEE5] border-l-4 border-transparent"
                  }`}
                >
                  <I
                    className={`w-4 h-4 mt-0.5 shrink-0 ${on ? "text-[#7A4A18]" : "text-[#BBA898]"}`}
                  />
                  <div className="min-w-0">
                    <p
                      className={`text-sm font-medium ${on ? "text-[#2C1505]" : "text-[#7A6050]"}`}
                    >
                      {D.titulo}
                    </p>
                    <p className="text-[11px] text-[#BBA898] leading-snug">{D.subtitulo}</p>
                  </div>
                </button>
              );
            })}
          </Card>

          <Card className="p-4 mt-4 bg-white border-[#E8D8C0]">
            <h3 className="text-xs font-bold text-[#7A4A18] uppercase tracking-wide mb-2">
              Dados da empresa
            </h3>
            <dl className="text-xs space-y-1 text-[#2C1505]">
              <div>
                <dt className="text-[#BBA898]">Razão social</dt>
                <dd>{EMPRESA.razao}</dd>
              </div>
              <div>
                <dt className="text-[#BBA898]">CNPJ</dt>
                <dd>{EMPRESA.cnpj}</dd>
              </div>
              <div>
                <dt className="text-[#BBA898]">E-mail</dt>
                <dd>{EMPRESA.email}</dd>
              </div>
              <div>
                <dt className="text-[#BBA898]">Sede</dt>
                <dd>
                  {EMPRESA.cidade}/{EMPRESA.uf} — {EMPRESA.pais}
                </dd>
              </div>
              <div>
                <dt className="text-[#BBA898]">Versão vigente</dt>
                <dd>
                  v{EMPRESA.versao} — {EMPRESA.atualizado}
                </dd>
              </div>
            </dl>
          </Card>
        </aside>

        <main>
          <Card className="p-8 bg-white border-[#E8D8C0]">
            <div className="flex items-start justify-between gap-4 pb-6 border-b border-[#F0E5D5] print:border-none">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded bg-[#F5EEE5] flex items-center justify-center">
                  <Icon className="w-5 h-5 text-[#7A4A18]" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-[#2C1505]">{doc.titulo}</h2>
                  <p className="text-sm text-[#7A6050]">{doc.subtitulo}</p>
                </div>
              </div>
              <div className="flex gap-2 print:hidden">
                <Button
                  onClick={copiar}
                  variant="outline"
                  size="sm"
                  className="border-[#C9A46E] text-[#7A4A18] hover:bg-[#F5EEE5]"
                >
                  {copiado ? (
                    <Check className="w-4 h-4 mr-1" />
                  ) : (
                    <Copy className="w-4 h-4 mr-1" />
                  )}
                  {copiado ? "Copiado" : "Copiar"}
                </Button>
                <Button
                  onClick={baixar}
                  variant="outline"
                  size="sm"
                  className="border-[#C9A46E] text-[#7A4A18] hover:bg-[#F5EEE5]"
                >
                  <Download className="w-4 h-4 mr-1" />
                  .md
                </Button>
                <Button
                  onClick={imprimir}
                  size="sm"
                  className="bg-[#2C1505] hover:bg-[#7A4A18] text-white"
                >
                  Imprimir / PDF
                </Button>
              </div>
            </div>

            <article
              className="doc-prose mt-6 text-[#2C1505] leading-relaxed"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </Card>
        </main>
      </div>

      <style>{`
        .doc-prose h1 { font-size: 1.5rem; font-weight: 800; color: #2C1505; margin: 1.5rem 0 0.75rem; }
        .doc-prose h2 { font-size: 1.15rem; font-weight: 700; color: #7A4A18; margin: 1.5rem 0 0.5rem; padding-bottom: 0.25rem; border-bottom: 1px solid #F0E5D5; }
        .doc-prose h3 { font-size: 0.95rem; font-weight: 700; color: #2C1505; margin: 1rem 0 0.35rem; }
        .doc-prose p { margin: 0.5rem 0; font-size: 0.9rem; }
        .doc-prose ul { list-style: disc; padding-left: 1.25rem; margin: 0.5rem 0; }
        .doc-prose li { font-size: 0.9rem; margin: 0.2rem 0; }
        .doc-prose table { width: 100%; border-collapse: collapse; margin: 1rem 0; font-size: 0.85rem; }
        .doc-prose th, .doc-prose td { border: 1px solid #E8D8C0; padding: 0.5rem 0.75rem; text-align: left; }
        .doc-prose th { background: #F5EEE5; color: #2C1505; font-weight: 700; }
        .doc-prose hr { border: none; border-top: 1px solid #E8D8C0; margin: 1.5rem 0; }
        @media print {
          body { background: white; }
          .doc-prose { font-size: 11pt; }
        }
      `}</style>
    </div>
  );
}

// Minimal markdown renderer for headings, paragraphs, lists, tables, hr
function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderMarkdown(md: string): string {
  const lines = md.split("\n");
  const out: string[] = [];
  let i = 0;
  let inList = false;
  const closeList = () => {
    if (inList) {
      out.push("</ul>");
      inList = false;
    }
  };

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Table detection: header row | --- row | body rows
    if (
      trimmed.startsWith("|") &&
      i + 1 < lines.length &&
      /^\|[\s\-|:]+\|$/.test(lines[i + 1].trim())
    ) {
      closeList();
      const header = trimmed
        .slice(1, -1)
        .split("|")
        .map((c) => c.trim());
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) {
        rows.push(
          lines[i]
            .trim()
            .slice(1, -1)
            .split("|")
            .map((c) => c.trim()),
        );
        i++;
      }
      out.push("<table><thead><tr>");
      for (const h of header) out.push(`<th>${escapeHtml(h)}</th>`);
      out.push("</tr></thead><tbody>");
      for (const r of rows) {
        out.push("<tr>");
        for (const c of r) out.push(`<td>${escapeHtml(c)}</td>`);
        out.push("</tr>");
      }
      out.push("</tbody></table>");
      continue;
    }

    if (trimmed === "---") {
      closeList();
      out.push("<hr/>");
      i++;
      continue;
    }
    if (trimmed.startsWith("### ")) {
      closeList();
      out.push(`<h3>${escapeHtml(trimmed.slice(4))}</h3>`);
      i++;
      continue;
    }
    if (trimmed.startsWith("## ")) {
      closeList();
      out.push(`<h2>${escapeHtml(trimmed.slice(3))}</h2>`);
      i++;
      continue;
    }
    if (trimmed.startsWith("# ")) {
      closeList();
      out.push(`<h1>${escapeHtml(trimmed.slice(2))}</h1>`);
      i++;
      continue;
    }
    if (trimmed.startsWith("- ")) {
      if (!inList) {
        out.push("<ul>");
        inList = true;
      }
      out.push(`<li>${escapeHtml(trimmed.slice(2))}</li>`);
      i++;
      continue;
    }
    if (trimmed === "") {
      closeList();
      i++;
      continue;
    }
    closeList();
    out.push(`<p>${escapeHtml(trimmed)}</p>`);
    i++;
  }
  closeList();
  return out.join("\n");
}
