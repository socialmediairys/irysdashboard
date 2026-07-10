import { useMemo, useState, useRef, useEffect, type ReactNode, type CSSProperties } from "react";
import {
  LayoutDashboard, Calendar, Users, TrendingUp, CreditCard, Instagram,
  Bookmark, Wrench, Plus, Zap, ArrowRight, Library, FileText, Settings, Menu,
  UserSquare2, Play, Pause, ChevronDown, ChevronRight, ArrowLeft, FolderOpen, Video, CheckCircle2, Circle,
  RefreshCw, LinkIcon, LogOut, ExternalLink, Copy, MessageCircle, Loader2, AlertCircle, Send,
} from "lucide-react";

import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import {
  startGoogleCalendarAuth,
  getGoogleCalendarStatus,
  disconnectGoogleCalendar,
  listGoogleCalendarEvents,
} from "@/lib/google-calendar.functions";
import { getInstagramAccountInsights } from "@/lib/meta-business.functions";
import {
  sendWhatsappCobrancaTemplate,
  sendWhatsappCobrancaLote,
  getWhatsappStatus,
  listWhatsappTemplates,
} from "@/lib/whatsapp.functions";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";

import { CrudProvider, useCrud } from "@/components/crud/CrudProvider";
import { RowActions } from "@/components/crud/RowActions";
import { useSupabaseList } from "@/hooks/useSupabaseList";
import { toast } from "sonner";
import { ListState } from "@/components/ListState";
import { ProfileTab } from "@/components/ProfileTab";
import { IntegrationsTab } from "@/components/IntegrationsTab";
import { AccountTab } from "@/components/AccountTab";




/* ---------- DB ---------- */
const DB = {
  user: { name: "Thamirys", role: "Social Media Manager" },
  clientes: [
    { id:1, init:"FL", name:"FL Contabilidade", pkg:"Social Media Básico", val:1500, status:"ativo",    posts:10, feitos:8 },
    { id:2, init:"IS", name:"Irys Social Media", pkg:"Social Media Básico", val:1500, status:"ativo",    posts:8,  feitos:6 },
    { id:3, init:"YE", name:"You Escova Inteligente", pkg:"Material Impresso", val:150, status:"atencao", posts:5, feitos:3 },
    { id:4, init:"UA", name:"Unaessential", pkg:"Parceria SM 1", val:10,  status:"ativo", posts:4, feitos:1 },
    { id:5, init:"BA", name:"Beatriz Abel", pkg:"Parceria SM 2", val:300, status:"ativo", posts:6, feitos:4 },
    { id:6, init:"GL", name:"Gabriela Loch", pkg:"SM Intermediário", val:1700, status:"proposta", posts:12, feitos:0 },
  ],
  leads: [
    { name:"Clínica Santa Helena", val:5000, status:"negociando", origem:"Instagram", potencial:"Altíssimo" },
    { name:"Clínica Renova",       val:9000, status:"proposta",   origem:"Indicação", potencial:"Altíssimo" },
    { name:"Instituto F. Hurtado", val:2500, status:"frio",       origem:"Google",    potencial:"Alto"      },
    { name:"Gabriela Loch",        val:1700, status:"quente",     origem:"Instagram", potencial:"Alto"      },
    { name:"Karina Felix",         val:1700, status:"quente",     origem:"Indicação", potencial:"Médio"     },
  ],
  entradas: [
    { name:"FL Contabilidade", cat:"Social Media Básico", val:1500 },
    { name:"Irys Social Media", cat:"Social Media Básico", val:1500 },
    { name:"Beatriz Abel", cat:"Parceria SM", val:300 },
    { name:"You Escova Inteligente", cat:"Material Impresso", val:150 },
    { name:"Unaessential", cat:"Parceria SM", val:10 },
    { name:"Projeto avulso", cat:"Design Identidade", val:3000 },
  ],
  saidas: [
    { name:"mLabs", cat:"Agendamento posts", val:120 },
    { name:"Canva Pro", cat:"Design", val:55 },
    { name:"Notion", cat:"Workspace", val:50 },
    { name:"Adobe Express", cat:"Criação", val:80 },
    { name:"Tráfego pago", cat:"Ads clientes", val:895 },
  ],
  redesSociais: [
    { plat:"Instagram", handle:"@thamirys", followers:"1.141",  reach:"846", eng:"4,2%", pct:78, dark:true  },
    { plat:"TikTok",    handle:"@thamirys", followers:"28.000", reach:"12k", eng:"6,1%", pct:61, dark:false },
    { plat:"YouTube",   handle:"@thamirys", followers:"3.200",  reach:"4k",  eng:"2,8%", pct:45, dark:false },
    { plat:"Facebook",  handle:"@thamirys", followers:"8.500",  reach:"2k",  eng:"1,4%", pct:28, dark:false },
  ],
  agenda: [
    { time:"10h", dur:"1h",    name:"Planejamento semanal",         sub:"Revisão de metas",            cor:"green",  data:"Hoje" },
    { time:"15h", dur:"1h30",  name:"Reunião — Beatriz Abel",       sub:"Estratégia de conteúdo",      cor:"amber",  data:"Hoje" },
    { time:"18h", dur:"30min", name:"Entrega stories Irys SM",      sub:"Prazo do cliente · urgente",  cor:"red",    data:"Hoje" },
    { time:"12h", dur:"1h",    name:"Entrega editorial FL Cont.",   sub:"Entrega mensal",              cor:"amber",  data:"Sex"  },
    { time:"23h", dur:"—",     name:"Prazo captação Irys SM",       sub:"Deadline",                    cor:"red",    data:"Qui"  },
    { time:"10h", dur:"1h",    name:"Call onboarding Unaessential", sub:"Primeiro encontro",           cor:"blue",   data:"Seg"  },
    { time:"14h", dur:"1h",    name:"Revisão proposta Karina Felix", sub:"Negociação",                 cor:"purple", data:"Ter"  },
  ],
  ideias: [
    { tag:"Instagram · Reels",    title:"Ideia de reels para instagram",  sub:"Social Media · em produção", dark:true  },
    { tag:"Insights · Método",    title:"Método SMAM — Insights de aula", sub:"Conteúdo educativo",         dark:false },
    { tag:"Depoimento · Cliente", title:"Vídeo Depoimento de Cliente",    sub:"Prova social",               dark:false },
    { tag:"Educacional",          title:"Como o marketing atrai pacientes", sub:"Nicho saúde · clínicas",   dark:true  },
    { tag:"Análise · Cases",      title:"Análise de Casos Reais",         sub:"Cases de sucesso",           dark:false },
    { tag:"Funil · Campanha",     title:"Toques finais em uma campanha",  sub:"Para Dr. Paulo",             dark:false },
  ],
  prompts: [
    { label:"Framework · Copy", title:"A.I.D.A",         preview:"Atenção, Interesse, Desejo, Ação — framework universal para comunicação persuasiva de alta conversão.", dark:true  },
    { label:"Framework · Copy", title:"P.A.S",           preview:"Problema, Agitação, Solução — ideal para posts que convertem diretamente e geram identificação.",       dark:false },
    { label:"Framework · Copy", title:"4 P's",           preview:"Promessa, Prova, Proposta, Push — para legendas de vendas e CTAs de alta performance.",                 dark:false },
    { label:"Framework · Copy", title:"Storytelling",    preview:"Herói, Conflito, Transformação — narrativa que conecta emocionalmente e gera autoridade.",              dark:true  },
    { label:"IA · Legenda",     title:"Prompt Legenda",  preview:"Gere legendas persuasivas para [rede] sobre [tema] com tom [marca], CTA e hashtags.",                   dark:false },
    { label:"IA · Reels",       title:"Prompt Reels",    preview:"Roteiro de Reels de 30s sobre [tema] para [nicho], com gancho nos primeiros 3 segundos.",               dark:true  },
    { label:"IA · Headline",    title:"Prompt Headline", preview:"10 headlines magnéticas para [tema] com gatilhos de curiosidade, urgência e transformação.",            dark:false },
    { label:"IA · Conteúdo",    title:"Prompt Conteúdo", preview:"Calendário de 30 dias para [nicho] com mix educativo, prova social e venda.",                           dark:false },
  ],
  ferramentas: [
    { ico:"📅", name:"mLabs",           cat:"Agendamento de posts · R$120/mês",  integ:true  },
    { ico:"🎨", name:"Canva Pro",       cat:"Design e templates · R$55/mês",     integ:false },
    { ico:"🤖", name:"Claude AI",       cat:"Copy + estratégia com IA · grátis", integ:false },
    { ico:"🎬", name:"CapCut",          cat:"Edição de vídeos e Reels · grátis", integ:false },
    { ico:"🌊", name:"Envato Elements", cat:"Banco de mídia premium",            integ:false },
    { ico:"📸", name:"Freepik",         cat:"Recursos gráficos gratuitos",       integ:false },
    { ico:"🌅", name:"Unsplash",        cat:"Fotos gratuitas de alta qualidade", integ:false },
  ],
  integracoes: [
    { ico:"📅", name:"Google Calendar",        desc:"Agenda sincronizada em tempo real", live:true },
    { ico:"📸", name:"Instagram Business API", desc:"Métricas e publicação via API",     live:true },
    { ico:"🔵", name:"Meta Business Suite",    desc:"Facebook Ads + Instagram Ads",      live:true },
  ],
  /* Dados compartilhados do Portal do Cliente (Notion-like) */
  portalCliente: {
    videoBoasVindas: "Video Central.mp4",
    driveLink: "https://drive.google.com/",
    insightsLink: "https://drive.google.com/",
    metasProgresso: { entregues: 8, total: 10 },
    audios: [
      { id:1, title:"Boas-Vindas & Nossa Dinâmica", desc:"Como vai funcionar o dia a dia da nossa comunicação.", duration:"04:12" },
      { id:2, title:"Ajustando expectativas: o tempo do orgânico", desc:"Apostar em posicionamento não traz milagre em 3 dias; áudio essencial para acalmar a ansiedade.", duration:"05:30" },
      { id:3, title:"Ninguém cria conteúdo sozinho", desc:"A importância de a especialista enviar os bastidores e aparecer nos Stories.", duration:"03:45" },
      { id:4, title:"A Importância da linha editorial e nicho", desc:"Por que não devemos falar de todos os procedimentos ao mesmo tempo.", duration:"06:10" },
      { id:5, title:"A conexão humana nos stories", desc:"Instruções rápidas de como usar os Stories para reter os pacientes.", duration:"04:55" },
      { id:6, title:"Construção de roteiros rápidos", desc:"Dicas para quando gravar os Reels que foram roteirizados.", duration:"03:20" },
      { id:7, title:"Organização e envio de materiais", desc:"Como usar os blocos de depósito para não atrasar o cronograma.", duration:"02:50" },
      { id:8, title:"O que analisar em um relatório mensal", desc:"Para entender que curtida não é a métrica principal de faturamento.", duration:"05:15" },
    ],
    etapasTimeline: [
      { fase:1, nome:"Onboarding & Alinhamento Base", desc:"Assinatura do contrato, liberação de acessos no cofre e alinhamento inicial.", subitens:["Contrato","Cofre","Briefing","Onboarding"], ativa:true },
      { fase:2, nome:"Diagnóstico de Perfil & Análise de Concorrentes", desc:"Investigação profunda do seu mercado de estética, auditoria de Instagram e mapeamento.", subitens:["Diagnóstico de Perfil","Análise de Concorrentes"], ativa:false },
      { fase:3, nome:"Universo Visual & Identidade Verbal", desc:"Definição da estética da sua marca pessoal (cores, tipografias, fotos premium) e tom de voz.", subitens:["Estética","Tom de Voz","Drive"], ativa:false },
      { fase:4, nome:"Estratégia de Conteúdo & Funil de Vendas", desc:"Criação do seu primeiro cronograma oficial de postagens estruturado para gerar desejo.", subitens:["Cronograma 1","Funil de Vendas"], ativa:false },
      { fase:5, nome:"Produção, Gravações & Aprovação", desc:"Envio de roteiros rápidos, edição impecável por nossa conta e validação final.", subitens:["Roteiros","Edição","Vídeos"], ativa:false },
      { fase:6, nome:"Análise de Métricas & Próximo Ciclo", desc:"Nossa reunião mensal de fechamento. Analisamos o crescimento e desenhamos o próximo mês.", subitens:["Reunião 1","Apresentação"], ativa:false },
    ],
    bloqueadores: [
      { n:1, t:"Panfletagem digital", sub:"Excesso de posts de venda direta", por:"O algoritmo penaliza perfis que só vendem. Sem entregar valor, o feed perde alcance e o público se desconecta — vira ruído comercial." },
      { n:2, t:"Uso de linguagem muito técnica", sub:"Explicar termos clínicos sem traduzir para benefícios reais", por:"A paciente não compra procedimento, compra transformação. Termos técnicos afastam quem ainda não entende o que precisa." },
      { n:3, t:"Perfil 'fantasma'", sub:"Falta de humanização e bastidores reais nos stories", por:"Sem rosto, sem voz e sem rotina, o perfil vira catálogo. A conexão humana é o que gera desejo e confiança para agendar." },
      { n:4, t:"Falta de consistência e ritmo", sub:"Postagens instáveis e quebra de algoritmo", por:"O algoritmo recompensa frequência. Sumir por semanas zera o aquecimento da conta e força recomeçar do zero." },
      { n:5, t:"Atração de público errado", sub:"Trends sem nexo ou puramente por curtidas vazias", por:"Viralizar com público que nunca vai te contratar infla vaidade, mas não gera agenda. Métrica que importa é qualificação." },
      { n:6, t:"Link da bio quebrado ou complexo", sub:"Falta de canal direto facilitado para WhatsApp", por:"Cada clique a mais é uma paciente perdida. Link direto, sem intermediários, é o que converte interesse em agendamento." },
    ],
  },
};


/* ---------- tokens ---------- */
export const C = {
  dark: "#2C1505", mid: "#7A4A18", gold: "#C9A46E",
  beige: "#E8D8C0", beigeLight: "#F5EEE5", bg: "#EDEAE5",
  text: "#1A0A02", textMid: "#7A6050", textMuted: "#BBA898",
};
const SHADOW = "0 2px 16px rgba(44,21,5,0.09)";
const SHADOW_HOVER = "0 6px 28px rgba(44,21,5,0.16)";

export const brl = (n: number) => "R$ " + n.toLocaleString("pt-BR");

/* ---------- shared atoms ---------- */
function Eyebrow({ children }: { children: ReactNode }) {
  return <div className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: C.textMid }}>{children}</div>;
}
function H1({ children }: { children: ReactNode }) {
  return <h1 className="text-4xl font-extrabold leading-tight mt-2" style={{ color: C.text, letterSpacing: "-0.03em" }}>{children}</h1>;
}
export function Card({ children, dark = false, className = "", style }: { children: ReactNode; dark?: boolean; className?: string; style?: CSSProperties }) {
  return (
    <div
      className={`rounded-[18px] p-6 transition-all duration-150 ${className}`}
      style={{
        background: dark ? `linear-gradient(135deg, ${C.dark}, #4A2510)` : "#fff",
        color: dark ? "#fff" : C.text,
        boxShadow: SHADOW,
        ...style,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = SHADOW_HOVER)}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = SHADOW)}
    >
      {children}
    </div>
  );
}
export function PillBtn({ children, variant = "dark", onClick }: { children: ReactNode; variant?: "dark" | "ghost" | "gold"; onClick?: () => void }) {
  const styles: Record<string, CSSProperties> = {
    dark:  { background: C.dark, color: "#fff" },
    ghost: { background: "transparent", color: C.text, border: `1px solid ${C.beige}` },
    gold:  { background: C.gold, color: C.dark },
  };
  return (
    <button onClick={onClick} className="rounded-[30px] px-5 py-2.5 text-sm font-semibold transition-all hover:-translate-y-0.5"
      style={{ ...styles[variant], boxShadow: SHADOW }}>
      {children}
    </button>
  );
}
function LiveBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-[30px] px-3 py-1.5 text-xs font-semibold"
      style={{ background: "#E8F5E9", color: "#1B5E20" }}>
      <span className="h-2 w-2 rounded-full bg-green-600 animate-pulse" />
      {label}
    </span>
  );
}
function SectionLabel({ children }: { children: ReactNode }) {
  return <div className="mb-3 text-xs font-bold uppercase tracking-[0.18em]" style={{ color: C.textMid }}>{children}</div>;
}

export const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
  quente:     { bg: "#FFE5D9", fg: "#A8431E" },
  frio:       { bg: "#DDE9F2", fg: "#1E4F7A" },
  negociando: { bg: "#FFF3CD", fg: "#8A6914" },
  proposta:   { bg: "#E8DAF5", fg: "#5C2D91" },
  ativo:      { bg: "#D4EDDA", fg: "#1B5E20" },
  atencao:    { bg: "#FFE0B2", fg: "#A8431E" },
  pendente:   { bg: C.beige, fg: C.dark },
  done:       { bg: "#D4EDDA", fg: "#1B5E20" },
  buy:        { bg: "#FFE0B2", fg: "#A8431E" },
  pend:       { bg: C.beige, fg: C.dark },
};
export function TagBadge({ label, variant }: { label: string; variant: string }) {
  const c = STATUS_COLORS[variant] ?? STATUS_COLORS.pendente;
  return <span className="rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider" style={{ background: c.bg, color: c.fg }}>{label}</span>;
}

const DOT_COLORS: Record<string, string> = {
  green: "#2E7D32", amber: "#E8A11C", red: "#C8351A",
  blue: "#1E5FA8", purple: "#7B3FB3", gold: C.gold,
};
function Dot({ color = "gold" }: { color?: string }) {
  return <span className="h-2.5 w-2.5 rounded-full inline-block" style={{ background: DOT_COLORS[color] ?? C.gold }} />;
}

function ProgressBar({ value, max, colorByPercent = false }: { value: number; max: number; colorByPercent?: boolean }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  let color = C.dark;
  if (colorByPercent) color = pct < 40 ? "#C8351A" : pct < 70 ? "#E8A11C" : C.dark;
  return (
    <div className="h-2 w-full rounded-full overflow-hidden" style={{ background: C.beigeLight }}>
      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}
function GoldProgress({ pct }: { pct: number }) {
  return (
    <div className="h-2 w-full rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.15)" }}>
      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${C.mid}, ${C.gold})` }} />
    </div>
  );
}

/* ---------- MetricCard ---------- */
function MetricCard({ variant = "default", value, label, delta, deltaType = "up" }: {
  variant?: "default" | "hero" | "accent"; value: ReactNode; label: string; delta?: string; deltaType?: "up" | "down" | "neutral";
}) {
  const dark = variant === "hero";
  const accent = variant === "accent";
  const bg = dark
    ? `linear-gradient(135deg, ${C.dark}, #4A2510)`
    : accent
    ? `linear-gradient(135deg, ${C.gold}, ${C.beige})`
    : "#fff";
  const fg = dark ? "#fff" : C.text;
  const labelColor = dark ? "rgba(255,255,255,0.7)" : accent ? C.dark : C.textMid;
  const deltaColor = deltaType === "down" ? "#C8351A" : deltaType === "up" ? "#2E7D32" : labelColor;
  return (
    <div className="rounded-[18px] p-4 sm:p-6 transition-all duration-150 hover:-translate-y-0.5 min-w-0"
      style={{ background: bg, color: fg, boxShadow: SHADOW }}>
      <div className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.14em] sm:tracking-[0.18em] break-words" style={{ color: labelColor }}>{label}</div>
      <div className="mt-2 sm:mt-3 text-2xl sm:text-4xl font-extrabold break-words" style={{ letterSpacing: "-0.03em" }}>{value}</div>
      {delta && <div className="mt-2 text-xs font-semibold break-words" style={{ color: deltaColor }}>{delta}</div>}
    </div>
  );
}


/* ---------- Header ---------- */
function PageHeader({ eyebrow, title, accent, actions, badges }: {
  eyebrow: string; title: string; accent?: string; actions?: ReactNode; badges?: ReactNode;
}) {
  return (
    <div className="mb-6 md:mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4 md:gap-6">
      <div className="min-w-0">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="text-2xl md:text-4xl font-extrabold leading-tight mt-2" style={{ color: C.text, letterSpacing: "-0.03em" }}>
          {title}{" "}
          {accent && <em className="not-italic" style={{ color: C.textMuted, fontStyle: "italic", fontWeight: 500 }}>{accent}</em>}
        </h1>
        {badges && <div className="mt-3 md:mt-4 flex gap-2 flex-wrap">{badges}</div>}
      </div>
      {actions && <div className="flex items-center gap-2 md:gap-3 flex-wrap">{actions}</div>}
    </div>
  );
}


/* ---------- Sidebar ---------- */
type PageKey =
  | "dash" | "agenda" | "clientes" | "conteudo" | "social"
  | "crm" | "financas" | "biblioteca" | "config";

type NavItem = { key: PageKey; label: string; icon: typeof LayoutDashboard };
type NavGroup = { label: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  { label: "Operação", items: [
    { key: "dash",     label: "Dashboard",  icon: LayoutDashboard },
    { key: "agenda",   label: "Agenda",     icon: Calendar },
    { key: "clientes", label: "Clientes",   icon: Users },
  ]},
  { label: "Conteúdo", items: [
    { key: "conteudo", label: "Calendário & Entregas", icon: FileText },
    { key: "social",   label: "Métricas sociais", icon: Instagram },
  ]},
  { label: "Comercial", items: [
    { key: "crm", label: "Pipeline de vendas", icon: TrendingUp },
  ]},
  { label: "Financeiro", items: [
    { key: "financas", label: "Financeiro", icon: CreditCard },
  ]},
  { label: "Recursos", items: [
    { key: "biblioteca", label: "Biblioteca", icon: Library },
  ]},
];

function Sidebar({
  active, setActive, collapsed, setCollapsed, mobileOpen, setMobileOpen,
}: {
  active: PageKey;
  setActive: (p: PageKey) => void;
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
}) {
  const width = collapsed ? "md:w-16" : "md:w-60";
  const handleNav = (k: PageKey) => {
    setActive(k);
    setMobileOpen(false);
  };
  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}
      <aside
        className={`fixed left-0 top-0 z-40 flex h-screen w-60 ${width} flex-col justify-between py-3 transition-transform md:transition-[width,transform] duration-200 ${mobileOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
        style={{ background: C.dark }}
      >
        <div className="flex flex-col gap-1 overflow-y-auto px-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="mb-2 hidden md:flex h-10 items-center gap-2 rounded-lg px-2 text-white/80 hover:bg-white/5"
            title={collapsed ? "Expandir menu" : "Recolher menu"}
          >
            <Menu size={18} />
            {!collapsed && <span className="text-sm font-bold">Irys OS</span>}
          </button>

          {/* Mobile header inside drawer */}
          <div className="md:hidden mb-2 flex h-10 items-center justify-between px-2">
            <span className="text-sm font-bold text-white">Irys OS</span>
            <button
              onClick={() => setMobileOpen(false)}
              className="rounded-lg p-1.5 text-white/80 hover:bg-white/5"
              aria-label="Fechar menu"
            >
              <ArrowLeft size={18} />
            </button>
          </div>

          {NAV_GROUPS.map((g) => (
            <div key={g.label} className="mt-2">
              {(!collapsed || mobileOpen) && (
                <div className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.4)" }}>
                  {g.label}
                </div>
              )}
              {g.items.map((n) => {
                const Icon = n.icon;
                const isActive = active === n.key;
                return (
                  <button
                    key={n.key}
                    onClick={() => handleNav(n.key)}
                    title={collapsed ? n.label : undefined}
                    className={`group relative flex min-h-11 w-full items-center gap-3 rounded-lg px-2.5 text-left transition-colors md:${collapsed ? "justify-center" : ""}`}
                    style={{
                      background: isActive ? C.gold : "transparent",
                      color: isActive ? C.dark : "rgba(255,255,255,0.85)",
                    }}
                  >
                    <Icon size={18} strokeWidth={2} className="shrink-0" />
                    <span className={`text-sm font-semibold ${collapsed ? "md:hidden" : ""}`}>{n.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div className="px-2 pt-2 border-t border-white/10">
          <button
            onClick={() => handleNav("config")}
            title="Configurações"
            className={`flex min-h-11 w-full items-center gap-3 rounded-lg px-2.5 transition-colors md:${collapsed ? "justify-center" : ""}`}
            style={{
              background: active === "config" ? C.gold : "transparent",
              color: active === "config" ? C.dark : "rgba(255,255,255,0.85)",
            }}
          >
            <Settings size={18} className="shrink-0" />
            <span className={`text-sm font-semibold ${collapsed ? "md:hidden" : ""}`}>Configurações</span>
          </button>
          <div className={`mt-2 flex items-center gap-2 rounded-lg px-2 py-2 md:${collapsed ? "justify-center" : ""}`}>
            <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-extrabold shrink-0"
              style={{ background: `linear-gradient(135deg, ${C.mid}, ${C.gold})`, color: "#fff" }}>
              T
            </div>
            <div className={`text-xs text-white/70 min-w-0 ${collapsed ? "md:hidden" : ""}`}>
              <div className="font-bold text-white truncate">{DB.user.name}</div>
              <div className="text-[10px] truncate">{DB.user.role}</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}


/* ---------- helpers ---------- */
function StatusLabel(s: string) {
  return { ativo: "Ativo", atencao: "Atenção", proposta: "Proposta", quente: "Quente", frio: "Frio", negociando: "Negociando" }[s] ?? s;
}

/* ---------- PAGES ---------- */
type AgendaRow = {
  id: string;
  titulo: string;
  descricao: string | null;
  data_hora: string;
  duracao_min: number | null;
  prioridade: string | null;
  concluido: boolean;
};
type TarefaRow = {
  id: string;
  titulo: string;
  cliente_id: string | null;
  status: string;
  tipo: string;
  prazo: string | null;
};

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}
function fmtHour(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function DashboardPage({ go }: { go: (p: PageKey) => void }) {
  const { openCreate } = useCrud();
  const clientesQ = useSupabaseList<ClienteRow>("clientes", { order: { column: "nome" } });
  const leadsQ = useSupabaseList<LeadRow>("leads", { order: { column: "created_at", ascending: false } });
  const agendaQ = useSupabaseList<AgendaRow>("agenda_itens", { order: { column: "data_hora" } });
  const tarefasQ = useSupabaseList<TarefaRow>("tarefas", { order: { column: "created_at", ascending: false } });

  const listGCal = useServerFn(listGoogleCalendarEvents);
  const [gcalHoje, setGcalHoje] = useState<GCalEvent[]>([]);
  const [gcalLoading, setGcalLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    const load = async () => {
      setGcalLoading(true);
      try {
        const now = new Date();
        const start = new Date(now); start.setHours(0, 0, 0, 0);
        const end = new Date(now); end.setHours(23, 59, 59, 999);
        const res = await listGCal({ data: { timeMin: start.toISOString(), timeMax: end.toISOString() } });
        if (!cancel) setGcalHoje((res.events ?? []) as GCalEvent[]);
      } catch {
        if (!cancel) setGcalHoje([]);
      } finally {
        if (!cancel) setGcalLoading(false);
      }
    };
    void load();
    return () => { cancel = true; };
  }, [listGCal]);

  const clientes = clientesQ.rows;
  const leads = leadsQ.rows;
  const agenda = agendaQ.rows;
  const tarefas = tarefasQ.rows;

  const faturamento = useMemo(
    () => clientes.filter(c => c.status_contrato === "ativo").reduce((s, c) => s + (Number(c.valor_mensal) || 0), 0),
    [clientes],
  );
  const clientesAtivos = useMemo(() => clientes.filter(c => c.status_contrato === "ativo").length, [clientes]);
  const postsEntregues = useMemo(
    () => tarefas.filter(t => t.status === "Publicado" || t.status === "Aprovado").length,
    [tarefas],
  );
  const postsPrevistos = tarefas.length;

  type AgendaItem = { id: string; titulo: string; iso: string; prioridade: string | null; source: "local" | "gcal" };
  const hoje = useMemo<AgendaItem[]>(() => {
    const local: AgendaItem[] = agenda
      .filter(a => isToday(a.data_hora))
      .map(a => ({ id: `l-${a.id}`, titulo: a.titulo, iso: a.data_hora, prioridade: a.prioridade, source: "local" }));
    const gcal: AgendaItem[] = gcalHoje
      .filter(e => e.start)
      .map(e => ({ id: `g-${e.id}`, titulo: e.title, iso: e.start!, prioridade: null, source: "gcal" }));
    return [...local, ...gcal].sort((a, b) => a.iso.localeCompare(b.iso));
  }, [agenda, gcalHoje]);
  const leadsTop = leads.slice(0, 5);

  const entregasPorCliente = useMemo(() => {
    return clientes.map(c => {
      const list = tarefas.filter(t => t.cliente_id === c.id);
      const feitos = list.filter(t => t.status === "Publicado" || t.status === "Aprovado").length;
      return { id: c.id, name: c.nome, feitos, total: list.length };
    });
  }, [clientes, tarefas]);

  const anyLoading = clientesQ.loading || leadsQ.loading || agendaQ.loading || tarefasQ.loading;

  return (
    <>
      <PageHeader
        eyebrow="Painel 360°"
        title="Bem-vinda,"
        accent="Thamirys."
        badges={<LiveBadge label="Integrações ativas" />}
        actions={<>
          <PillBtn variant="ghost" onClick={() => go("agenda")}><Zap size={14} className="inline mr-1" /> Hoje</PillBtn>
          <PillBtn onClick={() => openCreate("tarefa")}><Plus size={14} className="inline mr-1" /> Nova tarefa</PillBtn>
        </>}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5 mb-6">
        <MetricCard variant="hero" value={anyLoading ? "—" : brl(faturamento)} label="Faturamento mensal" />
        <MetricCard value={anyLoading ? "—" : clientesAtivos} label="Clientes ativos" />
        <MetricCard variant="accent" value={anyLoading ? "—" : postsEntregues} label="Posts entregues" delta={postsPrevistos ? `de ${postsPrevistos} previstos` : "sem tarefas"} deltaType="neutral" />
        <MetricCard value={anyLoading ? "—" : leads.length} label="Leads pipeline" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-5 mb-6">
        <div className="lg:col-span-3">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-lg">CRM — Leads ativos</h3>
              <button onClick={() => go("crm")} className="text-xs font-bold uppercase tracking-wider" style={{ color: C.mid }}>ver CRM →</button>
            </div>
            <ListState
              loading={leadsQ.loading}
              error={leadsQ.error}
              rows={leadsTop}
              onRetry={leadsQ.refetch}
              skeletonVariant="row"
              skeletonCount={4}
              emptyTitle="Nenhum lead ativo"
              emptyDescription="Adicione seu primeiro lead para começar a acompanhar o pipeline."
              actionLabel="Novo lead"
              onAction={() => openCreate("lead")}
            >
              <div className="space-y-3">
                {leadsTop.map((l) => (
                  <div key={l.id} className="flex items-center justify-between rounded-[10px] p-3" style={{ background: C.beigeLight }}>
                    <div className="flex items-center gap-3 min-w-0">
                      <Dot color={l.etapa === "Negociando" ? "amber" : l.etapa === "Proposta Enviada" ? "purple" : "blue"} />
                      <div className="min-w-0">
                        <div className="font-semibold truncate">{l.nome}</div>
                        <div className="text-xs truncate" style={{ color: C.textMid }}>{(l.origem ?? "—")} · {(l.potencial ?? "—")}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <TagBadge label={l.etapa} variant="frio" />
                      <span className="font-extrabold" style={{ color: C.mid }}>{brl(Number(l.valor) || 0)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </ListState>
          </Card>
        </div>
        <div className="lg:col-span-2">
          <Card dark>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-lg">📅 Agenda — Hoje</h3>
              <button onClick={() => go("agenda")} className="text-xs font-bold uppercase tracking-wider" style={{ color: C.gold }}>agenda →</button>
            </div>
            {(agendaQ.loading || gcalLoading) && hoje.length === 0 ? (
              <div className="space-y-2">
                {[0,1,2].map(i => (
                  <div key={i} className="h-14 rounded-[10px] animate-pulse" style={{ background: "rgba(255,255,255,0.08)" }} />
                ))}
              </div>
            ) : agendaQ.error ? (
              <div className="text-sm opacity-80">Erro ao carregar agenda.</div>
            ) : hoje.length === 0 ? (
              <div className="text-sm opacity-70 py-4">Nenhum compromisso para hoje.</div>
            ) : (
              <div className="space-y-3">
                {hoje.map((e) => (
                  <div key={e.id} className="flex items-center justify-between rounded-[10px] p-3" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <div className="min-w-0">
                      <div className="font-semibold truncate">{e.titulo}</div>
                      <div className="text-xs opacity-70">
                        {fmtHour(e.iso)} · {e.source === "gcal" ? "Google Agenda" : "Painel"}
                      </div>
                    </div>
                    <span className="rounded-full px-2.5 py-1 text-[11px] font-bold uppercase"
                      style={{ background: e.prioridade === "alta" ? "#C8351A" : "rgba(255,255,255,0.15)", color: "#fff" }}>
                      {e.prioridade === "alta" ? "Urgente" : "Hoje"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-5">
        <div className="lg:col-span-3">
          <Card>
            <h3 className="font-extrabold text-lg mb-4">Entregas por cliente</h3>
            <ListState
              loading={clientesQ.loading || tarefasQ.loading}
              error={clientesQ.error || tarefasQ.error}
              rows={entregasPorCliente}
              onRetry={() => { clientesQ.refetch(); tarefasQ.refetch(); }}
              skeletonVariant="row"
              skeletonCount={4}
              emptyTitle="Sem clientes cadastrados"
              emptyDescription="Cadastre clientes para acompanhar as entregas do mês."
              actionLabel="Novo cliente"
              onAction={() => openCreate("cliente")}
            >
              <div className="space-y-4">
                {entregasPorCliente.map((c) => (
                  <div key={c.id}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="font-semibold truncate pr-2">{c.name}</span>
                      <span style={{ color: C.textMid }}>{c.feitos}/{c.total || 0}</span>
                    </div>
                    <ProgressBar value={c.feitos} max={Math.max(1, c.total)} colorByPercent />
                  </div>
                ))}
              </div>
            </ListState>
          </Card>
        </div>
        <div className="lg:col-span-2">
          <Card>
            <h3 className="font-extrabold text-lg mb-4">Acesso rápido</h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { e:"📅", n:"Agenda", s:"Hoje", k:"agenda" as PageKey },
                { e:"👥", n:"Clientes", s:`${clientesAtivos} ativos`, k:"clientes" as PageKey },
                { e:"📈", n:"CRM", s:`${leads.length} leads`, k:"crm" as PageKey },
                { e:"💳", n:"Finanças", s:"Junho", k:"financas" as PageKey },
                { e:"📝", n:"Conteúdo", s:"Calendário", k:"conteudo" as PageKey },
                { e:"📚", n:"Biblioteca", s:"Refs & prompts", k:"biblioteca" as PageKey },
              ].map((c) => (
                <button key={c.n} onClick={() => go(c.k)}
                  className="rounded-[10px] p-3 text-left transition-all hover:-translate-y-0.5 min-h-11"
                  style={{ background: C.beigeLight }}>
                  <div className="text-xl">{c.e}</div>
                  <div className="text-sm font-bold mt-1">{c.n}</div>
                  <div className="text-[11px]" style={{ color: C.textMid }}>{c.s}</div>
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

type GCalEvent = {
  id: string;
  title: string;
  start?: string;
  end?: string;
  allDay: boolean;
  htmlLink?: string;
  location?: string | null;
  description?: string | null;
};

function fmtTime(iso?: string, allDay?: boolean) {
  if (!iso) return "";
  if (allDay) return "Dia inteiro";
  try {
    return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  } catch { return ""; }
}
function fmtDay(iso?: string) {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" });
  } catch { return ""; }
}
function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function AgendaPage() {
  const startAuth = useServerFn(startGoogleCalendarAuth);
  const getStatus = useServerFn(getGoogleCalendarStatus);
  const disconnect = useServerFn(disconnectGoogleCalendar);
  const listEvents = useServerFn(listGoogleCalendarEvents);

  const [status, setStatus] = useState<{ connected: boolean; email: string | null } | null>(null);
  const [events, setEvents] = useState<GCalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const s = await getStatus();
      setStatus(s);
      if (s.connected) {
        const now = new Date();
        const end = new Date(now); end.setDate(end.getDate() + 14);
        const res = await listEvents({ data: { timeMin: now.toISOString(), timeMax: end.toISOString() } });
        setEvents(res.events as GCalEvent[]);
      } else {
        setEvents([]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar agenda");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void refresh(); }, []);

  const handleConnect = async () => {
    setConnecting(true);
    setError(null);
    try {
      const result = await startAuth({ data: { origin: window.location.origin } });
      if (!result.ok) {
        setError(result.error);
        setConnecting(false);
        return;
      }
      window.location.href = result.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao iniciar conexão");
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Desconectar o Google Calendar?")) return;
    await disconnect();
    await refresh();
  };

  const today = new Date();
  const hoje = events.filter((e) => e.start && isSameDay(new Date(e.start), today));
  const proximos = events.filter((e) => e.start && !isSameDay(new Date(e.start), today));

  return (
    <>
      <PageHeader
        eyebrow="Google Agenda"
        title="Planejamento"
        accent={status?.connected ? "conectado" : "não conectado"}
        badges={<LiveBadge label={status?.connected ? "Google Calendar" : "desconectado"} />}
        actions={
          status?.connected ? (
            <div className="flex gap-2">
              <PillBtn variant="ghost" onClick={refresh}><RefreshCw size={14} className="inline mr-1" /> Atualizar</PillBtn>
              <PillBtn variant="ghost" onClick={handleDisconnect}><LogOut size={14} className="inline mr-1" /> Desconectar</PillBtn>
            </div>
          ) : (
            <PillBtn onClick={handleConnect}>
              <LinkIcon size={14} className="inline mr-1" /> {connecting ? "Redirecionando..." : "Conectar Google Calendar"}
            </PillBtn>
          )
        }
      />

      {error && (
        <Card>
          <div className="text-sm" style={{ color: DOT_COLORS.red }}>{error}</div>
        </Card>
      )}

      {!status?.connected && !loading && !error && (
        <Card>
          <h3 className="font-extrabold text-lg mb-2">Conecte sua conta do Google</h3>
          <p className="text-sm mb-4" style={{ color: C.textMid }}>
            Autorize o acesso ao seu Google Calendar para ver e organizar seus compromissos aqui. Somente você vê seus eventos — os tokens ficam vinculados ao seu usuário.
          </p>
          <PillBtn onClick={handleConnect}>
            <LinkIcon size={14} className="inline mr-1" /> {connecting ? "Redirecionando..." : "Conectar Google Calendar"}
          </PillBtn>
        </Card>
      )}

      {loading && (
        <Card><div className="text-sm" style={{ color: C.textMid }}>Carregando agenda...</div></Card>
      )}

      {status?.connected && !loading && (
        <>
          {status.email && (
            <div className="mb-4 text-xs" style={{ color: C.textMid }}>Conta conectada: <b>{status.email}</b></div>
          )}
          <div className="grid grid-cols-2 gap-5 mb-6">
            <Card>
              <h3 className="font-extrabold text-lg mb-4">Hoje — {today.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" })}</h3>
              {hoje.length === 0 ? (
                <div className="text-sm" style={{ color: C.textMid }}>Nenhum evento hoje.</div>
              ) : (
                <div className="space-y-3">
                  {hoje.map((e) => (
                    <div key={e.id} className="flex gap-4 items-stretch">
                      <div className="min-w-[72px]">
                        <div className="font-extrabold">{fmtTime(e.start, e.allDay)}</div>
                        <div className="text-xs" style={{ color: C.textMid }}>{fmtTime(e.end, e.allDay)}</div>
                      </div>
                      <div className="w-[3px] rounded-full" style={{ background: DOT_COLORS.blue }} />
                      <div className="flex-1 min-w-0">
                        <div className="font-bold truncate">{e.title}</div>
                        {e.location && <div className="text-xs truncate" style={{ color: C.textMid }}>{e.location}</div>}
                      </div>
                      {e.htmlLink && (
                        <a href={e.htmlLink} target="_blank" rel="noreferrer" className="self-center text-xs">
                          <ExternalLink size={14} />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
            <Card dark>
              <h3 className="font-extrabold text-lg mb-4">Próximos 14 dias</h3>
              {proximos.length === 0 ? (
                <div className="text-sm opacity-70">Nada planejado.</div>
              ) : (
                <div className="space-y-3 max-h-[420px] overflow-auto">
                  {proximos.map((e) => (
                    <div key={e.id} className="flex items-center justify-between rounded-[10px] p-3" style={{ background: "rgba(255,255,255,0.06)" }}>
                      <div className="min-w-0">
                        <div className="font-semibold truncate">{e.title}</div>
                        <div className="text-xs opacity-70">{fmtDay(e.start)} · {fmtTime(e.start, e.allDay)}</div>
                      </div>
                      {e.htmlLink && (
                        <a href={e.htmlLink} target="_blank" rel="noreferrer" className="opacity-80 hover:opacity-100">
                          <ExternalLink size={14} />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </>
  );
}


export type ClienteRow = {
  id: string;
  nome: string;
  plano_label: string | null;
  plano_atual: string | null;
  valor_mensal: number | null;
  status_contrato: string;
  email: string | null;
  telefone: string | null;
  slug: string | null;
  init: string | null;
};

function waMeLink(telefone: string | null, nome: string, valor: number | null, statusLabel: string): string | null {
  if (!telefone) return null;
  const digits = telefone.replace(/\D+/g, "");
  if (!digits) return null;
  const withCountry = digits.length <= 11 ? `55${digits}` : digits;
  const valorTxt = valor
    ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(valor))
    : "a combinar";
  const msg = `Olá ${nome}! Passando aqui para lembrar da sua mensalidade (${valorTxt}). Status do contrato: ${statusLabel}. Qualquer dúvida estou à disposição 💛`;
  return `https://wa.me/${withCountry}?text=${encodeURIComponent(msg)}`;
}

export function CobrancaWaMeButton({ cliente }: { cliente: ClienteRow }) {
  const statusLabel = CLIENTE_STATUS_LABEL[cliente.status_contrato] ?? cliente.status_contrato;
  const link = waMeLink(cliente.telefone, cliente.nome, cliente.valor_mensal, statusLabel);
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-9 w-9 text-emerald-600 hover:text-emerald-700"
      aria-label="Abrir WhatsApp com cobrança pré-preenchida"
      onClick={(e) => {
        e.stopPropagation();
        if (!link) {
          toast.error(`${cliente.nome} não tem telefone cadastrado. Edite o cliente para incluir o número.`);
          return;
        }
        window.open(link, "_blank", "noopener,noreferrer");
      }}
    >
      <Send className="h-4 w-4" />
    </Button>
  );
}

export const CLIENTE_STATUS_VARIANT: Record<string, string> = {
  ativo: "ativo",
  pendente_assinatura: "atencao",
  vencido: "proposta",
  cancelado: "frio",
};
export const CLIENTE_STATUS_LABEL: Record<string, string> = {
  ativo: "Ativo",
  pendente_assinatura: "Atenção",
  vencido: "Vencido",
  cancelado: "Inativo",
};

function initialsOf(nome: string) {
  return nome
    .split(/\s+/).filter(Boolean).slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? "").join("") || "?";
}

type TemplateMeta = {
  name: string;
  language: string;
  status: string;
  category: string;
  variables: number;
  bodyPreview: string | null;
};

function useWhatsappTemplates(open: boolean, connected: boolean) {
  const list = useServerFn(listWhatsappTemplates);
  const [templates, setTemplates] = useState<TemplateMeta[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (!open || !connected) return;
    setLoading(true);
    setError(null);
    list()
      .then(t => setTemplates(t as TemplateMeta[]))
      .catch(e => setError(e instanceof Error ? e.message : "Falha ao listar templates"))
      .finally(() => setLoading(false));
  }, [open, connected, list]);
  return { templates, loading, error };
}

function TemplateSelect({
  templates, loading, error, value, onChange,
}: {
  templates: TemplateMeta[] | null;
  loading: boolean;
  error: string | null;
  value: string;
  onChange: (v: string) => void;
}) {
  const aprovados = (templates ?? []).filter(t => t.status === "APPROVED");
  const selected = aprovados.find(t => t.name === value);
  return (
    <div className="grid gap-2">
      <Label>Template aprovado (Meta)</Label>
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando templates da Meta...
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="break-words">{error}</AlertDescription>
        </Alert>
      ) : aprovados.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Nenhum template aprovado na sua conta Meta. Crie e aprove um template com 2 variáveis no corpo (nome e valor).
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <Select value={value} onValueChange={onChange}>
            <SelectTrigger><SelectValue placeholder="Selecione um template" /></SelectTrigger>
            <SelectContent>
              {aprovados.map(t => (
                <SelectItem key={`${t.name}:${t.language}`} value={t.name}>
                  {t.name} · {t.language} · {t.variables} var
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selected && (
            <div className="text-xs text-muted-foreground space-y-1">
              {selected.variables !== 2 && (
                <div className="text-amber-700">
                  ⚠ Este template tem {selected.variables} variáveis; o envio usa 2 (nome e valor).
                </div>
              )}
              {selected.bodyPreview && (
                <div className="rounded border bg-muted/40 p-2 whitespace-pre-wrap">
                  {selected.bodyPreview}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function CobrancaWhatsappButton({ clienteId, nome }: { clienteId: string; nome: string }) {
  const send = useServerFn(sendWhatsappCobrancaTemplate);
  const check = useServerFn(getWhatsappStatus);
  const [open, setOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [result, setResult] = useState<{ nome: string | null; valorFormatado: string; to: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "loading" | "connected" | "disconnected">("idle");
  const { templates, loading: tplLoading, error: tplError } = useWhatsappTemplates(open, connectionStatus === "connected");

  function reset() {
    setStatus("idle");
    setResult(null);
    setErrorMsg(null);
    setConnectionStatus("idle");
  }

  function handleOpenChange(next: boolean) {
    if (status === "loading") return;
    if (!next) reset();
    setOpen(next);
  }

  useEffect(() => {
    if (!open) return;
    setConnectionStatus("loading");
    check()
      .then(s => setConnectionStatus(s.connected ? "connected" : "disconnected"))
      .catch(() => setConnectionStatus("disconnected"));
  }, [open, check]);

  async function submit() {
    if (connectionStatus !== "connected" || !templateName) return;
    setStatus("loading");
    setErrorMsg(null);
    try {
      const tpl = (templates ?? []).find(t => t.name === templateName);
      const variables = tpl?.variables ?? 2;
      const languageCode = tpl?.language;
      const res = await send({ data: { clienteId, templateName, variables, languageCode } });

      setResult(res);
      setStatus("success");
      toast.success(`Cobrança enviada para ${res.nome ?? "cliente"} (${res.valorFormatado})`);
      setTimeout(() => {
        setOpen(false);
        setTimeout(reset, 200);
      }, 1800);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Falha ao enviar cobrança";
      setErrorMsg(msg);
      setStatus("error");
      toast.error(msg);
    }
  }

  const isBusy = status === "loading" || connectionStatus === "loading";

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-9 w-9 text-emerald-600 hover:text-emerald-700"
        aria-label="Enviar cobrança por WhatsApp"
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
      >
        <MessageCircle className="h-4 w-4" />
      </Button>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => { if (status === "loading") e.preventDefault(); }}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {status === "success" && <CheckCircle2 className="h-5 w-5 text-green-600" />}
              {status === "error" && <AlertCircle className="h-5 w-5 text-destructive" />}
              {status === "loading" && <Loader2 className="h-5 w-5 animate-spin" />}
              {status === "idle" && <MessageCircle className="h-5 w-5" />}
              Enviar cobrança por WhatsApp
            </DialogTitle>
            <DialogDescription>
              Cliente: <strong>{nome}</strong>. O valor pendente será calculado automaticamente
              a partir das entradas financeiras não pagas.
            </DialogDescription>
          </DialogHeader>

          {status === "success" && result && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
              <div className="flex items-center gap-2 font-semibold">
                <CheckCircle2 className="h-4 w-4" /> Cobrança enviada com sucesso
              </div>
              <div className="mt-1 pl-6">
                Enviada para <strong>{result.to}</strong> — valor de {result.valorFormatado}.
              </div>
            </div>
          )}

          {status === "error" && errorMsg && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erro ao enviar pela Meta</AlertTitle>
              <AlertDescription className="break-words">{errorMsg}</AlertDescription>
            </Alert>
          )}

          {status === "idle" && (connectionStatus === "idle" || connectionStatus === "loading") && (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Verificando conexão com WhatsApp...
            </div>
          )}

          {status === "idle" && connectionStatus === "disconnected" && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <div>
                  <div className="font-semibold">WhatsApp não conectado</div>
                  <div className="mt-1">
                    Para enviar cobranças, conecte o WhatsApp Business em{" "}
                    <strong>Configurações › Integrações</strong> primeiro.
                  </div>
                </div>
              </div>
            </div>
          )}

          {status === "idle" && connectionStatus === "connected" && (
            <TemplateSelect
              templates={templates}
              loading={tplLoading}
              error={tplError}
              value={templateName}
              onChange={setTemplateName}
            />
          )}

          <DialogFooter>
            {status === "error" ? (
              <>
                <Button variant="outline" onClick={() => setOpen(false)}>Fechar</Button>
                <Button onClick={submit} disabled={!templateName || connectionStatus !== "connected"}>
                  Tentar novamente
                </Button>
              </>
            ) : status === "success" ? (
              <Button variant="outline" onClick={() => setOpen(false)}>Fechar</Button>
            ) : connectionStatus === "disconnected" ? (
              <Button variant="outline" onClick={() => setOpen(false)}>Fechar</Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => setOpen(false)} disabled={isBusy}>Cancelar</Button>
                <Button onClick={submit} disabled={isBusy || !templateName}>
                  {status === "loading" && <Loader2 className="h-4 w-4 animate-spin" />}
                  Enviar
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function CobrancaLoteButton({ clientes }: { clientes: Array<{ id: string; nome: string }> }) {
  const send = useServerFn(sendWhatsappCobrancaLote);
  const check = useServerFn(getWhatsappStatus);
  const [open, setOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [summary, setSummary] = useState<{ total: number; enviados: number; falhas: number; results: Array<{ ok: boolean; nome: string | null; error?: string }> } | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "loading" | "connected" | "disconnected">("idle");
  const { templates, loading: tplLoading, error: tplError } = useWhatsappTemplates(open, connectionStatus === "connected");

  useEffect(() => {
    if (!open) return;
    setConnectionStatus("loading");
    check()
      .then(s => setConnectionStatus(s.connected ? "connected" : "disconnected"))
      .catch(() => setConnectionStatus("disconnected"));
  }, [open, check]);

  function toggle(id: string) {
    setSelected(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  }
  function toggleAll() {
    setSelected(prev => prev.size === clientes.length ? new Set() : new Set(clientes.map(c => c.id)));
  }
  function handleOpenChange(next: boolean) {
    if (status === "loading") return;
    if (!next) {
      setSelected(new Set());
      setStatus("idle");
      setSummary(null);
      setErrorMsg(null);
      setConnectionStatus("idle");
    }
    setOpen(next);
  }
  async function submit() {
    if (!templateName || selected.size === 0) return;
    setStatus("loading");
    setErrorMsg(null);
    try {
      const tpl = (templates ?? []).find(t => t.name === templateName);
      const variables = tpl?.variables ?? 2;
      const languageCode = tpl?.language;
      const res = await send({ data: { clienteIds: Array.from(selected), templateName, variables, languageCode } });

      setSummary(res);
      setStatus("done");
      if (res.falhas === 0) toast.success(`${res.enviados} cobranças enviadas`);
      else toast.warning(`${res.enviados} enviadas, ${res.falhas} falharam`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Falha no envio em lote";
      setErrorMsg(msg);
      setStatus("error");
      toast.error(msg);
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="gap-1.5">
        <MessageCircle className="h-4 w-4" /> Cobrança em lote
      </Button>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-lg" onPointerDownOutside={(e) => { if (status === "loading") e.preventDefault(); }}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {status === "loading" && <Loader2 className="h-5 w-5 animate-spin" />}
              <MessageCircle className="h-5 w-5" />
              Cobrança em lote (WhatsApp)
            </DialogTitle>
            <DialogDescription>
              Selecione os clientes e o template. Cada envio grava um registro no histórico com o status retornado pela Meta.
            </DialogDescription>
          </DialogHeader>

          {status === "idle" && connectionStatus === "loading" && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
              <Loader2 className="h-4 w-4 animate-spin" /> Verificando conexão...
            </div>
          )}

          {status === "idle" && connectionStatus === "disconnected" && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Conecte o WhatsApp em <strong>Configurações › Integrações</strong> antes de disparar cobranças.
              </AlertDescription>
            </Alert>
          )}

          {(status === "idle" || status === "error") && connectionStatus === "connected" && (
            <div className="space-y-3">
              <TemplateSelect
                templates={templates}
                loading={tplLoading}
                error={tplError}
                value={templateName}
                onChange={setTemplateName}
              />

              <div className="border rounded-lg">
                <div className="flex items-center justify-between px-3 py-2 border-b bg-muted/40">
                  <div className="text-sm font-medium">Clientes ({selected.size}/{clientes.length})</div>
                  <button type="button" className="text-xs underline" onClick={toggleAll}>
                    {selected.size === clientes.length ? "Desmarcar todos" : "Selecionar todos"}
                  </button>
                </div>
                <div className="max-h-56 overflow-auto p-2 space-y-1">
                  {clientes.map(c => (
                    <label key={c.id} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-muted cursor-pointer text-sm">
                      <Checkbox checked={selected.has(c.id)} onCheckedChange={() => toggle(c.id)} />
                      <span className="truncate">{c.nome}</span>
                    </label>
                  ))}
                </div>
              </div>

              {status === "error" && errorMsg && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="break-words">{errorMsg}</AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {status === "loading" && (
            <div className="flex flex-col items-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
              Enviando {selected.size} mensagens...
            </div>
          )}

          {status === "done" && summary && (
            <div className="space-y-3">
              <div className="rounded-lg border p-3 text-sm">
                <div><strong>{summary.enviados}</strong> enviadas · <strong>{summary.falhas}</strong> falharam · {summary.total} no total</div>
              </div>
              {summary.falhas > 0 && (
                <div className="border rounded-lg max-h-48 overflow-auto">
                  {summary.results.filter(r => !r.ok).map((r, i) => (
                    <div key={i} className="px-3 py-2 border-b last:border-0 text-xs">
                      <div className="font-medium">{r.nome ?? "(sem nome)"}</div>
                      <div className="text-destructive break-words">{r.error}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {status === "done" ? (
              <Button variant="outline" onClick={() => handleOpenChange(false)}>Fechar</Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={status === "loading"}>Cancelar</Button>
                <Button
                  onClick={submit}
                  disabled={status === "loading" || connectionStatus !== "connected" || !templateName || selected.size === 0}
                >
                  {status === "loading" && <Loader2 className="h-4 w-4 animate-spin" />}
                  Enviar {selected.size > 0 ? `(${selected.size})` : ""}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}



function ClientesPage() {
  const { openCreate, openEdit, openDelete } = useCrud();
  const { rows, loading, error, refetch } = useSupabaseList<ClienteRow>("clientes", { order: { column: "nome" } });
  const ativos = rows.filter(c => c.status_contrato === "ativo").length;
  const maxVal = Math.max(1, ...rows.map(c => Number(c.valor_mensal) || 0));
  return (
    <>
      <PageHeader eyebrow="Clientes" title={`${ativos} clientes`} accent="ativos"
        actions={
          <>
            <a
              href="/admin/cadastros"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border"
              style={{ borderColor: C.mid, color: C.mid }}
            >
              <Users size={14} /> Cadastros pendentes
            </a>
            <a
              href="/admin/portal-conteudos"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold border"
              style={{ borderColor: C.mid, color: C.mid }}
            >
              <FolderOpen size={14} /> Gerenciar portais (todos)
            </a>

            <CobrancaLoteButton clientes={rows.map(r => ({ id: r.id, nome: r.nome }))} />
            <PillBtn onClick={() => openCreate("cliente")}><Plus size={14} className="inline mr-1" /> Novo cliente</PillBtn>
          </>
        } />


      <ListState
        loading={loading}
        error={error}
        rows={rows}
        onRetry={refetch}
        skeletonCount={6}
        emptyTitle="Nenhum cliente ainda"
        emptyDescription="Cadastre seu primeiro cliente para começar a acompanhar contratos e receita."
        actionLabel="Novo cliente"
        onAction={() => openCreate("cliente")}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 mb-6">
          {rows.map((c) => (
            <Card key={c.id}>
              <div className="flex items-start justify-between gap-3">
                <Link
                  to="/admin/clientes/$clienteId"
                  params={{ clienteId: c.id }}
                  className="flex items-center gap-3 flex-1 min-w-0 group"
                  aria-label={`Abrir perfil de ${c.nome}`}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-[10px] font-extrabold text-base flex-shrink-0"
                    style={{ background: C.beige, color: C.dark }}>{c.init || initialsOf(c.nome)}</div>
                  <div className="min-w-0 flex-1">
                    <div className="font-extrabold truncate group-hover:underline">{c.nome}</div>
                    <div className="text-xs truncate" style={{ color: C.textMid }}>
                      {c.plano_label || c.plano_atual || "Serviço não definido"}
                    </div>
                  </div>
                </Link>
                <TagBadge
                  label={CLIENTE_STATUS_LABEL[c.status_contrato] ?? c.status_contrato}
                  variant={CLIENTE_STATUS_VARIANT[c.status_contrato] ?? "frio"}
                />
              </div>

              <div className="mt-4 flex items-end justify-between gap-3 flex-wrap">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: C.textMuted }}>
                    Valor mensal
                  </div>
                  <div className="text-lg font-extrabold" style={{ color: C.mid }}>
                    {brl(Number(c.valor_mensal) || 0)}<span className="text-xs font-semibold" style={{ color: C.textMuted }}>/mês</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <CobrancaWaMeButton cliente={c} />
                  <CobrancaWhatsappButton clienteId={c.id} nome={c.nome} />
                  <RowActions onEdit={() => openEdit("cliente", c)} onDelete={() => openDelete("cliente", c)} />
                </div>
              </div>

              <div className="mt-4 pt-3 flex items-center justify-between gap-2" style={{ borderTop: `1px solid ${C.beigeLight}` }}>
                <span className="text-[11px] font-semibold" style={{ color: C.textMuted }}>Portal do cliente</span>
                <Link
                  to="/admin/clientes/$clienteId"
                  params={{ clienteId: c.id }}
                  className="inline-flex items-center gap-1 text-xs font-bold hover:underline"
                  style={{ color: C.mid }}
                >
                  Ver detalhes <ArrowRight size={12} />
                </Link>
              </div>
            </Card>
          ))}
        </div>
        <Card>
          <h3 className="font-extrabold text-lg mb-4">Receita mensal por cliente (MRR)</h3>
          <div className="space-y-4">
            {rows.map((c) => (
              <div key={c.id}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-semibold truncate pr-2">{c.nome}</span>
                  <span className="font-extrabold shrink-0" style={{ color: C.mid }}>{brl(Number(c.valor_mensal) || 0)}</span>
                </div>
                <ProgressBar value={Number(c.valor_mensal) || 0} max={maxVal} />
              </div>
            ))}
          </div>
        </Card>
      </ListState>
    </>
  );
}



type LeadRow = {
  id: string;
  nome: string;
  valor: number | null;
  etapa: string;
  status: string;
  origem: string | null;
  potencial: string | null;
  email: string | null;
  telefone: string | null;
  proxima_acao: string | null;
  data_proxima_acao: string | null;
  observacoes: string | null;
};

const ETAPA_COLS = ["Lead/Entrada", "Reunião Marcada", "Proposta Enviada", "Negociando"];

function CRMPage() {
  const { openCreate, openEdit, openDelete } = useCrud();
  const leadsQ = useSupabaseList<LeadRow>("leads", { order: { column: "created_at", ascending: false } });
  const { rows: leads, loading, error, refetch } = leadsQ;
  const { rows: clientes } = useSupabaseList<ClienteRow>("clientes", { order: { column: "nome" } });

  const potencial = leads.reduce((s, l) => s + Number(l.valor || 0), 0);
  const quentes = leads.filter(l => l.etapa === "Lead/Entrada").length;
  const propostas = leads.filter(l => l.etapa === "Proposta Enviada").length;
  const ativos = clientes.filter(c => c.status_contrato === "ativo").length;

  return (
    <>
      <PageHeader eyebrow="CRM" title="Pipeline de" accent="vendas"
        actions={<PillBtn onClick={() => openCreate("lead")}><Plus size={14} className="inline mr-1" /> Novo lead</PillBtn>} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5 mb-6">
        <MetricCard variant="hero" value={brl(potencial)} label="Potencial no pipeline" />
        <MetricCard value={quentes} label="Leads quentes" />
        <MetricCard variant="accent" value={propostas} label="Propostas enviadas" />
        <MetricCard value={ativos} label="Clientes · Recorrência" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4 mb-6">
        {ETAPA_COLS.map((title) => {
          const items = leads.filter(l => l.etapa === title);
          return (
            <div key={title} className="rounded-[12px] p-4" style={{ background: C.beigeLight }}>
              <div className="mb-3 text-xs font-bold uppercase tracking-wider" style={{ color: C.textMid }}>{title}</div>
              <div className="space-y-2">
                {items.length === 0 && <div className="text-xs italic" style={{ color: C.textMuted }}>—</div>}
                {items.map((it) => (
                  <button
                    key={it.id}
                    onClick={() => openEdit("lead", it)}
                    className="w-full text-left rounded-[10px] bg-white p-3 hover:brightness-95"
                    style={{ boxShadow: SHADOW }}
                  >
                    <div className="font-semibold text-sm">{it.nome}</div>
                    <div className="font-extrabold mt-1" style={{ color: C.mid }}>{brl(Number(it.valor) || 0)}</div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
        <div className="rounded-[12px] p-4" style={{ background: C.beigeLight }}>
          <div className="mb-3 text-xs font-bold uppercase tracking-wider" style={{ color: C.textMid }}>✅ Ativo</div>
          <div className="space-y-2">
            {clientes.filter(c => c.status_contrato === "ativo").map((c) => (
              <div key={c.id} className="rounded-[10px] bg-white p-3" style={{ boxShadow: SHADOW }}>
                <div className="font-semibold text-sm">{c.nome}</div>
                <div className="font-extrabold mt-1" style={{ color: C.mid }}>{brl(Number(c.valor_mensal) || 0)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Card>
        <h3 className="font-extrabold text-lg mb-4">Todos os leads</h3>
        <ListState
          loading={loading}
          error={error}
          rows={leads}
          onRetry={refetch}
          skeletonVariant="row"
          skeletonCount={4}
          emptyTitle="Nenhum lead ainda"
          emptyDescription="Adicione seu primeiro lead para começar o pipeline."
          actionLabel="Novo lead"
          onAction={() => openCreate("lead")}
        >
          {/* Desktop table */}
          <table className="hidden md:table w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider" style={{ color: C.textMid }}>
                <th className="py-2">Nome</th><th>Valor</th><th>Etapa</th><th>Origem</th><th>Potencial</th><th></th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => (
                <tr key={l.id} className="border-t" style={{ borderColor: C.beigeLight }}>
                  <td className="py-3 font-semibold">{l.nome}</td>
                  <td className="font-extrabold" style={{ color: C.mid }}>{brl(Number(l.valor) || 0)}</td>
                  <td><TagBadge label={l.etapa} variant="frio" /></td>
                  <td style={{ color: C.textMid }}>{l.origem ?? "—"}</td>
                  <td style={{ color: C.textMid }}>{l.potencial ?? "—"}</td>
                  <td><RowActions onEdit={() => openEdit("lead", l)} onDelete={() => openDelete("lead", l)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {leads.map((l) => (
              <div key={l.id} className="rounded-[10px] p-3 flex items-start justify-between gap-2" style={{ background: C.beigeLight }}>
                <div className="min-w-0">
                  <div className="font-semibold truncate">{l.nome}</div>
                  <div className="font-extrabold text-sm" style={{ color: C.mid }}>{brl(Number(l.valor) || 0)}</div>
                  <div className="text-xs mt-1" style={{ color: C.textMid }}>{l.etapa} · {l.origem ?? "—"}</div>
                </div>
                <RowActions onEdit={() => openEdit("lead", l)} onDelete={() => openDelete("lead", l)} />
              </div>
            ))}
          </div>
        </ListState>
      </Card>
    </>
  );
}



type LancamentoRow = {
  id: string;
  tipo: "entrada" | "saida";
  descricao: string | null;
  valor: number;
  data_vencimento: string;
  status_pagamento: string;
  categoria_livre: string | null;
  categoria: string;
  cliente_id: string | null;
};

function FinancasPage() {
  const { openCreate, openEdit, openDelete } = useCrud();
  const { rows, loading, error, refetch } = useSupabaseList<LancamentoRow>("financas_administrativas", { order: { column: "data_vencimento", ascending: false } });
  const entradas = rows.filter(r => r.tipo === "entrada");
  const saidas = rows.filter(r => r.tipo === "saida");
  const totalE = entradas.reduce((s, e) => s + Number(e.valor || 0), 0);
  const totalS = saidas.reduce((s, e) => s + Number(e.valor || 0), 0);
  const lucro = totalE - totalS;
  const margem = totalE > 0 ? Math.round((lucro / totalE) * 100) : 0;

  const catLabel = (r: LancamentoRow) => r.categoria_livre || r.categoria || "—";

  return (
    <>
      <PageHeader eyebrow="Finanças" title="Junho" accent="2026"
        actions={<PillBtn onClick={() => openCreate("lancamento")}><Plus size={14} className="inline mr-1" /> Lançamento</PillBtn>} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-5 mb-6">
        <MetricCard variant="hero" value={brl(totalE)} label="Entradas" />
        <MetricCard value={brl(totalS)} label="Saídas" deltaType="down" />
        <MetricCard variant="accent" value={brl(lucro)} label="Lucro líquido" delta={`Margem ${margem}%`} deltaType="neutral" />
      </div>
      <ListState
        loading={loading}
        error={error}
        rows={rows}
        onRetry={refetch}
        skeletonVariant="row"
        skeletonCount={4}
        emptyTitle="Nenhum lançamento ainda"
        emptyDescription="Registre entradas e saídas para acompanhar o fluxo financeiro."
        actionLabel="Novo lançamento"
        onAction={() => openCreate("lancamento")}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5">
          <Card>
            <h3 className="font-extrabold text-lg mb-4">Entradas do mês</h3>
            <div className="space-y-2">
              {entradas.length === 0 && <div className="text-sm italic" style={{ color: C.textMuted }}>Nenhuma entrada.</div>}
              {entradas.map((e) => (
                <div key={e.id} className="flex items-center justify-between p-3 rounded-[10px]" style={{ background: C.beigeLight }}>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold truncate">{e.descricao}</div>
                    <div className="text-xs" style={{ color: C.textMid }}>{catLabel(e)} · {e.status_pagamento}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="font-extrabold" style={{ color: "#2E7D32" }}>+{brl(Number(e.valor))}</div>
                    <RowActions onEdit={() => openEdit("lancamento", e)} onDelete={() => openDelete("lancamento", e)} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <h3 className="font-extrabold text-lg mb-4">Saídas do mês</h3>
            <div className="space-y-2">
              {saidas.length === 0 && <div className="text-sm italic" style={{ color: C.textMuted }}>Nenhuma saída.</div>}
              {saidas.map((e) => (
                <div key={e.id} className="flex items-center justify-between p-3 rounded-[10px]" style={{ background: C.beigeLight }}>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold truncate">{e.descricao}</div>
                    <div className="text-xs" style={{ color: C.textMid }}>{catLabel(e)} · {e.status_pagamento}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="font-extrabold" style={{ color: "#C8351A" }}>-{brl(Number(e.valor))}</div>
                    <RowActions onEdit={() => openEdit("lancamento", e)} onDelete={() => openDelete("lancamento", e)} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </ListState>
    </>
  );
}


function SocialPage() {
  const { rows: clientes, loading: clientesLoading } = useSupabaseList<ClienteRow>("clientes", { order: { column: "nome" } });
  const [clienteId, setClienteId] = useState<string>("");

  useEffect(() => {
    if (!clienteId && clientes.length > 0) setClienteId(clientes[0].id);
  }, [clientes, clienteId]);

  const insightsFn = useServerFn(getInstagramAccountInsights);
  const [periodDays, setPeriodDays] = useState<number>(30);
  const [insights, setInsights] = useState<{
    username: string | null;
    followersCount: number | null;
    followsCount: number | null;
    mediaCount: number | null;
    avgEngagementRate: number | null;
    followerGrowth: number | null;
    periodDays: number;
    posts: Array<{
      id: string;
      caption: string | null;
      permalink: string | null;
      likes: number | null;
      comments: number | null;
      reach: number | null;
      saved: number | null;
      engagementRate: number | null;
    }>;
  } | null>(null);
  const [igLoading, setIgLoading] = useState(false);
  const [igError, setIgError] = useState<string | null>(null);

  useEffect(() => {
    if (!clienteId) return;
    let cancel = false;
    setIgLoading(true);
    setIgError(null);
    setInsights(null);
    insightsFn({ data: { clientId: clienteId, periodDays } })
      .then((res) => { if (!cancel) setInsights(res); })
      .catch((e) => { if (!cancel) setIgError(e instanceof Error ? e.message : "Erro ao buscar métricas do Instagram"); })
      .finally(() => { if (!cancel) setIgLoading(false); });
    return () => { cancel = true; };
  }, [clienteId, periodDays, insightsFn]);

  const fmtNum = (n: number | null | undefined) => (typeof n === "number" ? n.toLocaleString("pt-BR") : "—");
  const fmtPct = (r: number | null | undefined, digits = 1) =>
    typeof r === "number" ? `${(r * 100).toFixed(digits).replace(".", ",")}%` : "—";
  const fmtGrowth = (n: number | null | undefined) => {
    if (typeof n !== "number") return "—";
    const sign = n > 0 ? "+" : "";
    return `${sign}${n.toLocaleString("pt-BR")}`;
  };

  const followersNow = insights?.followersCount ?? null;
  const engagementNow = insights?.avgEngagementRate ?? null;

  return (
    <>
      <PageHeader eyebrow="Meta Business + Instagram" title="Métricas" accent="sociais"
        badges={<><LiveBadge label="Meta Business" /><LiveBadge label="Instagram" /></>}
      />

      <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
        <div>
          <Label>Cliente</Label>
          <Select value={clienteId} onValueChange={setClienteId}>
            <SelectTrigger><SelectValue placeholder={clientesLoading ? "Carregando..." : "Selecione um cliente"} /></SelectTrigger>
            <SelectContent>
              {clientes.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Período</Label>
          <Select value={String(periodDays)} onValueChange={(v) => setPeriodDays(Number(v))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="14">Últimos 14 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="60">Últimos 60 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-5 mb-6">
        <Card dark>
          <div className="font-extrabold text-lg">Instagram</div>
          {igLoading ? (
            <div className="text-xs opacity-70 mt-4">Carregando métricas...</div>
          ) : igError ? (
            <div className="mt-3 text-xs" style={{ color: "#FFC1B0" }}>
              {igError}
              <div className="mt-2">
                <a href="/admin/configuracoes?tab=integracoes" className="underline font-semibold">
                  Ir para Integrações
                </a>
              </div>
            </div>
          ) : insights ? (
            <>
              <div className="text-xs opacity-70">@{insights.username ?? "—"}</div>
              <div className="mt-4 text-3xl font-extrabold" style={{ letterSpacing: "-0.03em" }}>
                {fmtNum(insights.followersCount)}
              </div>
              <div className="text-xs opacity-70 mb-3">
                {insights.mediaCount != null ? `${insights.mediaCount} publicações` : "—"}
              </div>
              <div className="text-xs opacity-80">
                Crescimento ({insights.periodDays}d): <span className="font-semibold">{fmtGrowth(insights.followerGrowth)}</span>
              </div>
              <div className="text-xs opacity-80">
                Engajamento médio: <span className="font-semibold">{fmtPct(insights.avgEngagementRate)}</span>
              </div>
            </>
          ) : (
            <div className="text-xs opacity-70 mt-4">Selecione um cliente</div>
          )}
        </Card>
        {["TikTok", "YouTube", "Facebook"].map((plat) => (
          <Card key={plat}>
            <div className="font-extrabold text-lg">{plat}</div>
            <div className="text-xs mt-4" style={{ color: C.textMuted }}>Integração em breve</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-5 gap-5 mb-6">
        <div className="col-span-3">
          <Card>
            {/* TODO: mockado, sem integração ainda */}
            <h3 className="font-extrabold text-lg mb-4">Posts com melhor desempenho</h3>
            <div className="space-y-3">
              {[
                { n:"Reels: Método SMAM", m:"4.2k views", c:"gold" },
                { n:"Carrossel: Funil de vendas", m:"1.8k saves", c:"amber" },
                { n:"Story: Bastidores semana", m:"3.4k views", c:"green" },
                { n:"Reels: Cases reais", m:"2.1k shares", c:"purple" },
              ].map((p, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-[10px]" style={{ background: C.beigeLight }}>
                  <div className="flex items-center gap-3"><Dot color={p.c} /><span className="font-semibold">{p.n}</span></div>
                  <TagBadge label={p.m} variant="pendente" />
                </div>
              ))}
            </div>
          </Card>
        </div>
        <div className="col-span-2">
          <Card dark>
            <h3 className="font-extrabold text-lg mb-4">Metas do mês</h3>
            <div className="space-y-4">
              {[
                {
                  n: "Seguidores IG",
                  meta: 1500,
                  atualLabel: fmtNum(followersNow),
                  p: followersNow != null ? Math.min(100, Math.round((followersNow / 1500) * 100)) : null,
                  s: `Meta 1.500 · Atual ${fmtNum(followersNow)}`,
                },
                {
                  n: "Engajamento médio",
                  meta: 0.05,
                  atualLabel: fmtPct(engagementNow),
                  p: engagementNow != null ? Math.min(100, Math.round((engagementNow / 0.05) * 100)) : null,
                  s: `Meta 5% · Atual ${fmtPct(engagementNow)}`,
                },
                // Mantidos mockados por enquanto:
                { n: "Reels publicados", meta: 20, atualLabel: "14", p: 70, s: "Meta 20 · Atual 14" },
                { n: "Leads via DM",     meta: 30, atualLabel: "18", p: 60, s: "Meta 30 · Atual 18" },
              ].map((m, i) => (
                <div key={i}>
                  <div className="flex justify-between mb-1.5">
                    <div>
                      <div className="font-semibold text-sm">{m.n}</div>
                      <div className="text-xs opacity-70">{igLoading && i < 2 ? "Carregando..." : m.s}</div>
                    </div>
                    <span className="rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ background: C.gold, color: C.dark }}>
                      {m.p != null ? `${m.p}%` : "—"}
                    </span>
                  </div>
                  <GoldProgress pct={m.p ?? 0} />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <Card>
        <h3 className="font-extrabold text-lg mb-4">Calendário editorial</h3>
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs uppercase tracking-wider" style={{ color: C.textMid }}>
            <th className="py-2">Conteúdo</th><th>Cliente</th><th>Rede</th><th>Data</th><th>Status</th>
          </tr></thead>
          <tbody>
            {[
              { c:"Reels educativo", cl:"FL Contabilidade", r:"Instagram", d:"26 Jun", s:"ativo" },
              { c:"Carrossel cases", cl:"Irys SM", r:"Instagram", d:"27 Jun", s:"pendente" },
              { c:"Story bastidores", cl:"Beatriz Abel", r:"Instagram", d:"28 Jun", s:"ativo" },
              { c:"Post depoimento", cl:"Unaessential", r:"Facebook", d:"29 Jun", s:"atencao" },
            ].map((p, i) => (
              <tr key={i} className="border-t" style={{ borderColor: C.beigeLight }}>
                <td className="py-3 font-semibold">{p.c}</td><td>{p.cl}</td><td>{p.r}</td>
                <td style={{ color: C.textMid }}>{p.d}</td><td><TagBadge label={StatusLabel(p.s)} variant={p.s} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}

type EstrategiaRow = {
  id: string;
  cliente_id: string;
  pilares: string[];
  formatos: string[];
  qtd_entregaveis: number;
  objetivo: string | null;
};

function EstrategiaPage() {
  const { openCreate, openEdit, openDelete } = useCrud();
  const { rows: estrategias, loading, error, refetch } = useSupabaseList<EstrategiaRow>("estrategias", { order: { column: "created_at", ascending: false } });
  const { rows: clientes } = useSupabaseList<ClienteRow>("clientes", { order: { column: "nome" } });
  const clienteMap = new Map(clientes.map(c => [c.id, c]));

  return (
    <>
      <PageHeader eyebrow="Estratégia de Conteúdo" title="Estratégias" accent="ativas"
        actions={<PillBtn onClick={() => openCreate("estrategia")}><Plus size={14} className="inline mr-1" /> Nova estratégia</PillBtn>} />

      <ListState
        loading={loading}
        error={error}
        rows={estrategias}
        onRetry={refetch}
        skeletonCount={3}
        emptyTitle="Nenhuma estratégia cadastrada"
        emptyDescription="Monte a primeira estratégia vinculada a um cliente para começar."
        actionLabel="Nova estratégia"
        onAction={() => openCreate("estrategia")}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 mb-6">
          {estrategias.map((e) => {
            const cli = clienteMap.get(e.cliente_id);
            const pilares = Array.isArray(e.pilares) ? e.pilares : [];
            const formatos = Array.isArray(e.formatos) ? e.formatos : [];
            return (
              <Card key={e.id}>
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-[10px] font-extrabold text-lg" style={{ background: C.beige, color: C.dark }}>
                    {cli ? (cli.init || initialsOf(cli.nome)) : "?"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-extrabold truncate">{cli?.nome ?? "Cliente desconhecido"}</div>
                    <div className="text-xs" style={{ color: C.textMid }}>{cli?.plano_label || cli?.plano_atual || "—"}</div>
                  </div>
                  <RowActions onEdit={() => openEdit("estrategia", e)} onDelete={() => openDelete("estrategia", e)} />
                </div>
                <div className="mt-4 space-y-1.5 text-sm">
                  <div className="flex justify-between gap-2"><span style={{ color: C.textMid }}>Pilares</span><span className="font-semibold text-right truncate">{pilares.join(" · ") || "—"}</span></div>
                  <div className="flex justify-between"><span style={{ color: C.textMid }}>Entregáveis</span><span className="font-semibold">{e.qtd_entregaveis}/mês</span></div>
                  <div className="flex justify-between gap-2"><span style={{ color: C.textMid }}>Formato</span><span className="font-semibold text-right truncate">{formatos.join(" · ") || "—"}</span></div>
                </div>
                {e.objetivo && <div className="mt-3 text-xs" style={{ color: C.textMid }}>{e.objetivo}</div>}
              </Card>
            );
          })}
          <button
            onClick={() => openCreate("estrategia")}
            className="rounded-[18px] border-2 border-dashed flex flex-col items-center justify-center p-6 text-center transition-all hover:-translate-y-0.5 min-h-[180px]"
            style={{ borderColor: C.beige, color: C.textMid }}
          >
            <Plus size={28} />
            <div className="mt-2 font-semibold">Nova estratégia</div>
          </button>
        </div>
      </ListState>
    </>
  );
}



function OficinaPage() {
  const { openCreate, openEdit, openDelete } = useCrud();
  const tarefasQ = useSupabaseList<TarefaRow>("tarefas", { order: { column: "created_at", ascending: false } });
  const clientesQ = useSupabaseList<ClienteRow>("clientes", { order: { column: "nome" } });
  const clienteMap = useMemo(() => new Map(clientesQ.rows.map(c => [c.id, c])), [clientesQ.rows]);
  const tarefas = tarefasQ.rows;

  const naFila = tarefas.filter(t => t.status === "Backlog" || t.status === "Ideação").length;
  const emProducao = tarefas.filter(t => t.status === "Em produção" || t.status === "Aguardando aprovação").length;
  const aprovados = tarefas.filter(t => t.status === "Aprovado").length;
  const publicados = tarefas.filter(t => t.status === "Publicado").length;
  const destaques = tarefas.filter(t => t.status === "Em produção" || t.status === "Aguardando aprovação").slice(0, 6);

  const statusVariant = (s: string): string => {
    if (s === "Aprovado" || s === "Publicado") return "ativo";
    if (s === "Em produção" || s === "Aguardando aprovação") return "pendente";
    if (s === "Backlog" || s === "Ideação") return "frio";
    return "pendente";
  };

  return (
    <>
      <PageHeader eyebrow="Oficina de Conteúdo" title="Criação &" accent="aprovação"
        actions={<PillBtn onClick={() => openCreate("tarefa")}><Plus size={14} className="inline mr-1" /> Nova tarefa</PillBtn>} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5 mb-6">
        <MetricCard value={tarefasQ.loading ? "—" : naFila} label="Ideias na fila" />
        <MetricCard variant="hero" value={tarefasQ.loading ? "—" : emProducao} label="Em produção" />
        <MetricCard variant="accent" value={tarefasQ.loading ? "—" : aprovados} label="Aprovados" />
        <MetricCard value={tarefasQ.loading ? "—" : publicados} label="Publicados" />
      </div>

      <SectionLabel>Em destaque</SectionLabel>
      <div className="mb-6">
        <ListState
          loading={tarefasQ.loading}
          error={tarefasQ.error}
          rows={destaques}
          onRetry={tarefasQ.refetch}
          skeletonCount={3}
          emptyTitle="Nenhuma tarefa em produção"
          emptyDescription="Crie uma tarefa para acompanhar o fluxo de criação e aprovação."
          actionLabel="Nova tarefa"
          onAction={() => openCreate("tarefa")}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {destaques.map((t, i) => {
              const cli = t.cliente_id ? clienteMap.get(t.cliente_id) : null;
              const dark = i % 2 === 0;
              return (
                <Card key={t.id} dark={dark}>
                  <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: dark ? C.gold : C.mid }}>
                    {t.tipo}{cli ? ` · ${cli.nome}` : ""}
                  </div>
                  <div className="mt-2 font-extrabold text-lg leading-snug break-words">{t.titulo}</div>
                  <div className="mt-1 text-xs opacity-70">{t.status}{t.prazo ? ` · prazo ${new Date(t.prazo).toLocaleDateString("pt-BR")}` : ""}</div>
                </Card>
              );
            })}
          </div>
        </ListState>
      </div>

      <Card>
        <h3 className="font-extrabold text-lg mb-4">Pipeline de produção</h3>
        <ListState
          loading={tarefasQ.loading}
          error={tarefasQ.error}
          rows={tarefas}
          onRetry={tarefasQ.refetch}
          skeletonVariant="row"
          skeletonCount={5}
          emptyTitle="Sem tarefas ainda"
          actionLabel="Nova tarefa"
          onAction={() => openCreate("tarefa")}
        >
          {/* Desktop table */}
          <table className="hidden md:table w-full text-sm">
            <thead><tr className="text-left text-xs uppercase tracking-wider" style={{ color: C.textMid }}>
              <th className="py-2">Conteúdo</th><th>Cliente</th><th>Formato</th><th>Status</th><th></th>
            </tr></thead>
            <tbody>
              {tarefas.map((t) => {
                const cli = t.cliente_id ? clienteMap.get(t.cliente_id) : null;
                return (
                  <tr key={t.id} className="border-t" style={{ borderColor: C.beigeLight }}>
                    <td className="py-3 font-semibold">{t.titulo}</td>
                    <td>{cli?.nome ?? "—"}</td>
                    <td>{t.tipo}</td>
                    <td><TagBadge label={t.status} variant={statusVariant(t.status)} /></td>
                    <td><RowActions onEdit={() => openEdit("tarefa", t)} onDelete={() => openDelete("tarefa", t)} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {tarefas.map((t) => {
              const cli = t.cliente_id ? clienteMap.get(t.cliente_id) : null;
              return (
                <div key={t.id} className="rounded-[10px] p-3 flex items-start justify-between gap-2" style={{ background: C.beigeLight }}>
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{t.titulo}</div>
                    <div className="text-xs mt-1" style={{ color: C.textMid }}>{t.tipo}{cli ? ` · ${cli.nome}` : ""}</div>
                    <div className="mt-2"><TagBadge label={t.status} variant={statusVariant(t.status)} /></div>
                  </div>
                  <RowActions onEdit={() => openEdit("tarefa", t)} onDelete={() => openDelete("tarefa", t)} />
                </div>
              );
            })}
          </div>
        </ListState>
      </Card>
    </>
  );
}

type ReferenciaRow = {
  id: string;
  titulo: string;
  categoria: string;
  url: string;
  descricao: string | null;
};

function SwipePage() {
  const { openCreate, openEdit, openDelete } = useCrud();
  const { rows: referencias, loading, error, refetch } = useSupabaseList<ReferenciaRow>("referencias", { order: { column: "created_at", ascending: false } });
  return (
    <>
      <PageHeader eyebrow="Swipe File" title="Links &" accent="referências"
        actions={<PillBtn onClick={() => openCreate("referencia")}><Plus size={14} className="inline mr-1" /> Adicionar referência</PillBtn>} />

      <SectionLabel>Suas referências salvas</SectionLabel>
      <ListState
        loading={loading}
        error={error}
        rows={referencias}
        onRetry={refetch}
        skeletonCount={3}
        emptyTitle="Nenhuma referência salva"
        emptyDescription="Adicione links, posts inspiradores e materiais de apoio para consultar depois."
        actionLabel="Adicionar referência"
        onAction={() => openCreate("referencia")}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 mb-6">
          {referencias.map((r) => (
            <Card key={r.id}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: C.mid }}>{r.categoria}</div>
                  <a href={r.url} target="_blank" rel="noopener noreferrer" className="mt-2 font-extrabold text-lg block truncate hover:underline">
                    {r.titulo}
                  </a>
                  {r.descricao && <div className="mt-1 text-xs" style={{ color: C.textMid }}>{r.descricao}</div>}
                  <a href={r.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs" style={{ color: C.mid }}>
                    Abrir <ExternalLink size={12} />
                  </a>
                </div>
                <RowActions onEdit={() => openEdit("referencia", r)} onDelete={() => openDelete("referencia", r)} />
              </div>
            </Card>
          ))}
          <button
            onClick={() => openCreate("referencia")}
            className="rounded-[18px] border-2 border-dashed flex flex-col items-center justify-center p-6 text-center min-h-[160px]"
            style={{ borderColor: C.beige, color: C.textMid }}
          >
            <Plus size={28} /><div className="mt-2 font-semibold">Adicionar referência</div>
          </button>
        </div>
      </ListState>
    </>
  );
}


type PromptRow = {
  id: string;
  titulo: string;
  categoria: string;
  conteudo: string;
};

function PromptsPage() {
  const { openCreate, openEdit, openDelete } = useCrud();
  const { rows: prompts, loading, error, refetch } = useSupabaseList<PromptRow>("prompts", { order: { column: "created_at", ascending: false } });

  const copyPrompt = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => toast.success("Prompt copiado!"),
      () => toast.error("Não foi possível copiar")
    );
  };

  // group by categoria
  const grouped = new Map<string, PromptRow[]>();
  for (const p of prompts) {
    const arr = grouped.get(p.categoria) ?? [];
    arr.push(p);
    grouped.set(p.categoria, arr);
  }

  const renderCard = (p: PromptRow) => (
    <Card key={p.id}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: C.mid }}>{p.categoria}</div>
          <div className="mt-2 font-extrabold text-lg break-words">{p.titulo}</div>
          <div className="mt-2 text-sm opacity-80 overflow-hidden whitespace-pre-wrap" style={{ display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" }}>
            {p.conteudo}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <button
            onClick={() => copyPrompt(p.conteudo)}
            className="rounded-lg p-2 hover:bg-black/5 transition-colors"
            aria-label="Copiar prompt" title="Copiar"
            style={{ color: C.mid }}
          >
            <Copy size={16} />
          </button>
          <RowActions onEdit={() => openEdit("prompt", p)} onDelete={() => openDelete("prompt", p)} />
        </div>
      </div>
    </Card>
  );

  return (
    <>
      <PageHeader eyebrow="Biblioteca de Prompts IA" title="Prompts &" accent="frameworks"
        actions={<PillBtn onClick={() => openCreate("prompt")}><Plus size={14} className="inline mr-1" /> Novo prompt</PillBtn>} />

      <ListState
        loading={loading}
        error={error}
        rows={prompts}
        onRetry={refetch}
        skeletonCount={4}
        emptyTitle="Nenhum prompt salvo"
        emptyDescription="Salve seus frameworks e prompts de IA favoritos para reutilizar."
        actionLabel="Novo prompt"
        onAction={() => openCreate("prompt")}
      >
        {[...grouped.entries()].map(([cat, list]) => (
          <div key={cat}>
            <SectionLabel>{cat}</SectionLabel>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 mb-6">
              {list.map(renderCard)}
            </div>
          </div>
        ))}
      </ListState>
    </>
  );
}



type FerramentaRow = {
  id: string;
  nome: string;
  descricao: string | null;
  url: string;
  custo_mensal: number;
  categoria: string;
};

function FerramentasPage() {
  const { openCreate, openEdit, openDelete } = useCrud();
  const { rows: ferramentasDb, loading, error, refetch } = useSupabaseList<FerramentaRow>("ferramentas", { order: { column: "nome" } });
  const custo = ferramentasDb.reduce((s, f) => s + Number(f.custo_mensal || 0), 0);
  return (
    <>
      <PageHeader eyebrow="Ferramentas" title="Links &" accent="recursos"
        actions={<PillBtn onClick={() => openCreate("ferramenta")}><Plus size={14} className="inline mr-1" /> Adicionar ferramenta</PillBtn>} />
      <div className="grid grid-cols-2 md:grid-cols-2 gap-3 md:gap-5 mb-6">
        <MetricCard variant="hero" value={loading ? "—" : ferramentasDb.length} label="Ferramentas" />
        <MetricCard variant="accent" value={loading ? "—" : brl(custo)} label="Custo mensal" deltaType="neutral" />
      </div>
      <Card>
        <h3 className="font-extrabold text-lg mb-4">Ferramentas do workflow</h3>
        <ListState
          loading={loading}
          error={error}
          rows={ferramentasDb}
          onRetry={refetch}
          skeletonVariant="row"
          skeletonCount={4}
          emptyTitle="Nenhuma ferramenta cadastrada"
          emptyDescription="Adicione as ferramentas que você usa no dia a dia para controlar custos e acessos."
          actionLabel="Adicionar ferramenta"
          onAction={() => openCreate("ferramenta")}
        >
          <div className="space-y-3">
            {ferramentasDb.map((f) => (
              <div key={f.id} className="flex items-center justify-between p-3 rounded-[10px]" style={{ background: C.beigeLight }}>
                <a href={f.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 min-w-0 flex-1 hover:opacity-80">
                  <span className="text-xl">🔧</span>
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{f.nome}</div>
                    <div className="text-xs" style={{ color: C.textMid }}>
                      {f.categoria}{Number(f.custo_mensal) > 0 ? ` · ${brl(Number(f.custo_mensal))}/mês` : " · grátis"}
                    </div>
                  </div>
                </a>
                <RowActions onEdit={() => openEdit("ferramenta", f)} onDelete={() => openDelete("ferramenta", f)} />
              </div>
            ))}
          </div>
        </ListState>
      </Card>
    </>
  );
}


/* ---------- Central do Cliente (gestão) ---------- */
type Cliente = (typeof DB.clientes)[number];

function CentralClientePage({ selectedId, setSelectedId, enterPortal }: {
  selectedId: number; setSelectedId: (id: number) => void; enterPortal: () => void;
}) {
  const cliente = DB.clientes.find(c => c.id === selectedId) ?? DB.clientes[0];
  const portal = DB.portalCliente;
  const pct = Math.round((portal.metasProgresso.entregues / portal.metasProgresso.total) * 100);

  return (
    <>
      <PageHeader
        eyebrow="Página 13 · Portal exclusivo"
        title="Central do"
        accent="Cliente."
        badges={<LiveBadge label="Notion-sync simulado" />}
        actions={<PillBtn variant="gold" onClick={enterPortal}><UserSquare2 size={14} className="inline mr-1" /> Abrir Visão Cliente</PillBtn>}
      />

      <div className="grid grid-cols-3 gap-5 mb-6">
        <Card className="col-span-2">
          <SectionLabel>Cliente em visualização</SectionLabel>
          <div className="flex items-center gap-2 flex-wrap">
            {DB.clientes.map(c => {
              const active = c.id === cliente.id;
              return (
                <button key={c.id} onClick={() => setSelectedId(c.id)}
                  className="flex items-center gap-2 rounded-[30px] px-3 py-2 text-sm font-semibold transition-all"
                  style={{
                    background: active ? C.dark : "#fff",
                    color: active ? "#fff" : C.text,
                    border: `1px solid ${active ? C.dark : C.beige}`,
                  }}>
                  <span className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-extrabold"
                    style={{ background: active ? C.gold : C.beigeLight, color: C.dark }}>{c.init}</span>
                  {c.name}
                </button>
              );
            })}
          </div>
        </Card>
        <MetricCard variant="accent" value={`${pct}%`} label="Metas do portal" delta={`${portal.metasProgresso.entregues}/${portal.metasProgresso.total} entregues`} />
      </div>

      <Card>
        <SectionLabel>Preview do portal — {cliente.name}</SectionLabel>
        <p className="text-sm" style={{ color: C.textMid }}>
          Clique em <strong>Abrir Visão Cliente</strong> para simular exatamente o que <strong>{cliente.name}</strong> enxerga no Notion: vídeo de boas-vindas, 6 fases da parceria, 8 áudios de alinhamento, escopo, banco de insights, jornada de compra e bloqueadores de crescimento.
        </p>
        <div className="grid grid-cols-4 gap-4 mt-5">
          {[
            { t: "1 vídeo", s: "Guia de navegação" },
            { t: `${portal.etapasTimeline.length} fases`, s: "Linha do tempo da parceria" },
            { t: `${portal.audios.length} áudios`, s: "Player de dinâmica" },
            { t: `${portal.bloqueadores.length} cards`, s: "Bloqueadores de crescimento" },
          ].map((x, i) => (
            <div key={i} className="p-4 rounded-[14px]" style={{ background: C.beigeLight }}>
              <div className="text-2xl font-extrabold" style={{ color: C.dark }}>{x.t}</div>
              <div className="text-xs mt-1" style={{ color: C.textMid }}>{x.s}</div>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

/* ---------- Portal do Cliente (visão cliente, fullscreen) ---------- */
function AudioPlayer({ id, title, desc, duration, activeId, setActiveId }: {
  id: number; title: string; desc: string; duration: string;
  activeId: number | null; setActiveId: (id: number | null) => void;
}) {
  const isPlaying = activeId === id;
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (!isPlaying) return;
    const t = setInterval(() => setProgress(p => (p >= 100 ? 0 : p + 1.2)), 200);
    return () => clearInterval(t);
  }, [isPlaying]);
  useEffect(() => { if (!isPlaying) setProgress(0); }, [isPlaying]);

  return (
    <div className="rounded-[14px] p-4 flex items-center gap-4" style={{ background: "#fff", boxShadow: SHADOW }}>
      <button onClick={() => setActiveId(isPlaying ? null : id)}
        className="h-12 w-12 rounded-full flex items-center justify-center shrink-0 transition-transform hover:scale-105"
        style={{ background: isPlaying ? C.gold : C.dark, color: isPlaying ? C.dark : "#fff" }}>
        {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-3">
          <div className="font-semibold truncate" style={{ color: C.text }}>{title}</div>
          <div className="text-xs font-bold tabular-nums" style={{ color: C.textMid }}>{duration}</div>
        </div>
        <div className="text-xs mt-0.5 mb-2 line-clamp-1" style={{ color: C.textMid }}>{desc}</div>
        <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: C.beigeLight }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${C.mid}, ${C.gold})` }} />
        </div>
      </div>
    </div>
  );
}

function FaseAccordion({ fase, nome, desc, subitens, ativa, open, onToggle }: {
  fase: number; nome: string; desc: string; subitens: string[]; ativa: boolean;
  open: boolean; onToggle: () => void;
}) {
  return (
    <div className="rounded-[18px] overflow-hidden" style={{ background: "#fff", boxShadow: SHADOW }}>
      <button onClick={onToggle} className="w-full p-5 flex items-center gap-4 text-left">
        <div className="h-11 w-11 rounded-full flex items-center justify-center shrink-0 text-sm font-extrabold"
          style={{ background: ativa ? C.gold : C.beigeLight, color: C.dark }}>
          {fase}
        </div>
        <div className="flex-1">
          <div className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: ativa ? C.mid : C.textMid }}>
            Fase {fase} {ativa && "· Em andamento"}
          </div>
          <div className="font-extrabold mt-0.5" style={{ color: C.text }}>{nome}</div>
        </div>
        {open ? <ChevronDown size={20} style={{ color: C.textMid }} /> : <ChevronRight size={20} style={{ color: C.textMid }} />}
      </button>
      {open && (
        <div className="px-5 pb-5" style={{ paddingLeft: "80px" }}>
          <p className="text-sm mb-3" style={{ color: C.textMid }}>{desc}</p>
          <ul className="space-y-1.5">
            {subitens.map((s, i) => (
              <li key={i} className="flex items-center gap-2 text-sm" style={{ color: C.text }}>
                {ativa ? <CheckCircle2 size={14} style={{ color: C.mid }} /> : <Circle size={14} style={{ color: C.textMuted }} />}
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function BloqueadorCard({ n, t, sub, por, open, onToggle }: {
  n: number; t: string; sub: string; por: string; open: boolean; onToggle: () => void;
}) {
  return (
    <div className="rounded-[18px] overflow-hidden" style={{ background: "#fff", boxShadow: SHADOW }}>
      <button onClick={onToggle} className="w-full p-5 flex items-center gap-4 text-left">
        <div className="h-10 w-10 rounded-[12px] flex items-center justify-center shrink-0 text-sm font-extrabold"
          style={{ background: C.beigeLight, color: C.dark }}>
          {n}
        </div>
        <div className="flex-1">
          <div className="font-extrabold" style={{ color: C.text }}>{t}</div>
          <div className="text-xs mt-0.5" style={{ color: C.textMid }}>{sub}</div>
        </div>
        {open ? <ChevronDown size={20} style={{ color: C.textMid }} /> : <ChevronRight size={20} style={{ color: C.textMid }} />}
      </button>
      {open && (
        <div className="px-5 pb-5" style={{ paddingLeft: "76px" }}>
          <div className="text-[11px] font-bold uppercase tracking-[0.18em] mb-1" style={{ color: C.mid }}>Por que bloqueia</div>
          <p className="text-sm" style={{ color: C.text }}>{por}</p>
        </div>
      )}
    </div>
  );
}

function PortalCliente({ cliente, onExit }: { cliente: Cliente; onExit: () => void }) {
  const portal = DB.portalCliente;
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [activeAudioId, setActiveAudioId] = useState<number | null>(null);
  const [openFase, setOpenFase] = useState<number | null>(1);
  const [openBloq, setOpenBloq] = useState<number | null>(null);

  return (
    <div className="min-h-screen" style={{ background: C.bg }}>
      <header className="sticky top-0 z-30 flex items-center justify-between px-8 py-4"
        style={{ background: C.dark, color: "#fff", boxShadow: SHADOW }}>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-extrabold"
            style={{ background: `linear-gradient(135deg, ${C.mid}, ${C.gold})`, color: "#fff" }}>
            {cliente.init}
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: "rgba(255,255,255,0.6)" }}>
              Portal exclusivo · Notion
            </div>
            <div className="font-extrabold">{cliente.name}</div>
          </div>
        </div>
        <button onClick={onExit}
          className="rounded-[30px] px-5 py-2.5 text-sm font-semibold flex items-center gap-2 transition-all hover:-translate-y-0.5"
          style={{ background: C.gold, color: C.dark }}>
          <ArrowLeft size={14} /> Voltar para Gestão
        </button>
      </header>

      <div className="mx-auto max-w-[1100px] p-8 space-y-8">
        <section className="rounded-[18px] p-8" style={{ background: C.beigeLight }}>
          <Eyebrow>Bloco 1 · Boas-vindas</Eyebrow>
          <h2 className="text-3xl font-extrabold mt-2 mb-4" style={{ color: C.text, letterSpacing: "-0.02em" }}>
            Seja bem-vinda ao seu ecossistema.
          </h2>
          <p className="text-base leading-relaxed" style={{ color: C.text }}>
            Seja bem-vinda ao seu ecossistema de <strong>posicionamento, desejo e marketing de diferenciação</strong>.
            Este é o espaço onde toda a estratégia da sua marca pessoal acontece — da primeira reunião à análise mensal.
            Reserve um tempo para explorar cada bloco abaixo com calma; tudo aqui foi desenhado para destravar o seu próximo nível.
          </p>
        </section>

        <section className="grid grid-cols-2 gap-6 items-center">
          <div className="aspect-video rounded-[18px] overflow-hidden relative flex items-center justify-center cursor-pointer group"
            style={{ background: `linear-gradient(135deg, ${C.dark}, #4A2510)`, boxShadow: SHADOW }}
            onClick={() => setVideoPlaying(v => !v)}>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-20 w-20 rounded-full flex items-center justify-center transition-transform group-hover:scale-110"
                style={{ background: C.gold, color: C.dark }}>
                {videoPlaying ? <Pause size={28} /> : <Play size={28} className="ml-1" />}
              </div>
            </div>
            <div className="absolute bottom-4 left-4 flex items-center gap-2 text-xs font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>
              <Video size={14} /> {portal.videoBoasVindas}
            </div>
          </div>
          <div>
            <Eyebrow>Guia de navegação</Eyebrow>
            <h3 className="text-2xl font-extrabold mt-2 mb-3" style={{ color: C.text, letterSpacing: "-0.02em" }}>
              Comece por aqui.
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: C.textMid }}>
              O vídeo ao lado contém orientações fundamentais sobre como funciona a nossa nova plataforma de trabalho
              e o que você deve preencher até o dia do nosso encontro estratégico.
            </p>
          </div>
        </section>

        <section>
          <Eyebrow>Bloco 2 · Linha do tempo da parceria</Eyebrow>
          <h2 className="text-2xl font-extrabold mt-2 mb-5" style={{ color: C.text, letterSpacing: "-0.02em" }}>
            As 6 fases que vamos atravessar juntas.
          </h2>
          <div className="space-y-3">
            {portal.etapasTimeline.map(f => (
              <FaseAccordion key={f.fase} {...f}
                open={openFase === f.fase}
                onToggle={() => setOpenFase(openFase === f.fase ? null : f.fase)} />
            ))}
          </div>
        </section>

        <section>
          <Eyebrow>Bloco 3 · Gestão de expectativas</Eyebrow>
          <h2 className="text-2xl font-extrabold mt-2 mb-2" style={{ color: C.text, letterSpacing: "-0.02em" }}>
            Boas-vidas & nossa dinâmica.
          </h2>
          <p className="text-sm mb-5" style={{ color: C.textMid }}>
            Os áudios abaixo foram gravados especialmente para alinhar a nossa operação.
            Não deixe de ouvi-los antes do nosso primeiro encontro estratégico!
          </p>
          <div className="grid grid-cols-2 gap-3">
            {portal.audios.map(a => (
              <AudioPlayer key={a.id} {...a} activeId={activeAudioId} setActiveId={setActiveAudioId} />
            ))}
          </div>
        </section>

        <section>
          <Eyebrow>Bloco 4 · Referencial de entrega</Eyebrow>
          <h2 className="text-2xl font-extrabold mt-2 mb-5" style={{ color: C.text, letterSpacing: "-0.02em" }}>
            O que está incluso na sua marca pessoal.
          </h2>
          <Card>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Instagram size={18} style={{ color: C.mid }} />
                  <div className="font-extrabold">Instagram Feed</div>
                  <TagBadge label="3x semana" variant="ativo" />
                </div>
                <p className="text-sm" style={{ color: C.textMid }}>
                  Reels de posicionamento, bastidores refinados e Carrosséis educativos de alto valor.
                </p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Instagram size={18} style={{ color: C.mid }} />
                  <div className="font-extrabold">Instagram Stories</div>
                  <TagBadge label="Diário" variant="ativo" />
                </div>
                <p className="text-sm" style={{ color: C.textMid }}>
                  Mínimo de 3 blocos de narrativa ao longo do dia para gerar conexão e desejo.
                </p>
              </div>
            </div>
          </Card>
        </section>

        <section>
          <Eyebrow>Bloco 5 · Insights & jornada</Eyebrow>
          <h2 className="text-2xl font-extrabold mt-2 mb-5" style={{ color: C.text, letterSpacing: "-0.02em" }}>
            Onde você deposita ideias e como sua paciente decide comprar.
          </h2>
          <div className="grid grid-cols-2 gap-5">
            <Card>
              <SectionLabel>Banco de Insights</SectionLabel>
              <p className="text-sm mb-4" style={{ color: C.textMid }}>
                Envie aqui ideias espontâneas, dúvidas de balcão da especialista, prints de conversas com pacientes
                e qualquer faísca que possa virar conteúdo. Nada se perde — tudo entra no radar editorial.
              </p>
              <a href={portal.insightsLink} target="_blank" rel="noreferrer">
                <PillBtn variant="gold"><FolderOpen size={14} className="inline mr-2" /> Banco de Insights do Cliente</PillBtn>
              </a>
            </Card>
            <Card>
              <SectionLabel>Jornada de compra da paciente</SectionLabel>
              <div className="space-y-3">
                {[
                  { t: "Topo de Funil", s: "Atração · Público Frio", c: "#DDE9F2", fg: "#1E4F7A" },
                  { t: "Meio de Funil", s: "Conexão/Consideração · Público Morno", c: "#FFF3CD", fg: "#8A6914" },
                  { t: "Base de Funil", s: "Conversão · Público Quente", c: "#FFE5D9", fg: "#A8431E" },
                ].map((x, i) => (
                  <div key={i} className="p-3 rounded-[12px] flex items-center gap-3" style={{ background: x.c }}>
                    <div className="h-8 w-8 rounded-full flex items-center justify-center font-extrabold text-sm"
                      style={{ background: "#fff", color: x.fg }}>{i + 1}</div>
                    <div>
                      <div className="font-extrabold text-sm" style={{ color: x.fg }}>{x.t}</div>
                      <div className="text-xs" style={{ color: x.fg, opacity: 0.85 }}>{x.s}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </section>

        <section>
          <Eyebrow>Bloco 6 · Bloqueadores de crescimento</Eyebrow>
          <h2 className="text-2xl font-extrabold mt-2 mb-2" style={{ color: C.text, letterSpacing: "-0.02em" }}>
            Os 6 fatores que travam o algoritmo e o público.
          </h2>
          <p className="text-sm mb-5" style={{ color: C.textMid }}>
            Identificar para evitar. Clique em cada card para entender por que aquele comportamento bloqueia o crescimento.
          </p>
          <div className="space-y-3">
            {portal.bloqueadores.map(b => (
              <BloqueadorCard key={b.n} {...b}
                open={openBloq === b.n}
                onToggle={() => setOpenBloq(openBloq === b.n ? null : b.n)} />
            ))}
          </div>
        </section>

        <footer className="pt-4 pb-8 text-center text-xs" style={{ color: C.textMuted }}>
          Portal exclusivo {cliente.name} · gerido por Thamirys · Painel 360°
        </footer>
      </div>
    </div>
  );
}

/* ---------- Unified pages (Bloco 1) ---------- */
function TabBar({ tabs, active, onChange }: { tabs: { key: string; label: string }[]; active: string; onChange: (k: string) => void }) {
  return (
    <div className="mb-6 flex gap-1 border-b" style={{ borderColor: C.beigeLight }}>
      {tabs.map((t) => {
        const on = t.key === active;
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className="px-4 py-2 text-sm font-bold border-b-2 -mb-px transition-colors"
            style={{
              color: on ? C.dark : C.textMid,
              borderColor: on ? C.gold : "transparent",
            }}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

function ConteudoPage() {
  const [tab, setTab] = useState("calendario");
  return (
    <>
      <TabBar
        active={tab}
        onChange={setTab}
        tabs={[
          { key: "calendario", label: "Calendário editorial" },
          { key: "pipeline",   label: "Pipeline de produção" },
          { key: "entregas",   label: "Entregas do mês" },
        ]}
      />
      {tab === "calendario" && <EstrategiaPage />}
      {tab === "pipeline"   && <OficinaPage />}
      {tab === "entregas"   && (
        <Card>
          <h3 className="font-extrabold text-lg mb-2">Entregas do mês</h3>
          <p className="text-sm" style={{ color: C.textMid }}>
            Sistema de check por cliente — será implementado no Bloco 3.
          </p>
        </Card>
      )}
    </>
  );
}

function BibliotecaPage() {
  const [tab, setTab] = useState("referencias");
  return (
    <>
      <TabBar
        active={tab}
        onChange={setTab}
        tabs={[
          { key: "referencias", label: "Referências" },
          { key: "prompts",     label: "Prompts IA" },
          { key: "ferramentas", label: "Ferramentas" },
        ]}
      />
      {tab === "referencias" && <SwipePage />}
      {tab === "prompts"     && <PromptsPage />}
      {tab === "ferramentas" && <FerramentasPage />}
    </>
  );
}

function ConfigPage() {
  const [tab, setTab] = useState(() => {
    if (typeof window === "undefined") return "perfil";
    return new URLSearchParams(window.location.search).get("tab") === "integracoes" ? "integracoes" : "perfil";
  });
  return (
    <>
      <PageHeader eyebrow="Sistema" title="Configurações &" accent="conta" />
      <TabBar
        active={tab}
        onChange={setTab}
        tabs={[
          { key: "perfil",      label: "Perfil" },
          { key: "integracoes", label: "Integrações" },
          { key: "juridico",    label: "Jurídico" },
          { key: "equipe",      label: "Equipe" },
          { key: "planos",      label: "Planos & Conta" },
        ]}
      />
      {tab === "perfil" && (
        <Card>
          <ProfileTab />
        </Card>
      )}

      {tab === "integracoes" && (
        <Card>
          <IntegrationsTab />
        </Card>
      )}
      {tab === "juridico" && (
        <Card>
          <h3 className="font-extrabold text-lg mb-2">Modelos de contrato e termos</h3>
          <p className="text-sm mb-4" style={{ color: C.textMid }}>Gerencie contratos, termos e políticas com dados do CNPJ.</p>
          <a href="/admin/juridico" className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold" style={{ background: C.dark, color: "#fff" }}>
            Abrir módulo jurídico <ArrowRight size={14} />
          </a>
        </Card>
      )}
      {tab === "equipe" && (
        <Card>
          <h3 className="font-extrabold text-lg mb-2">Equipe & papéis</h3>
          <p className="text-sm mb-4" style={{ color: C.textMid }}>Atribua papéis (admin, gestor, editor, social, financeiro, jurídico, cliente) aos membros.</p>
          <a href="/admin/equipe" className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold" style={{ background: C.dark, color: "#fff" }}>
            Gerenciar equipe <ArrowRight size={14} />
          </a>
        </Card>
      )}
      {tab === "planos" && (
        <Card>
          <AccountTab />
        </Card>
      )}
    </>
  );
}

/* ---------- Shell ---------- */
function Painel360Inner() {
  const [active, setActive] = useState<PageKey>(() => {
    if (typeof window === "undefined") return "dash";
    return new URLSearchParams(window.location.search).get("tab") === "integracoes" ? "config" : "dash";
  });
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [active]);


  return (
    <div className="h-screen overflow-hidden flex flex-col md:flex-row" style={{ background: C.bg, color: C.text }}>
      {/* Mobile header */}
      <header
        className="md:hidden sticky top-0 z-20 flex h-14 items-center justify-between px-4 shrink-0"
        style={{ background: C.dark, color: "#fff" }}
      >
        <button
          onClick={() => setMobileOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-white/10"
          aria-label="Abrir menu"
        >
          <Menu size={22} />
        </button>
        <span className="font-extrabold tracking-tight">Irys OS</span>
        <div
          className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-extrabold"
          style={{ background: `linear-gradient(135deg, ${C.mid}, ${C.gold})`, color: "#fff" }}
        >
          T
        </div>
      </header>

      <Sidebar
        active={active}
        setActive={setActive}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />
      <main
        ref={scrollRef}
        className={`flex-1 overflow-y-auto transition-[margin] duration-200 ml-0 ${collapsed ? "md:ml-16" : "md:ml-60"}`}
      >
        <div className="mx-auto max-w-[1400px] p-4 md:p-8">

          {active === "dash"       && <DashboardPage go={setActive} />}
          {active === "agenda"     && <AgendaPage />}
          {active === "clientes"   && <ClientesPage />}
          {active === "conteudo"   && <ConteudoPage />}
          {active === "social"     && <SocialPage />}
          {active === "crm"        && <CRMPage />}
          {active === "financas"   && <FinancasPage />}
          {active === "biblioteca" && <BibliotecaPage />}
          {active === "config"     && <ConfigPage />}
        </div>
      </main>
    </div>
  );
}

export default function Painel360() {
  return (
    <CrudProvider>
      <Painel360Inner />
    </CrudProvider>
  );
}
