import { useMemo, useState, useRef, useEffect, type ReactNode, type CSSProperties } from "react";
import {
  LayoutDashboard, Calendar, Users, TrendingUp, CreditCard, Instagram,
  Bookmark, Wrench, Plus, Zap, ArrowRight, Library, FileText, Settings, Menu,
  UserSquare2, Play, Pause, ChevronDown, ChevronRight, ArrowLeft, FolderOpen, Video, CheckCircle2, Circle,
  RefreshCw, LinkIcon, LogOut, ExternalLink, Copy,
} from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import {
  startGoogleCalendarAuth,
  getGoogleCalendarStatus,
  disconnectGoogleCalendar,
  listGoogleCalendarEvents,
} from "@/lib/google-calendar.functions";
import { CrudProvider, useCrud } from "@/components/crud/CrudProvider";
import { RowActions } from "@/components/crud/RowActions";
import { useSupabaseList } from "@/hooks/useSupabaseList";
import { toast } from "sonner";



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
const C = {
  dark: "#2C1505", mid: "#7A4A18", gold: "#C9A46E",
  beige: "#E8D8C0", beigeLight: "#F5EEE5", bg: "#EDEAE5",
  text: "#1A0A02", textMid: "#7A6050", textMuted: "#BBA898",
};
const SHADOW = "0 2px 16px rgba(44,21,5,0.09)";
const SHADOW_HOVER = "0 6px 28px rgba(44,21,5,0.16)";

const brl = (n: number) => "R$ " + n.toLocaleString("pt-BR");

/* ---------- shared atoms ---------- */
function Eyebrow({ children }: { children: ReactNode }) {
  return <div className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: C.textMid }}>{children}</div>;
}
function H1({ children }: { children: ReactNode }) {
  return <h1 className="text-4xl font-extrabold leading-tight mt-2" style={{ color: C.text, letterSpacing: "-0.03em" }}>{children}</h1>;
}
function Card({ children, dark = false, className = "", style }: { children: ReactNode; dark?: boolean; className?: string; style?: CSSProperties }) {
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
function PillBtn({ children, variant = "dark", onClick }: { children: ReactNode; variant?: "dark" | "ghost" | "gold"; onClick?: () => void }) {
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

const STATUS_COLORS: Record<string, { bg: string; fg: string }> = {
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
function TagBadge({ label, variant }: { label: string; variant: string }) {
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
    <div className="rounded-[18px] p-6 transition-all duration-150 hover:-translate-y-0.5"
      style={{ background: bg, color: fg, boxShadow: SHADOW }}>
      <div className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: labelColor }}>{label}</div>
      <div className="mt-3 text-4xl font-extrabold" style={{ letterSpacing: "-0.03em" }}>{value}</div>
      {delta && <div className="mt-2 text-xs font-semibold" style={{ color: deltaColor }}>{delta}</div>}
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
  | "crm" | "financas" | "biblioteca" | "central" | "config";

type NavItem = { key: PageKey; label: string; icon: typeof LayoutDashboard };
type NavGroup = { label: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  { label: "Operação", items: [
    { key: "dash",     label: "Dashboard",  icon: LayoutDashboard },
    { key: "agenda",   label: "Agenda",     icon: Calendar },
    { key: "clientes", label: "Clientes",   icon: Users },
    { key: "central",  label: "Portal do Cliente", icon: UserSquare2 },
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
function DashboardPage({ go }: { go: (p: PageKey) => void }) {
  const { openCreate } = useCrud();
  const faturamento = useMemo(() => DB.clientes.filter(c => c.status === "ativo").reduce((s, c) => s + c.val, 0), []);
  const clientesAtivos = useMemo(() => DB.clientes.filter(c => c.status === "ativo").length, []);
  const postsEntregues = useMemo(() => DB.clientes.reduce((s, c) => s + c.feitos, 0), []);
  const hoje = DB.agenda.filter(a => a.data === "Hoje");

  return (
    <>
      <PageHeader
        eyebrow="Painel 360° · Junho 2026"
        title="Bem-vinda,"
        accent="Thamirys."
        badges={<LiveBadge label="Integrações ativas" />}
        actions={<>
          <PillBtn variant="ghost" onClick={() => go("agenda")}><Zap size={14} className="inline mr-1" /> Hoje</PillBtn>
          <PillBtn onClick={() => openCreate("tarefa")}><Plus size={14} className="inline mr-1" /> Nova tarefa</PillBtn>
        </>}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5 mb-6">

        <MetricCard variant="hero"    value={brl(faturamento)}   label="Faturamento" delta="↑ 12% vs maio" />
        <MetricCard                    value={clientesAtivos}     label="Clientes ativos" delta="↑ 1 novo" />
        <MetricCard variant="accent"   value={postsEntregues}     label="Posts entregues" delta="de 42 previstos" deltaType="neutral" />
        <MetricCard                    value={DB.leads.length}    label="Leads pipeline" delta="↓ 2 perdidos" deltaType="down" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-5 mb-6">
        <div className="lg:col-span-3">

          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-lg">CRM — Leads ativos</h3>
              <button onClick={() => go("crm")} className="text-xs font-bold uppercase tracking-wider" style={{ color: C.mid }}>ver CRM →</button>
            </div>
            <div className="space-y-3">
              {DB.leads.map((l, i) => (
                <div key={i} className="flex items-center justify-between rounded-[10px] p-3" style={{ background: C.beigeLight }}>
                  <div className="flex items-center gap-3">
                    <Dot color={l.status === "quente" ? "red" : l.status === "negociando" ? "amber" : l.status === "proposta" ? "purple" : "blue"} />
                    <div>
                      <div className="font-semibold">{l.name}</div>
                      <div className="text-xs" style={{ color: C.textMid }}>{l.origem} · {l.potencial}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <TagBadge label={StatusLabel(l.status)} variant={l.status} />
                    <span className="font-extrabold" style={{ color: C.mid }}>{brl(l.val)}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
        <div className="lg:col-span-2">

          <Card dark>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-lg">📅 Google Agenda — Hoje</h3>
              <button onClick={() => go("agenda")} className="text-xs font-bold uppercase tracking-wider" style={{ color: C.gold }}>agenda →</button>
            </div>
            <div className="space-y-3">
              {hoje.map((e, i) => (
                <div key={i} className="flex items-center justify-between rounded-[10px] p-3" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{e.name}</div>
                    <div className="text-xs opacity-70">{e.time} · {e.dur}</div>
                  </div>
                  <span className="rounded-full px-2.5 py-1 text-[11px] font-bold uppercase"
                    style={{ background: e.cor === "red" ? "#C8351A" : e.cor === "green" ? "#2E7D32" : "rgba(255,255,255,0.15)", color: "#fff" }}>
                    {e.cor === "red" ? "Urgente" : "Hoje"}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-5">
        <div className="lg:col-span-3">

          <Card>
            <h3 className="font-extrabold text-lg mb-4">Entregas por cliente — Junho</h3>
            <div className="space-y-4">
              {DB.clientes.map((c) => (
                <div key={c.id}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-semibold">{c.name}</span>
                    <span style={{ color: C.textMid }}>{c.feitos}/{c.posts}</span>
                  </div>
                  <ProgressBar value={c.feitos} max={c.posts} colorByPercent />
                </div>
              ))}
            </div>
          </Card>
        </div>
        <div className="lg:col-span-2">

          <Card>
            <h3 className="font-extrabold text-lg mb-4">Acesso rápido</h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { e:"📅", n:"Agenda", s:"Hoje", k:"agenda" as PageKey },
                { e:"👥", n:"Clientes", s:`${clientesAtivos} ativos`, k:"clientes" as PageKey },
                { e:"📈", n:"CRM", s:`${DB.leads.length} leads`, k:"crm" as PageKey },
                { e:"💳", n:"Finanças", s:"Junho", k:"financas" as PageKey },
                { e:"📝", n:"Conteúdo", s:"Calendário", k:"conteudo" as PageKey },
                { e:"📚", n:"Biblioteca", s:"Refs & prompts", k:"biblioteca" as PageKey },
              ].map((c) => (
                <button key={c.n} onClick={() => go(c.k)}
                  className="rounded-[10px] p-3 text-left transition-all hover:-translate-y-0.5"
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


function ClientesPage() {
  const { openCreate } = useCrud();
  const ativos = DB.clientes.filter(c => c.status === "ativo").length;
  const maxVal = Math.max(...DB.clientes.map(c => c.val));
  return (
    <>
      <PageHeader eyebrow="Clientes" title={`${ativos} clientes`} accent="ativos"
        actions={<PillBtn onClick={() => openCreate("cliente")}><Plus size={14} className="inline mr-1" /> Novo cliente</PillBtn>} />

      <div className="grid grid-cols-3 gap-5 mb-6">
        {DB.clientes.map((c) => (
          <Card key={c.id}>
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-[10px] font-extrabold text-lg flex-shrink-0"
                style={{ background: C.beige, color: C.dark }}>{c.init}</div>
              <div className="min-w-0 flex-1">
                <div className="font-extrabold truncate">{c.name}</div>
                <div className="text-xs" style={{ color: C.textMid }}>{c.pkg}</div>
                <div className="mt-2 font-extrabold" style={{ color: C.mid }}>{brl(c.val)}/mês</div>
              </div>
            </div>
            <div className="mt-4"><TagBadge label={StatusLabel(c.status)} variant={c.status} /></div>
          </Card>
        ))}
      </div>
      <Card>
        <h3 className="font-extrabold text-lg mb-4">Receita mensal por cliente (MRR)</h3>
        <div className="space-y-4">
          {DB.clientes.map((c) => (
            <div key={c.id}>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="font-semibold">{c.name}</span>
                <span className="font-extrabold" style={{ color: C.mid }}>{brl(c.val)}</span>
              </div>
              <ProgressBar value={c.val} max={maxVal} />
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

function CRMPage() {
  const { openCreate } = useCrud();
  const potencial = DB.leads.reduce((s, l) => s + l.val, 0);
  const quentes = DB.leads.filter(l => l.status === "quente").length;
  const propostas = DB.leads.filter(l => l.status === "proposta").length;
  const ativos = DB.clientes.filter(c => c.status === "ativo").length;
  const cols = [
    { title: "Lead / Entrada", items: DB.leads.filter(l => l.status === "quente") },
    { title: "Reunião Marcada", items: DB.leads.filter(l => l.status === "frio") },
    { title: "Proposta Enviada", items: DB.leads.filter(l => l.status === "proposta") },
    { title: "Negociando", items: DB.leads.filter(l => l.status === "negociando") },
    { title: "✅ Ativo", items: DB.clientes.filter(c => c.status === "ativo").map(c => ({ name: c.name, val: c.val })) },
  ];
  return (
    <>
      <PageHeader eyebrow="CRM" title="Pipeline de" accent="vendas"
        actions={<PillBtn onClick={() => openCreate("lead")}><Plus size={14} className="inline mr-1" /> Novo lead</PillBtn>} />

      <div className="grid grid-cols-4 gap-5 mb-6">
        <MetricCard variant="hero" value={brl(potencial)} label="Potencial no pipeline" />
        <MetricCard value={quentes} label="Leads quentes" />
        <MetricCard variant="accent" value={propostas} label="Propostas enviadas" />
        <MetricCard value={ativos} label="Clientes · Recorrência" />
      </div>
      <div className="grid grid-cols-5 gap-4 mb-6">
        {cols.map((col) => (
          <div key={col.title} className="rounded-[12px] p-4" style={{ background: C.beigeLight }}>
            <div className="mb-3 text-xs font-bold uppercase tracking-wider" style={{ color: C.textMid }}>{col.title}</div>
            <div className="space-y-2">
              {col.items.length === 0 && <div className="text-xs italic" style={{ color: C.textMuted }}>—</div>}
              {col.items.map((it, i) => (
                <div key={i} className="rounded-[10px] bg-white p-3" style={{ boxShadow: SHADOW }}>
                  <div className="font-semibold text-sm">{it.name}</div>
                  <div className="font-extrabold mt-1" style={{ color: C.mid }}>{brl(it.val)}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <Card>
        <h3 className="font-extrabold text-lg mb-4">Todos os leads</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider" style={{ color: C.textMid }}>
              <th className="py-2">Nome</th><th>Valor</th><th>Status</th><th>Origem</th><th>Potencial</th>
            </tr>
          </thead>
          <tbody>
            {DB.leads.map((l, i) => (
              <tr key={i} className="border-t" style={{ borderColor: C.beigeLight }}>
                <td className="py-3 font-semibold">{l.name}</td>
                <td className="font-extrabold" style={{ color: C.mid }}>{brl(l.val)}</td>
                <td><TagBadge label={StatusLabel(l.status)} variant={l.status} /></td>
                <td style={{ color: C.textMid }}>{l.origem}</td>
                <td style={{ color: C.textMid }}>{l.potencial}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}

function FinancasPage() {
  const { openCreate } = useCrud();
  const totalE = DB.entradas.reduce((s, e) => s + e.val, 0);
  const totalS = DB.saidas.reduce((s, e) => s + e.val, 0);
  const lucro = totalE - totalS;
  const margem = totalE > 0 ? Math.round((lucro / totalE) * 100) : 0;
  return (
    <>
      <PageHeader eyebrow="Finanças" title="Junho" accent="2026"
        actions={<PillBtn onClick={() => openCreate("lancamento")}><Plus size={14} className="inline mr-1" /> Lançamento</PillBtn>} />

      <div className="grid grid-cols-3 gap-5 mb-6">
        <MetricCard variant="hero" value={brl(totalE)} label="Entradas" delta="↑ vs maio" />
        <MetricCard value={brl(totalS)} label="Saídas" delta="↑ 8% vs maio" deltaType="down" />
        <MetricCard variant="accent" value={brl(lucro)} label="Lucro líquido" delta={`Margem ${margem}%`} deltaType="neutral" />
      </div>
      <div className="grid grid-cols-2 gap-5">
        <Card>
          <h3 className="font-extrabold text-lg mb-4">Entradas do mês</h3>
          <div className="space-y-2">
            {DB.entradas.map((e, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-[10px]" style={{ background: C.beigeLight }}>
                <div>
                  <div className="font-semibold">{e.name}</div>
                  <div className="text-xs" style={{ color: C.textMid }}>{e.cat}</div>
                </div>
                <div className="font-extrabold" style={{ color: "#2E7D32" }}>+{brl(e.val)}</div>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <h3 className="font-extrabold text-lg mb-4">Saídas do mês</h3>
          <div className="space-y-2">
            {DB.saidas.map((e, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-[10px]" style={{ background: C.beigeLight }}>
                <div>
                  <div className="font-semibold">{e.name}</div>
                  <div className="text-xs" style={{ color: C.textMid }}>{e.cat}</div>
                </div>
                <div className="font-extrabold" style={{ color: "#C8351A" }}>-{brl(e.val)}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}

function SocialPage() {
  return (
    <>
      <PageHeader eyebrow="Meta Business + Instagram" title="Métricas" accent="sociais"
        badges={<><LiveBadge label="Meta Business" /><LiveBadge label="Instagram" /></>}
      />
      <div className="grid grid-cols-4 gap-5 mb-6">
        {DB.redesSociais.map((r) => (
          <Card key={r.plat} dark={r.dark}>
            <div className="font-extrabold text-lg">{r.plat}</div>
            <div className="text-xs opacity-70">{r.handle}</div>
            <div className="mt-4 text-3xl font-extrabold" style={{ letterSpacing: "-0.03em" }}>{r.followers}</div>
            <div className="text-xs opacity-70 mb-3">Engajamento {r.eng} · Alcance {r.reach}</div>
            <GoldProgress pct={r.pct} />
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-5 gap-5 mb-6">
        <div className="col-span-3">
          <Card>
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
                { n:"Seguidores IG", s:"Meta 1.500 · Atual 1.141", p:78 },
                { n:"Engajamento médio", s:"Meta 5% · Atual 4,2%", p:84 },
                { n:"Reels publicados", s:"Meta 20 · Atual 14", p:70 },
                { n:"Leads via DM", s:"Meta 30 · Atual 18", p:60 },
              ].map((m, i) => (
                <div key={i}>
                  <div className="flex justify-between mb-1.5">
                    <div>
                      <div className="font-semibold text-sm">{m.n}</div>
                      <div className="text-xs opacity-70">{m.s}</div>
                    </div>
                    <span className="rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ background: C.gold, color: C.dark }}>{m.p}%</span>
                  </div>
                  <GoldProgress pct={m.p} />
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

function EstrategiaPage() {
  const { openCreate } = useCrud();
  return (
    <>
      <PageHeader eyebrow="Estratégia de Conteúdo" title="Clientes" accent="ativos"
        actions={<PillBtn onClick={() => openCreate("estrategia")}><Plus size={14} className="inline mr-1" /> Nova estratégia</PillBtn>} />

      <div className="grid grid-cols-3 gap-5 mb-6">
        {DB.clientes.filter(c => c.status === "ativo").map(c => (
          <Card key={c.id}>
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-[10px] font-extrabold text-lg" style={{ background: C.beige, color: C.dark }}>{c.init}</div>
              <div className="min-w-0">
                <div className="font-extrabold truncate">{c.name}</div>
                <div className="text-xs" style={{ color: C.textMid }}>{c.pkg}</div>
              </div>
            </div>
            <div className="mt-4 space-y-1.5 text-sm">
              <div className="flex justify-between"><span style={{ color: C.textMid }}>Pilares</span><span className="font-semibold">Educativo · Vendas</span></div>
              <div className="flex justify-between"><span style={{ color: C.textMid }}>Entregáveis</span><span className="font-semibold">{c.posts}/mês</span></div>
              <div className="flex justify-between"><span style={{ color: C.textMid }}>Formato</span><span className="font-semibold">Reels · Carrossel</span></div>
            </div>
          </Card>
        ))}
        <div className="rounded-[18px] border-2 border-dashed flex flex-col items-center justify-center p-6 text-center transition-all hover:-translate-y-0.5"
          style={{ borderColor: C.beige, color: C.textMid }}>
          <Plus size={28} />
          <div className="mt-2 font-semibold">Nova estratégia</div>
        </div>
      </div>
      <Card>
        <h3 className="font-extrabold text-lg mb-4">Conteúdos planejados</h3>
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs uppercase tracking-wider" style={{ color: C.textMid }}>
            <th className="py-2">Conteúdo</th><th>Cliente</th><th>Data</th><th>Rede</th><th>Status</th>
          </tr></thead>
          <tbody>
            {DB.ideias.map((it, i) => (
              <tr key={i} className="border-t" style={{ borderColor: C.beigeLight }}>
                <td className="py-3 font-semibold">{it.title}</td>
                <td>{DB.clientes[i % DB.clientes.length].name}</td>
                <td style={{ color: C.textMid }}>{20 + i} Jun</td>
                <td>Instagram</td>
                <td><TagBadge label={i % 2 ? "Pendente" : "Ativo"} variant={i % 2 ? "pendente" : "ativo"} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}

function OficinaPage() {
  return (
    <>
      <PageHeader eyebrow="Oficina de Conteúdo" title="Criação &" accent="aprovação"
        actions={<PillBtn><Plus size={14} className="inline mr-1" /> Nova ideia</PillBtn>} />
      <div className="grid grid-cols-4 gap-5 mb-6">
        <MetricCard value={12} label="Ideias na fila" />
        <MetricCard variant="hero" value={8} label="Em produção" />
        <MetricCard variant="accent" value={38} label="Aprovados" />
        <MetricCard value={34} label="Publicados" />
      </div>
      <SectionLabel>Ideias em destaque</SectionLabel>
      <div className="grid grid-cols-3 gap-5 mb-6">
        {DB.ideias.map((it, i) => (
          <Card key={i} dark={it.dark}>
            <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: it.dark ? C.gold : C.mid }}>{it.tag}</div>
            <div className="mt-2 font-extrabold text-lg leading-snug">{it.title}</div>
            <div className="mt-1 text-xs opacity-70">{it.sub}</div>
          </Card>
        ))}
      </div>
      <Card>
        <h3 className="font-extrabold text-lg mb-4">Pipeline de produção</h3>
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs uppercase tracking-wider" style={{ color: C.textMid }}>
            <th className="py-2">Conteúdo</th><th>Cliente</th><th>Formato</th><th>Status</th>
          </tr></thead>
          <tbody>
            {DB.ideias.map((it, i) => (
              <tr key={i} className="border-t" style={{ borderColor: C.beigeLight }}>
                <td className="py-3 font-semibold">{it.title}</td>
                <td>{DB.clientes[i % DB.clientes.length].name}</td>
                <td>{it.tag.split("·")[1]?.trim() || "Post"}</td>
                <td><TagBadge label={i % 3 === 0 ? "Aprovado" : "Pendente"} variant={i % 3 === 0 ? "ativo" : "pendente"} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}

function SwipePage() {
  const links = [
    { e:"🎯", n:"Hooks virais", s:"Coleção 2026" },
    { e:"💎", n:"CTAs convertentes", s:"50 modelos" },
    { e:"📝", n:"Headlines salvos", s:"Copy direto" },
    { e:"🎨", n:"Refs visuais", s:"Moodboards" },
    { e:"🔥", n:"Reels virais", s:"Análises" },
    { e:"📊", n:"Cases reais", s:"Estudo de caso" },
    { e:"💡", n:"Frameworks", s:"Copy + design" },
  ];
  return (
    <>
      <PageHeader eyebrow="Swipe File" title="Links &" accent="referências"
        actions={<PillBtn><Plus size={14} className="inline mr-1" /> Adicionar</PillBtn>} />
      <SectionLabel>Links úteis</SectionLabel>
      <div className="grid grid-cols-4 gap-5 mb-6">
        {links.map((l, i) => (
          <Card key={i} className="!p-0 overflow-hidden">
            <div className="p-6 text-3xl" style={{ background: C.beige }}>{l.e}</div>
            <div className="p-4">
              <div className="font-extrabold">{l.n}</div>
              <div className="text-xs" style={{ color: C.textMid }}>{l.s}</div>
            </div>
          </Card>
        ))}
        <div className="rounded-[18px] border-2 border-dashed flex flex-col items-center justify-center p-6 text-center"
          style={{ borderColor: C.beige, color: C.textMid }}>
          <Plus size={28} /><div className="mt-2 font-semibold">Adicionar</div>
        </div>
      </div>
      <SectionLabel>Material de apoio</SectionLabel>
      <div className="grid grid-cols-2 gap-5">
        {[
          { t:"Templates Canva", items: [["🎨","Carrossel base","10 templates"],["📱","Stories pack","20 layouts"],["🎬","Capas Reels","15 modelos"]] },
          { t:"Recursos", items: [["🖼️","Fotos brand","Banco interno"],["🎵","Áudios virais","Coleção"],["📐","Grade IG","Auxiliar"]] },
        ].map((s, i) => (
          <Card key={i}>
            <h3 className="font-extrabold text-lg mb-4">{s.t}</h3>
            <div className="space-y-2">
              {s.items.map((it, j) => (
                <div key={j} className="flex items-center justify-between p-3 rounded-[10px]" style={{ background: C.beigeLight }}>
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{it[0]}</span>
                    <div><div className="font-semibold">{it[1]}</div><div className="text-xs" style={{ color: C.textMid }}>{it[2]}</div></div>
                  </div>
                  <ArrowRight size={16} style={{ color: C.textMid }} />
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}

function PromptsPage() {
  const frameworks = DB.prompts.slice(0, 4);
  const ia = DB.prompts.slice(4, 8);
  const mj = [
    { label:"MidJourney · v6", title:"Prompt MJ Lifestyle", preview:"Editorial lifestyle photo, brand colors, soft golden light, marble surface --ar 4:5 --v 6", dark:true },
    { label:"MidJourney · v6", title:"Prompt MJ Produto", preview:"Hero product shot, premium minimal, studio lighting, beige backdrop --ar 1:1 --v 6", dark:false },
  ];
  const render = (list: typeof DB.prompts) => (
    <div className="grid grid-cols-2 gap-5 mb-6">
      {list.map((p, i) => (
        <Card key={i} dark={p.dark}>
          <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: p.dark ? C.gold : C.mid }}>{p.label}</div>
          <div className="mt-2 font-extrabold text-lg">{p.title}</div>
          <div className="mt-2 text-sm opacity-80 overflow-hidden" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{p.preview}</div>
        </Card>
      ))}
    </div>
  );
  return (
    <>
      <PageHeader eyebrow="Biblioteca de Prompts IA" title="Prompts &" accent="frameworks"
        actions={<PillBtn><Plus size={14} className="inline mr-1" /> Novo prompt</PillBtn>} />
      <SectionLabel>Frameworks de copy</SectionLabel>
      {render(frameworks)}
      <SectionLabel>Prompts Mestre IA</SectionLabel>
      {render(ia)}
      <SectionLabel>MidJourney</SectionLabel>
      {render(mj)}
    </>
  );
}


function FerramentasPage() {
  const custo = DB.ferramentas.reduce((s, f) => {
    const m = /R\$(\d+)/.exec(f.cat); return s + (m ? Number(m[1]) : 0);
  }, 0);
  return (
    <>
      <PageHeader eyebrow="Ferramentas" title="Links &" accent="recursos"
        badges={<LiveBadge label="Conectar nova" />} />
      <div className="grid grid-cols-3 gap-5 mb-6">
        <MetricCard variant="hero" value={DB.integracoes.length} label="Integrações ativas" />
        <MetricCard value={DB.ferramentas.length} label="Ferramentas" />
        <MetricCard variant="accent" value={brl(custo)} label="Custo mensal" deltaType="neutral" />
      </div>
      <div className="grid grid-cols-2 gap-5">
        <Card>
          <h3 className="font-extrabold text-lg mb-4">Integrações ativas</h3>
          <div className="space-y-3">
            {DB.integracoes.map((it, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-[10px]" style={{ background: C.beigeLight }}>
                <div className="flex items-center gap-3">
                  <span className="text-xl">{it.ico}</span>
                  <div><div className="font-semibold">{it.name}</div><div className="text-xs" style={{ color: C.textMid }}>{it.desc}</div></div>
                </div>
                {it.live && <LiveBadge label="Live" />}
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <h3 className="font-extrabold text-lg mb-4">Ferramentas do workflow</h3>
          <div className="space-y-3">
            {DB.ferramentas.map((f, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-[10px]" style={{ background: C.beigeLight }}>
                <div className="flex items-center gap-3">
                  <span className="text-xl">{f.ico}</span>
                  <div><div className="font-semibold">{f.name}</div><div className="text-xs" style={{ color: C.textMid }}>{f.cat}</div></div>
                </div>
                <ArrowRight size={16} style={{ color: C.textMid }} />
              </div>
            ))}
          </div>
        </Card>
      </div>
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
  const [tab, setTab] = useState("integracoes");
  return (
    <>
      <PageHeader eyebrow="Sistema" title="Configurações &" accent="conta" />
      <TabBar
        active={tab}
        onChange={setTab}
        tabs={[
          { key: "integracoes", label: "Integrações" },
          { key: "juridico",    label: "Jurídico" },
          { key: "equipe",      label: "Equipe" },
          { key: "planos",      label: "Planos & Conta" },
        ]}
      />
      {tab === "integracoes" && (
        <Card>
          <h3 className="font-extrabold text-lg mb-4">Integrações ativas</h3>
          <div className="space-y-3">
            {DB.integracoes.map((it, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-[10px]" style={{ background: C.beigeLight }}>
                <div className="flex items-center gap-3">
                  <span className="text-xl">{it.ico}</span>
                  <div>
                    <div className="font-semibold">{it.name}</div>
                    <div className="text-xs" style={{ color: C.textMid }}>{it.desc}</div>
                  </div>
                </div>
                {it.live && <LiveBadge label="Live" />}
              </div>
            ))}
          </div>
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
          <h3 className="font-extrabold text-lg mb-2">Planos & Conta</h3>
          <p className="text-sm" style={{ color: C.textMid }}>Em breve: gestão de plano, faturamento e dados da conta.</p>
        </Card>
      )}
    </>
  );
}

/* ---------- Shell ---------- */
export default function Painel360() {
  const [active, setActive] = useState<PageKey>("dash");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [clienteId, setClienteId] = useState<number>(DB.clientes[0].id);
  const [viewMode, setViewMode] = useState<"gestao" | "cliente">("gestao");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [active, viewMode]);

  if (viewMode === "cliente") {
    const cliente = DB.clientes.find(c => c.id === clienteId) ?? DB.clientes[0];
    return (
      <div className="h-screen overflow-y-auto" style={{ background: C.bg }}>
        <PortalCliente cliente={cliente} onExit={() => setViewMode("gestao")} />
      </div>
    );
  }

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
          {active === "central" && (
            <CentralClientePage
              selectedId={clienteId}
              setSelectedId={setClienteId}
              enterPortal={() => setViewMode("cliente")}
            />
          )}
        </div>
      </main>
    </div>
  );
}
