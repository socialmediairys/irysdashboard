import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Video,
  Headphones,
  FileText,
  ChevronDown,
  ChevronRight,
  Play,
  Pause,
  Instagram,
  FolderOpen,
  CheckCircle2,
  Circle,
  ExternalLink,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

/* ---------- design tokens (Notion-like, mesmo do Painel360) ---------- */
const C = {
  dark: "#2C1505",
  mid: "#7A4A18",
  gold: "#C9A46E",
  beige: "#E8D8C0",
  beigeLight: "#F5EEE5",
  bg: "#EDEAE5",
  text: "#1A0A02",
  textMid: "#7A6050",
  textMuted: "#BBA898",
};
const SHADOW = "0 2px 16px rgba(44,21,5,0.09)";

/* ---------- tipos ---------- */
export type Fase = { id: number; nome: string; descricao: string | null };
export type Topico = { id: string; fase_id: number; nome: string; ordem: number };
export type ConteudoTipo = "video" | "audio" | "documento" | "link";
export type Conteudo = { 
  id: string; 
  topico_id: string; 
  tipo: ConteudoTipo; 
  titulo: string | null; 
  url: string | null;
  descricao?: string | null;
  fase_id?: number;
  topicos_fase?: { nome: string } | null;
};
export type ClientePortal = {
  id: string;
  nome: string;
  plano: string | null;
  status?: string | null;
  status_cadastro?: string | null;
};

/* ---------- conteúdo fixo (mesmo do design original do portal) ---------- */
const ETAPAS_TIMELINE = [
  { fase: 1, nome: "Onboarding & Alinhamento Base", desc: "Assinatura do contrato, liberação de acessos no cofre e alinhamento inicial.", subitens: ["Contrato", "Cofre", "Briefing", "Onboarding"], ativa: true },
  { fase: 2, nome: "Diagnóstico de Perfil & Análise de Concorrentes", desc: "Investigação profunda do seu mercado, auditoria de Instagram e mapeamento.", subitens: ["Diagnóstico de Perfil", "Análise de Concorrentes"], ativa: false },
  { fase: 3, nome: "Universo Visual & Identidade Verbal", desc: "Definição da estética da sua marca pessoal (cores, tipografias, fotos premium) e tom de voz.", subitens: ["Estética", "Tom de Voz", "Drive"], ativa: false },
  { fase: 4, nome: "Estratégia de Conteúdo & Funil de Vendas", desc: "Criação do seu primeiro cronograma oficial de postagens estruturado para gerar desejo.", subitens: ["Cronograma 1", "Funil de Vendas"], ativa: false },
  { fase: 5, nome: "Produção, Gravações & Aprovação", desc: "Envio de roteiros rápidos, edição impecável por nossa conta e validação final.", subitens: ["Roteiros", "Edição", "Vídeos"], ativa: false },
  { fase: 6, nome: "Análise de Métricas & Próximo Ciclo", desc: "Reunião mensal de fechamento. Analisamos o crescimento e desenhamos o próximo mês.", subitens: ["Reunião 1", "Apresentação"], ativa: false },
];

const BLOQUEADORES = [
  { n: 1, t: "Panfletagem digital", sub: "Excesso de posts de venda direta", por: "O algoritmo penaliza perfis que só vendem. Sem entregar valor, o feed perde alcance e o público se desconecta — vira ruído comercial." },
  { n: 2, t: "Uso de linguagem muito técnica", sub: "Explicar termos clínicos sem traduzir para benefícios reais", por: "A paciente não compra procedimento, compra transformação. Termos técnicos afastam quem ainda não entende o que precisa." },
  { n: 3, t: "Perfil 'fantasma'", sub: "Falta de humanização e bastidores reais nos stories", por: "Sem rosto, sem voz e sem rotina, o perfil vira catálogo. A conexão humana é o que gera desejo e confiança para agendar." },
  { n: 4, t: "Falta de consistência e ritmo", sub: "Postagens instáveis e quebra de algoritmo", por: "O algoritmo recompensa frequência. Sumir por semanas zera o aquecimento da conta e força recomeçar do zero." },
  { n: 5, t: "Atração de público errado", sub: "Trends sem nexo ou puramente por curtidas vazias", por: "Viralizar com público que nunca vai te contratar infla vaidade, mas não gera agenda. Métrica que importa é qualificação." },
  { n: 6, t: "Link da bio quebrado ou complexo", sub: "Falta de canal direto facilitado para WhatsApp", por: "Cada clique a mais é uma paciente perdida. Link direto, sem intermediários, é o que converte interesse em agendamento." },
];

const JORNADA = [
  { t: "Topo de Funil", s: "Atração · Público Frio", c: "#DDE9F2", fg: "#1E4F7A" },
  { t: "Meio de Funil", s: "Conexão/Consideração · Público Morno", c: "#FFF3CD", fg: "#8A6914" },
  { t: "Base de Funil", s: "Conversão · Público Quente", c: "#FFE5D9", fg: "#A8431E" },
];

/* ---------- átomos visuais ---------- */
function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: C.textMid }}>
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="text-[11px] font-bold uppercase tracking-[0.18em] mb-2" style={{ color: C.mid }}>
      {children}
    </div>
  );
}

function TagBadge({ label }: { label: string }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
      style={{ background: C.beigeLight, color: C.mid, border: `1px solid ${C.beige}` }}
    >
      {label}
    </span>
  );
}

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-[18px] p-5 sm:p-6 ${className}`} style={{ background: "#fff", boxShadow: SHADOW }}>
      {children}
    </div>
  );
}

/* ---------- Áudio player ---------- */
function AudioItem({
  id,
  title,
  desc,
  url,
  activeId,
  setActiveId,
}: {
  id: string;
  title: string;
  desc: string;
  url: string | null;
  activeId: string | null;
  setActiveId: (id: string | null) => void;
}) {
  const isPlaying = activeId === id;
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.play().catch(() => {
        // autoplay pode ser bloqueado pelo navegador; usuário pode tentar de novo
        setActiveId(null);
      });
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    if (!isPlaying) setProgress(0);
  }, [isPlaying]);

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    setProgress((audio.currentTime / audio.duration) * 100);
  };

  const handleEnded = () => {
    setProgress(0);
    setActiveId(null);
  };

  return (
    <div className="rounded-[14px] p-3 sm:p-4 flex items-center gap-3 sm:gap-4" style={{ background: "#fff", boxShadow: SHADOW }}>
      {url && (
        <audio
          ref={audioRef}
          src={url}
          preload="none"
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
        />
      )}
      <button
        type="button"
        disabled={!url}
        onClick={() => setActiveId(isPlaying ? null : id)}
        className="h-11 w-11 sm:h-12 sm:w-12 rounded-full flex items-center justify-center shrink-0 transition-transform hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ background: isPlaying ? C.gold : C.dark, color: isPlaying ? C.dark : "#fff" }}
        aria-label={isPlaying ? "Pausar" : "Reproduzir"}
      >
        {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <div className="font-semibold truncate text-sm" style={{ color: C.text }}>{title}</div>
        </div>
        {desc && <div className="text-[11px] sm:text-xs mt-0.5 mb-2 line-clamp-2" style={{ color: C.textMid }}>{desc}</div>}
        <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: C.beigeLight }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${C.mid}, ${C.gold})` }} />
        </div>
      </div>
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-[11px] font-semibold underline"
          style={{ color: C.mid }}
        >
          Abrir
        </a>
      ) : null}
    </div>
  );
}

function iconeConteudo(tipo: ConteudoTipo) {
  if (tipo === "video") return Video;
  if (tipo === "audio") return Headphones;
  return FileText;
}

function rotuloPadrao(tipo: ConteudoTipo) {
  if (tipo === "video") return "Assistir vídeo";
  if (tipo === "audio") return "Ouvir áudio";
  return "Ver documento";
}

/* ---------- Detecção de origem do vídeo → URL embed ---------- */
function toEmbedUrl(rawUrl: string): { kind: "iframe" | "video"; src: string } {
  try {
    const u = new URL(rawUrl);
    const host = u.hostname.replace(/^www\./, "");
    // YouTube
    if (host === "youtu.be") {
      return { kind: "iframe", src: `https://www.youtube.com/embed/${u.pathname.replace(/^\//, "")}` };
    }
    if (host.endsWith("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return { kind: "iframe", src: `https://www.youtube.com/embed/${v}` };
      const m = u.pathname.match(/^\/(embed|shorts)\/([^/]+)/);
      if (m) return { kind: "iframe", src: `https://www.youtube.com/embed/${m[2]}` };
    }
    // Loom
    if (host.endsWith("loom.com")) {
      const m = u.pathname.match(/\/(share|embed)\/([^/?]+)/);
      if (m) return { kind: "iframe", src: `https://www.loom.com/embed/${m[2]}` };
    }
    // Vimeo
    if (host.endsWith("vimeo.com")) {
      const m = u.pathname.match(/\/(\d+)/);
      if (m) return { kind: "iframe", src: `https://player.vimeo.com/video/${m[1]}` };
    }
    // Google Drive
    if (host.endsWith("drive.google.com")) {
      const m = u.pathname.match(/\/file\/d\/([^/]+)/);
      const id = m?.[1] || u.searchParams.get("id");
      if (id) return { kind: "iframe", src: `https://drive.google.com/file/d/${id}/preview` };
    }
  } catch {
    // não é URL válida — trata como arquivo direto
  }
  return { kind: "video", src: rawUrl };
}

/* ---------- Modal para vídeo/áudio inline ---------- */
function MediaModal({
  open,
  onOpenChange,
  tipo,
  url,
  titulo,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  tipo: "video" | "audio";
  url: string | null;
  titulo: string;
}) {
  if (!url) return null;
  const embed = tipo === "video" ? toEmbedUrl(url) : null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden bg-black border-0">
        <VisuallyHidden>
          <DialogTitle>{titulo}</DialogTitle>
        </VisuallyHidden>
        {tipo === "video" && embed?.kind === "iframe" && (
          <div className="relative w-full" style={{ aspectRatio: "16 / 9" }}>
            <iframe
              src={embed.src}
              title={titulo}
              className="absolute inset-0 h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
            />
          </div>
        )}
        {tipo === "video" && embed?.kind === "video" && (
          <video src={embed.src} controls autoPlay className="w-full h-auto max-h-[80vh] bg-black" />
        )}
        {tipo === "audio" && (
          <div className="bg-[#2C1505] p-6 flex flex-col gap-3">
            <div className="text-sm font-semibold text-white truncate">{titulo}</div>
            <audio src={url} controls autoPlay className="w-full" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Fase accordion ---------- */
function FaseAccordion({
  fase,
  nome,
  desc,
  topicos,
  conteudosPorTopico,
  ativa,
  open,
  onToggle,
  onOpenMedia,
}: {
  fase: number;
  nome: string;
  desc: string;
  topicos: Topico[];
  conteudosPorTopico: Record<string, Conteudo[]>;
  ativa: boolean;
  open: boolean;
  onToggle: () => void;
  onOpenMedia: (c: Conteudo) => void;
}) {
  const count = useMemo(() => {
    return topicos.reduce((acc: number, t: Topico) => {
      const lista = conteudosPorTopico[t.id];
      return acc + (lista ? lista.length : 0);
    }, 0);
  }, [topicos, conteudosPorTopico]);

  return (
    <div className="rounded-[18px] overflow-hidden" style={{ background: "#fff", boxShadow: SHADOW }}>
      <button type="button" onClick={onToggle} className="w-full p-4 sm:p-5 flex items-center gap-3 sm:gap-4 text-left">
        <div
          className="h-10 w-10 sm:h-11 sm:w-11 rounded-full flex items-center justify-center shrink-0 text-sm font-extrabold"
          style={{ background: ativa ? C.gold : C.beigeLight, color: C.dark }}
        >
          {fase}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: ativa ? C.mid : C.textMid }}>
            Fase {fase} {ativa && "· Em andamento"}
          </div>
          <div className="font-extrabold mt-0.5 text-sm sm:text-base break-words" style={{ color: C.text }}>{nome}</div>
        </div>
        <span
          className="hidden sm:inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-bold"
          style={{ background: C.beigeLight, color: C.mid, border: `1px solid ${C.beige}` }}
        >
          {count} conteúdos
        </span>
        {open ? <ChevronDown size={18} style={{ color: C.textMid }} className="shrink-0" /> : <ChevronRight size={18} style={{ color: C.textMid }} className="shrink-0" />}
      </button>
      {open && (
        <div className="px-4 sm:px-5 pb-4 sm:pb-5 sm:pl-[76px]">
          <p className="text-sm mb-3" style={{ color: C.textMid }}>{desc}</p>
          {topicos.length === 0 ? (
            <div className="text-sm italic" style={{ color: C.textMid }}>Nenhum tópico configurado nesta fase.</div>
          ) : (
            <ul className="space-y-2">
              {topicos.map((t) => {
                const itens = conteudosPorTopico[t.id] || [];
                const temConteudo = itens.length > 0;
                return (
                  <li
                    key={t.id}
                    className="flex items-center justify-between gap-3 rounded-[12px] p-2.5 sm:p-3 flex-wrap"
                    style={{ background: C.beigeLight, border: `1px solid ${C.beige}` }}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {temConteudo ? (
                        <CheckCircle2 size={15} style={{ color: C.mid }} className="shrink-0" />
                      ) : (
                        <Circle size={15} style={{ color: C.textMuted }} className="shrink-0" />
                      )}
                      <span className="text-sm font-semibold truncate" style={{ color: C.text }}>{t.nome}</span>
                    </div>
                    {temConteudo ? (
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {itens.map((c) => {
                          const Icon = iconeConteudo(c.tipo);
                          return c.url ? (
                            <a
                              key={c.id}
                              href={c.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold"
                              style={{ background: "#fff", color: C.mid, border: `1px solid ${C.beige}` }}
                            >
                              <Icon size={12} />
                              {c.titulo || rotuloPadrao(c.tipo)}
                              <ExternalLink size={11} />
                            </a>
                          ) : (
                            <span
                              key={c.id}
                              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold"
                              style={{ background: "#fff", color: C.textMuted, border: `1px solid ${C.beige}` }}
                            >
                              <Icon size={12} />
                              {c.titulo || rotuloPadrao(c.tipo)}
                            </span>
                          );
                        })}
                      </div>
                    ) : (
                      <span
                        className="shrink-0 text-[10px] font-bold uppercase tracking-wider rounded-full px-2.5 py-1"
                        style={{ color: C.textMuted, border: `1px solid ${C.beige}` }}
                      >
                        Pendente
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- Bloqueador ---------- */
function BloqueadorCard({
  n, t, sub, por, open, onToggle,
}: { n: number; t: string; sub: string; por: string; open: boolean; onToggle: () => void }) {
  return (
    <div className="rounded-[18px] overflow-hidden" style={{ background: "#fff", boxShadow: SHADOW }}>
      <button type="button" onClick={onToggle} className="w-full p-4 sm:p-5 flex items-center gap-3 sm:gap-4 text-left">
        <div
          className="h-10 w-10 rounded-[12px] flex items-center justify-center shrink-0 text-sm font-extrabold"
          style={{ background: C.beigeLight, color: C.dark }}
        >
          {n}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-extrabold text-sm sm:text-base break-words" style={{ color: C.text }}>{t}</div>
          <div className="text-[11px] sm:text-xs mt-0.5 break-words" style={{ color: C.textMid }}>{sub}</div>
        </div>
        {open ? <ChevronDown size={18} style={{ color: C.textMid }} className="shrink-0" /> : <ChevronRight size={18} style={{ color: C.textMid }} className="shrink-0" />}
      </button>
      {open && (
        <div className="px-4 sm:px-5 pb-4 sm:pb-5 sm:pl-[72px]">
          <div className="text-[11px] font-bold uppercase tracking-[0.18em] mb-1" style={{ color: C.mid }}>Por que bloqueia</div>
          <p className="text-sm" style={{ color: C.text }}>{por}</p>
        </div>
      )}
    </div>
  );
}

/* ---------- Componente principal ---------- */
export function PortalRico({
  cliente,
  fases = [],
  topicos = [],
  conteudos = [],
  variant = "cliente",
}: {
  cliente: ClientePortal | null;
  fases: Fase[];
  topicos: Topico[];
  conteudos: Conteudo[];
  variant?: "admin" | "cliente";
}) {
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [activeAudioId, setActiveAudioId] = useState<string | null>(null);
  const [openFase, setOpenFase] = useState<number | null>(1);
  const [openBloq, setOpenBloq] = useState<number | null>(null);

  const normalizarNome = (txt: string | null | undefined): string => {
    if (!txt) return "";
    return String(txt).toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  };

  const safeConteudos = useMemo(() => Array.isArray(conteudos) ? conteudos : [], [conteudos]);
  const safeTopicos = useMemo(() => Array.isArray(topicos) ? topicos : [], [topicos]);
  const safeFases = useMemo(() => Array.isArray(fases) ? fases : [], [fases]);

  // Bloco 1: Vídeo de boas-vindas
  const videoBoasVindas = useMemo(() => {
    return safeConteudos.find((c) => {
      const nomeTopico = c?.topicos_fase?.nome;
      return normalizarNome(nomeTopico) === "video de boas-vindas";
    }) || null;
  }, [safeConteudos]);

  // Bloco 3: Áudios da Dinâmica
  const audiosDinamica = useMemo(() => {
    return safeConteudos.filter((c) => {
      const nomeTopico = c?.topicos_fase?.nome;
      return c?.tipo === "audio" && normalizarNome(nomeTopico) === "audios da dinamica";
    });
  }, [safeConteudos]);

  // Bloco 5: Documentos de insights
  const documentosInsights = useMemo(() => {
    return safeConteudos.filter((c) => {
      const nomeTopico = c?.topicos_fase?.nome;
      const ehFaseValida = c?.fase_id && c.fase_id >= 1 && c.fase_id <= 6;
      return c?.tipo === "documento" && normalizarNome(nomeTopico) === "documentos de insights" && !ehFaseValida;
    });
  }, [safeConteudos]);

  // Bloco 5: Link do banco de insights
  const linkBancoInsights = useMemo(() => {
    return safeConteudos.find((c) => {
      const nomeTopico = c?.topicos_fase?.nome;
      return normalizarNome(nomeTopico) === "link do banco de insights";
    }) || null;
  }, [safeConteudos]);

  // Separador de conteúdos por tópicos da linha do tempo
  const conteudosPorTopico = useMemo(() => {
    const m: Record<string, Conteudo[]> = {};
    for (const c of safeConteudos) {
      if (!c || !c.topico_id) continue;
      const nomeTopico = normalizarNome(c?.topicos_fase?.nome);
      if (
        nomeTopico === "video de boas-vindas" ||
        nomeTopico === "audios da dinamica" ||
        nomeTopico === "documentos de insights" ||
        nomeTopico === "link do banco de insights"
      ) {
        if (c.fase_id && c.fase_id >= 1 && c.fase_id <= 6) {
          // deixa passar se estiver fixado estruturalmente
        } else {
          continue; 
        }
      }
      if (!m[c.topico_id]) m[c.topico_id] = [];
      m[c.topico_id].push(c);
    }
    return m;
  }, [safeConteudos]);

  const topicosPorFase = useMemo(() => {
    const m: Record<number, Topico[]> = {};
    for (const t of safeTopicos) {
      if (!t || !t.fase_id) continue;
      if (!m[t.fase_id]) m[t.fase_id] = [];
      m[t.fase_id].push(t);
    }
    for (const chave of Object.keys(m)) {
      const numChave = Number(chave);
      if (m[numChave]) {
        m[numChave].sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
      }
    }
    return m;
  }, [safeTopicos]);

  const timeline = useMemo(() => {
    return ETAPAS_TIMELINE.map((et) => {
      const real = safeFases.find((f) => f && f.id === et.fase);
      return {
        ...et,
        nome: real?.nome || et.nome,
        desc: real?.descricao || et.desc,
      };
    });
  }, [safeFases]);

  return (
    <div className="rounded-[20px] p-4 sm:p-6 lg:p-8 space-y-8 sm:space-y-10" style={{ background: C.bg, color: C.text }}>
      {/* Header do preview */}
      <div className="rounded-[16px] px-5 py-4 sm:px-6 sm:py-5 flex items-center gap-3 sm:gap-4" style={{ background: C.dark, color: "#fff", boxShadow: SHADOW }}>
        <div
          className="h-11 w-11 rounded-full flex items-center justify-center text-sm font-extrabold shrink-0"
          style={{ background: `linear-gradient(135deg, ${C.mid}, ${C.gold})`, color: "#fff" }}
        >
          {cliente?.nome ? cliente.nome[0].toUpperCase() : "•"}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: "rgba(255,255,255,0.6)" }}>
            {variant === "admin" ? "Preview · Portal exclusivo" : "Portal exclusivo"}
          </div>
          <div className="font-extrabold text-sm sm:text-base truncate">{cliente?.nome || "Cliente"}</div>
          {cliente?.plano && (
            <div className="text-[11px] sm:text-xs mt-0.5" style={{ color: C.gold }}>Plano: {cliente.plano}</div>
          )}
        </div>
      </div>

      {/* Bloco 1 · Boas-vindas */}
      <section className="rounded-[18px] p-5 sm:p-8" style={{ background: C.beigeLight }}>
        <Eyebrow>Bloco 1 · Boas-vindas</Eyebrow>
        <h2 className="text-xl sm:text-3xl font-extrabold mt-2 mb-3 sm:mb-4 leading-tight" style={{ color: C.text, letterSpacing: "-0.02em" }}>
          Seja bem-vinda ao seu ecossistema.
        </h2>
        <p className="text-sm sm:text-base leading-relaxed" style={{ color: C.text }}>
          Seja bem-vinda ao seu ecossistema de <strong>posicionamento, desejo e marketing de diferenciação</strong>.
          Este é o espaço onde toda a estratégia da sua marca pessoal acontece — da primeira reunião à análise mensal.
          Reserve um tempo para explorar cada bloco abaixo com calma; tudo aqui foi desenho para destravar o seu próximo nível.
        </p>
      </section>

      {/* Vídeo de boas-vindas + guia */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 items-center">
        <div
          className="aspect-video rounded-[18px] overflow-hidden relative flex items-center justify-center cursor-pointer group"
          style={{ background: `linear-gradient(135deg, ${C.dark}, #4A2510)`, boxShadow: SHADOW }}
          onClick={() => {
            if (videoBoasVindas && videoBoasVindas.url) {
              window.open(videoBoasVindas.url, "_blank", "noopener,noreferrer");
              return;
            }
            setVideoPlaying((v) => !v);
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="h-16 w-16 sm:h-20 sm:w-20 rounded-full flex items-center justify-center transition-transform group-hover:scale-110"
              style={{ background: C.gold, color: C.dark }}
            >
              {videoPlaying ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
            </div>
          </div>
          <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 flex items-center gap-2 text-[11px] sm:text-xs font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>
            <Video size={13} /> {videoBoasVindas?.titulo || "Vídeo de boas-vindas"}
          </div>
          {!videoBoasVindas && (
            <div className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full" style={{ background: "rgba(255,255,255,0.15)", color: "#fff" }}>
              Placeholder
            </div>
          )}
        </div>
        <div>
          <Eyebrow>Guia de navegação</Eyebrow>
          <h3 className="text-lg sm:text-2xl font-extrabold mt-2 mb-2 sm:mb-3" style={{ color: C.text, letterSpacing: "-0.02em" }}>
            Comece por aqui.
          </h3>
          <p className="text-sm leading-relaxed" style={{ color: C.textMid }}>
            O vídeo ao lado contém orientações fundamentais sobre como funciona a nossa plataforma
            e o que você deve preencher até o dia do nosso encontro estratégico.
          </p>
        </div>
      </section>

      {/* Bloco 2 · Linha do tempo */}
      <section>
        <Eyebrow>Bloco 2 · Linha do tempo da parceria</Eyebrow>
        <h2 className="text-lg sm:text-2xl font-extrabold mt-2 mb-4 sm:mb-5" style={{ color: C.text, letterSpacing: "-0.02em" }}>
          As 6 fases que vamos atravessar juntas.
        </h2>
        <div className="space-y-3">
          {timeline.map((f) => (
            <FaseAccordion
              key={f.fase}
              fase={f.fase}
              nome={f.nome}
              desc={f.desc}
              ativa={f.ativa}
              topicos={topicosPorFase[f.fase] || []}
              conteudosPorTopico={conteudosPorTopico}
              open={openFase === f.fase}
              onToggle={() => setOpenFase(openFase === f.fase ? null : f.fase)}
            />
          ))}
        </div>
      </section>

      {/* Bloco 3 · Áudios (Nossa Dinâmica) */}
      <section>
        <Eyebrow>Bloco 3 · Gestão de expectativas</Eyebrow>
        <h2 className="text-lg sm:text-2xl font-extrabold mt-2 mb-1 sm:mb-2" style={{ color: C.text, letterSpacing: "-0.02em" }}>
          Nossa Dinâmica.
        </h2>
        <p className="text-sm mb-4 sm:mb-5" style={{ color: C.textMid }}>
          Áudios de alinhamento gravados especialmente para a nossa operação — ouça antes do primeiro encontro estratégico.
        </p>
        {audiosDinamica.length === 0 ? (
          <Card>
            <div className="flex items-center gap-3">
              <Headphones size={18} style={{ color: C.mid }} />
              <div className="text-sm" style={{ color: C.textMid }}>
                {variant === "admin" ? (
                  <span>Nenhum áudio cadastrado ainda para o tópico <strong>Áudios da dinâmica</strong>.</span>
                ) : (
                  <span>Nenhum áudio disponível ainda. Assim que forem liberados, aparecerão aqui.</span>
                )}
              </div>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {audiosDinamica.map((a) => (
              <AudioItem
                key={a.id}
                id={a.id}
                title={a.titulo || "Áudio da dinâmica"}
                desc={a.descricao || ""}
                url={a.url}
                activeId={activeAudioId}
                setActiveId={setActiveAudioId}
              />
            ))}
          </div>
        )}
      </section>

      {/* Bloco 4 · Referencial de entrega */}
      <section>
        <Eyebrow>Bloco 4 · Referencial de entrega</Eyebrow>
        <h2 className="text-lg sm:text-2xl font-extrabold mt-2 mb-4 sm:mb-5" style={{ color: C.text, letterSpacing: "-0.02em" }}>
          O que está incluso na sua marca pessoal.
        </h2>
        <Card>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Instagram size={18} style={{ color: C.mid }} />
                <div className="font-extrabold">Instagram Feed</div>
                <TagBadge label="3x semana" />
              </div>
              <p className="text-sm" style={{ color: C.textMid }}>
                Reels de posicionamento, bastidores refinados e carrosséis educativos de alto valor.
              </p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <Instagram size={18} style={{ color: C.mid }} />
                <div className="font-extrabold">Instagram Stories</div>
                <TagBadge label="Diário" />
              </div>
              <p className="text-sm" style={{ color: C.textMid }}>
                Mínimo de 3 blocks de narrativa ao longo do dia para gerar conexão e desejo.
              </p>
            </div>
          </div>
        </Card>
      </section>

      {/* Bloco 5 · Insights & jornada */}
      <section>
        <Eyebrow>Bloco 5 · Insights & jornada</Eyebrow>
        <h2 className="text-lg sm:text-2xl font-extrabold mt-2 mb-4 sm:mb-5" style={{ color: C.text, letterSpacing: "-0.02em" }}>
          Onde você deposita ideias e como sua paciente decide comprar.
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          <Card className="flex flex-col justify-between">
            <div>
              <SectionLabel>Banco de Insights</SectionLabel>
              <p className="text-sm mb-4" style={{ color: C.textMid }}>
                Envie aqui ideias espontâneas, dúvidas de balcão, prints de conversas com pacientes
                e qualquer faísca que possa virar conteúdo. Nada se perde — tudo entra no radar editorial.
              </p>
              
              {documentosInsights.length > 0 && (
                <ul className="space-y-2 mb-4">
                  {documentosInsights.map((d) => (
                    <li key={d.id} className="flex items-center gap-2 rounded-lg border p-2" style={{ borderColor: C.beige, background: C.beigeLight }}>
                      <FileText size={14} style={{ color: C.mid }} className="shrink-0" />
                      <span className="flex-1 text-xs truncate" style={{ color: C.text }}>{d.titulo || "Documento de insights"}</span>
                      {d.url && (
                        <a href={d.url} target="_blank" rel="noopener noreferrer" className="text-[11px] font-semibold underline shrink-0" style={{ color: C.mid }}>
                          Abrir
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Botão Dourado Dinâmico por Link do Tópico */}
            {linkBancoInsights && linkBancoInsights.url ? (
              <a
                href={linkBancoInsights.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-bold w-full sm:w-auto transition-transform hover:scale-[1.01]"
                style={{ background: C.gold, color: C.dark }}
              >
                <FolderOpen size={14} /> Acessar Banco de Insights do Cliente
                <ExternalLink size={12} />
              </a>
            ) : (
              <button
                disabled
                className="inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-bold w-full sm:w-auto opacity-50 cursor-not-allowed"
                style={{ background: C.beige, color: C.textMid }}
              >
                <FolderOpen size={14} /> Banco de Insights Indisponível
              </button>
            )}
          </Card>
          
          <Card>
            <SectionLabel>Jornada de compra da paciente</SectionLabel>
            <div className="space-y-3">
              {JORNADA.map((x, i) => (
                <div key={i} className="p-3 rounded-[12px] flex items-center gap-3" style={{ background: x.c }}>
                  <div
                    className="h-8 w-8 rounded-full flex items-center justify-center font-extrabold text-sm shrink-0"
                    style={{ background: "#fff", color: x.fg }}
                  >
                    {i + 1}
                  </div>
                  <div className="min-w-0">
                    <div className="font-extrabold text-sm" style={{ color: x.fg }}>{x.t}</div>
                    <div className="text-xs" style={{ color: x.fg, opacity: 0.85 }}>{x.s}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </section>

      {/* Bloco 6 · Bloqueadores */}
      <section>
        <Eyebrow>Bloco 6 · Bloqueadores de crescimento</Eyebrow>
        <h2 className="text-lg sm:text-2xl font-extrabold mt-2 mb-1 sm:mb-2" style={{ color: C.text, letterSpacing: "-0.02em" }}>
          Os 6 fatores que travam o algoritmo e o público.
        </h2>
        <p className="text-sm mb-4 sm:mb-5" style={{ color: C.textMid }}>
          Identificar para evitar. Clique em cada card para entender por que aquele comportamento bloqueia o crescimento.
        </p>
        <div className="space-y-3">
          {BLOQUEADORES.map((b) => (
            <BloqueadorCard
              key={b.n}
              {...b}
              open={openBloq === b.n}
              onToggle={() => setOpenBloq(openBloq === b.n ? null : b.n)}
            />
          ))}
        </div>
      </section>

      <footer className="pt-2 pb-2 text-center text-[11px]" style={{ color: C.textMuted }}>
        Portal exclusivo {cliente?.nome || ""} · gerido por Thamirys · Painel 360°
      </footer>
    </div>
  );
}
