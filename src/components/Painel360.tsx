import { useMemo, useState, useRef, useEffect, type ReactNode, type CSSProperties } from "react";
import {
  LayoutDashboard, Calendar, Users, TrendingUp, CreditCard, Instagram,
  Lightbulb, PenLine, Bookmark, Bot, BookOpen, Wrench, Plus, Zap, ArrowRight,
} from "lucide-react";

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
  livros: [
    { t:"Charlie Munger: O Investidor Completo", c:"Investimentos", s:"done" },
    { t:"Greats CEOs are Lazy",                  c:"Design",        s:"buy"  },
    { t:"Seja Útil — Arnold Schwarzenegger",     c:"Dev. Pessoal",  s:"pend" },
    { t:"A Fórmula do YouTube",                  c:"Marketing",     s:"pend" },
    { t:"O Investidor Inteligente",              c:"Investimentos", s:"pend" },
    { t:"Antifrágil — Nassim Taleb",             c:"Dev. Pessoal",  s:"buy"  },
    { t:"A Lógica do Cisne Negro",               c:"Dev. Pessoal",  s:"buy"  },
    { t:"O Design como Storytelling",            c:"Design",        s:"pend" },
    { t:"SQL Guia Prático",                      c:"Programação",   s:"pend" },
    { t:"Um Café com Sêneca",                    c:"Dev. Pessoal",  s:"pend" },
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
    <div className="mb-8 flex items-end justify-between gap-6 flex-wrap">
      <div>
        <Eyebrow>{eyebrow}</Eyebrow>
        <H1>
          {title}{" "}
          {accent && <em className="not-italic" style={{ color: C.textMuted, fontStyle: "italic", fontWeight: 500 }}>{accent}</em>}
        </H1>
        {badges && <div className="mt-4 flex gap-2 flex-wrap">{badges}</div>}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}

/* ---------- Sidebar ---------- */
type PageKey =
  | "dash" | "agenda" | "clientes" | "crm" | "financas" | "social"
  | "estrategia" | "oficina" | "swipe" | "prompts" | "estudo" | "ferramentas";

const NAV: { key: PageKey; label: string; icon: typeof LayoutDashboard }[] = [
  { key: "dash", label: "Dashboard", icon: LayoutDashboard },
  { key: "agenda", label: "Agenda", icon: Calendar },
  { key: "clientes", label: "Clientes", icon: Users },
  { key: "crm", label: "CRM", icon: TrendingUp },
  { key: "financas", label: "Finanças", icon: CreditCard },
  { key: "social", label: "Social Media", icon: Instagram },
  { key: "estrategia", label: "Estratégia", icon: Lightbulb },
  { key: "oficina", label: "Oficina", icon: PenLine },
  { key: "swipe", label: "Swipe File", icon: Bookmark },
  { key: "prompts", label: "Prompts IA", icon: Bot },
  { key: "estudo", label: "Estudo", icon: BookOpen },
  { key: "ferramentas", label: "Ferramentas", icon: Wrench },
];

function Sidebar({ active, setActive }: { active: PageKey; setActive: (p: PageKey) => void }) {
  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-16 flex-col items-center justify-between py-4"
      style={{ background: C.dark }}>
      <div className="flex flex-col items-center gap-1">
        {NAV.map((n) => {
          const Icon = n.icon;
          const isActive = active === n.key;
          return (
            <button key={n.key} onClick={() => setActive(n.key)}
              className="group relative flex h-10 w-10 items-center justify-center rounded-lg transition-colors"
              style={{ background: isActive ? C.gold : "transparent", color: isActive ? C.dark : "rgba(255,255,255,0.7)" }}>
              <Icon size={18} strokeWidth={2} />
              <span className="pointer-events-none absolute left-12 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md px-2 py-1 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity z-50"
                style={{ background: C.text, color: "#fff" }}>
                {n.label}
              </span>
            </button>
          );
        })}
      </div>
      <div className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-extrabold"
        style={{ background: `linear-gradient(135deg, ${C.mid}, ${C.gold})`, color: "#fff" }}>
        T
      </div>
    </aside>
  );
}

/* ---------- helpers ---------- */
function StatusLabel(s: string) {
  return { ativo: "Ativo", atencao: "Atenção", proposta: "Proposta", quente: "Quente", frio: "Frio", negociando: "Negociando" }[s] ?? s;
}

/* ---------- PAGES ---------- */
function DashboardPage({ go }: { go: (p: PageKey) => void }) {
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
          <PillBtn><Plus size={14} className="inline mr-1" /> Nova tarefa</PillBtn>
        </>}
      />
      <div className="grid grid-cols-4 gap-5 mb-6">
        <MetricCard variant="hero"    value={brl(faturamento)}   label="Faturamento" delta="↑ 12% vs maio" />
        <MetricCard                    value={clientesAtivos}     label="Clientes ativos" delta="↑ 1 novo" />
        <MetricCard variant="accent"   value={postsEntregues}     label="Posts entregues" delta="de 42 previstos" deltaType="neutral" />
        <MetricCard                    value={DB.leads.length}    label="Leads pipeline" delta="↓ 2 perdidos" deltaType="down" />
      </div>

      <div className="grid grid-cols-5 gap-5 mb-6">
        <div className="col-span-3">
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
        <div className="col-span-2">
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

      <div className="grid grid-cols-5 gap-5">
        <div className="col-span-3">
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
        <div className="col-span-2">
          <Card>
            <h3 className="font-extrabold text-lg mb-4">Acesso rápido</h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { e:"📅", n:"Agenda", s:"Hoje", k:"agenda" as PageKey },
                { e:"👥", n:"Clientes", s:`${clientesAtivos} ativos`, k:"clientes" as PageKey },
                { e:"📈", n:"CRM", s:`${DB.leads.length} leads`, k:"crm" as PageKey },
                { e:"💳", n:"Finanças", s:"Junho", k:"financas" as PageKey },
                { e:"💡", n:"Estratégia", s:"Conteúdo", k:"estrategia" as PageKey },
                { e:"🤖", n:"Prompts IA", s:"Frameworks", k:"prompts" as PageKey },
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

function AgendaPage() {
  const hoje = DB.agenda.filter(a => a.data === "Hoje");
  const semana = DB.agenda.filter(a => a.data !== "Hoje");
  return (
    <>
      <PageHeader eyebrow="Google Agenda" title="Planejamento" accent="semanal"
        badges={<LiveBadge label="Google Calendar" />}
        actions={<PillBtn><Plus size={14} className="inline mr-1" /> Novo evento</PillBtn>} />
      <div className="grid grid-cols-2 gap-5 mb-6">
        <Card>
          <h3 className="font-extrabold text-lg mb-4">Hoje — Qui, 26 Jun</h3>
          <div className="space-y-3">
            {hoje.map((e, i) => (
              <div key={i} className="flex gap-4 items-stretch">
                <div className="min-w-[64px]">
                  <div className="font-extrabold">{e.time}</div>
                  <div className="text-xs" style={{ color: C.textMid }}>{e.dur}</div>
                </div>
                <div className="w-[3px] rounded-full" style={{ background: DOT_COLORS[e.cor] }} />
                <div className="flex-1 min-w-0">
                  <div className="font-bold truncate">{e.name}</div>
                  <div className="text-xs" style={{ color: C.textMid }}>{e.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card dark>
          <h3 className="font-extrabold text-lg mb-4">Esta semana</h3>
          <div className="space-y-3">
            {semana.map((e, i) => (
              <div key={i} className="flex items-center justify-between rounded-[10px] p-3" style={{ background: "rgba(255,255,255,0.06)" }}>
                <div className="min-w-0">
                  <div className="font-semibold truncate">{e.name}</div>
                  <div className="text-xs opacity-70">{e.data} · {e.time}</div>
                </div>
                <span className="rounded-full px-2.5 py-1 text-[11px] font-bold uppercase" style={{ background: DOT_COLORS[e.cor], color: "#fff" }}>
                  {e.cor === "red" ? "Urgente" : e.cor === "amber" ? "Atenção" : e.cor === "blue" ? "Novo" : "Planejado"}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <Card>
        <h3 className="font-extrabold text-lg mb-4">Tarefas da semana</h3>
        <div className="space-y-3">
          {DB.agenda.slice(0, 5).map((t, i) => (
            <div key={i} className="flex items-center justify-between rounded-[10px] p-3" style={{ background: C.beigeLight }}>
              <div className="flex items-center gap-3 min-w-0">
                <Dot color={t.cor} />
                <span className="font-semibold truncate">{t.name}</span>
              </div>
              <TagBadge label={t.data} variant={t.cor === "red" ? "quente" : t.cor === "amber" ? "atencao" : "pendente"} />
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

function ClientesPage() {
  const ativos = DB.clientes.filter(c => c.status === "ativo").length;
  const maxVal = Math.max(...DB.clientes.map(c => c.val));
  return (
    <>
      <PageHeader eyebrow="Clientes" title={`${ativos} clientes`} accent="ativos"
        actions={<PillBtn><Plus size={14} className="inline mr-1" /> Novo cliente</PillBtn>} />
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
        actions={<PillBtn><Plus size={14} className="inline mr-1" /> Novo lead</PillBtn>} />
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
  const totalE = DB.entradas.reduce((s, e) => s + e.val, 0);
  const totalS = DB.saidas.reduce((s, e) => s + e.val, 0);
  const lucro = totalE - totalS;
  const margem = totalE > 0 ? Math.round((lucro / totalE) * 100) : 0;
  return (
    <>
      <PageHeader eyebrow="Finanças" title="Junho" accent="2026"
        actions={<PillBtn><Plus size={14} className="inline mr-1" /> Lançamento</PillBtn>} />
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
  return (
    <>
      <PageHeader eyebrow="Estratégia de Conteúdo" title="Clientes" accent="ativos"
        actions={<PillBtn><Plus size={14} className="inline mr-1" /> Nova estratégia</PillBtn>} />
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

function EstudoPage() {
  const total = DB.livros.length;
  const done = DB.livros.filter(b => b.s === "done").length;
  const buy = DB.livros.filter(b => b.s === "buy").length;
  const sLabel: Record<string, string> = { done: "Lido", buy: "Comprar", pend: "Pendente" };
  return (
    <>
      <PageHeader eyebrow="Estudo" title="Livros &" accent="aprendizado"
        actions={<PillBtn><Plus size={14} className="inline mr-1" /> Adicionar livro</PillBtn>} />
      <div className="grid grid-cols-3 gap-5 mb-6">
        <MetricCard variant="hero" value={total} label="Total" />
        <MetricCard variant="accent" value={done} label="Finalizados" />
        <MetricCard value={buy} label="Para comprar" />
      </div>
      <Card>
        <h3 className="font-extrabold text-lg mb-4">Lista de leitura</h3>
        <div className="space-y-2">
          {DB.livros.map((b, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-[10px]" style={{ background: C.beigeLight }}>
              <div>
                <div className="font-semibold">{b.t}</div>
                <div className="text-xs" style={{ color: C.textMid }}>{b.c}</div>
              </div>
              <TagBadge label={sLabel[b.s]} variant={b.s} />
            </div>
          ))}
        </div>
      </Card>
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

/* ---------- Shell ---------- */
export default function Painel360() {
  const [active, setActive] = useState<PageKey>("dash");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [active]);

  return (
    <div className="h-screen overflow-hidden flex" style={{ background: C.bg, color: C.text }}>
      <Sidebar active={active} setActive={setActive} />
      <main ref={scrollRef} className="flex-1 ml-16 overflow-y-auto">
        <div className="mx-auto max-w-[1400px] p-8">
          {active === "dash" && <DashboardPage go={setActive} />}
          {active === "agenda" && <AgendaPage />}
          {active === "clientes" && <ClientesPage />}
          {active === "crm" && <CRMPage />}
          {active === "financas" && <FinancasPage />}
          {active === "social" && <SocialPage />}
          {active === "estrategia" && <EstrategiaPage />}
          {active === "oficina" && <OficinaPage />}
          {active === "swipe" && <SwipePage />}
          {active === "prompts" && <PromptsPage />}
          {active === "estudo" && <EstudoPage />}
          {active === "ferramentas" && <FerramentasPage />}
        </div>
      </main>
    </div>
  );
}
