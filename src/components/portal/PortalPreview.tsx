import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { getPortalPreviewByClienteId } from "@/lib/portal-conteudos.functions";
import {
  Video,
  Headphones,
  FileText,
  ChevronDown,
  ChevronRight,
  Loader2,
  Play,
  Pause,
  Instagram,
  FolderOpen,
  CheckCircle2,
  Circle,
  ExternalLink,
} from "lucide-react";

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
type Fase = { id: number; nome: string; descricao: string | null };
type Topico = { id: string; fase_id: number; nome: string; ordem: number };
type ConteudoTipo = "video" | "audio" | "documento";
type Conteudo = { id: string; topico_id: string; tipo: ConteudoTipo; titulo: string | null; url: string | null };
type Cliente = { id: string; nome: string; plano: string | null; status: string; status_cadastro: string | null };

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
function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: C.textMid }}>
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
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

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
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
  duration,
  url,
  activeId,
  setActiveId,
}: {
  id: string;
  title: string;
  desc: string;
  duration?: string;
  url: string | null;
  activeId: string | null;
  setActiveId: (id: string | null) => void;
}) {
  const isPlaying = activeId === id;
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (!isPlaying) {
      setProgress(0);
      return;
    }
    const t = setInterval(() => setProgress((p) => (p >= 100 ? 0 : p + 1.2)), 200);
    return () => clearInterval(t);
  }, [isPlaying]);

  return (
    <div className="rounded-[14px] p-3 sm:p-4 flex items-center gap-3 sm:gap-4" style={{ background: "#fff", boxShadow: SHADOW }}>
      <button
        type="button"
        onClick={() => setActiveId(isPlaying ? null : id)}
        className="h-11 w-11 sm:h-12 sm:w-12 rounded-full flex items-center justify-center shrink-0 transition-transform hover:scale-105"
        style={{ background: isPlaying ? C.gold : C.dark, color: isPlaying ? C.dark : "#fff" }}
        aria-label={isPlaying ? "Pausar" : "Reproduzir"}
      >
        {isPlaying ? <Pause size={16} /> : <Play size={16} className="ml-0.5" />}
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <div className="font-semibold truncate text-sm" style={{ color: C.text }}>{title}</div>
          {duration && <div className="text-[10px] sm:text-xs font-bold tabular-nums shrink-0" style={{ color: C.textMid }}>{duration}</div>}
        </div>
        {desc && <div className="text-[11px] sm:text-xs mt-0.5 mb-2 line-clamp-2" style={{ color: C.textMid }}>{desc}</div>}
        <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: C.beigeLight }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${C.mid}, ${C.gold})` }} />
        </div>
      </div>
      {url && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-[11px] font-semibold underline"
          style={{ color: C.mid }}
        >
          Abrir
        </a>
      )}
    </div>
  );
}

/* ---------- Fase accordion ---------- */
function FaseAccordion({
  fase,
  nome,
  desc,
  subitens,
  ativa,
  open,
  onToggle,
  count,
}: {
  fase: number;
  nome: string;
  desc: string;
  subitens: string[];
  ativa: boolean;
  open: boolean;
  onToggle: () => void;
  count: number;
}) {
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
export function PortalPreview({ clienteId }: { clienteId: string }) {
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [fases, setFases] = useState<Fase[]>([]);
  const [topicos, setTopicos] = useState<Topico[]>([]);
  const [conteudos, setConteudos] = useState<Conteudo[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [videoPlaying, setVideoPlaying] = useState(false);
  const [activeAudioId, setActiveAudioId] = useState<string | null>(null);
  const [openFase, setOpenFase] = useState<number | null>(1);
  const [openBloq, setOpenBloq] = useState<number | null>(null);

  const loadPreview = useServerFn(getPortalPreviewByClienteId);

  const load = async () => {
    if (!clienteId) return;
    setErro(null);
    try {
      const res = await loadPreview({ data: { clienteId } });
      setCliente(res.cliente);
      setFases(res.fases);
      setTopicos(res.topicos);
      setConteudos(res.conteudos);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao carregar preview");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteId]);

  useEffect(() => {
    if (!clienteId) return;
    const channel = supabase
      .channel(`preview-conteudos-${clienteId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conteudos_cliente", filter: `cliente_id=eq.${clienteId}` },
        () => { void load(); },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteId]);

  const videos = useMemo(() => conteudos.filter((c) => c.tipo === "video"), [conteudos]);
  const audios = useMemo(() => conteudos.filter((c) => c.tipo === "audio"), [conteudos]);
  const documentos = useMemo(() => conteudos.filter((c) => c.tipo === "documento"), [conteudos]);
  const videoBoasVindas = videos[0] ?? null;

  const conteudosPorFase = useMemo(() => {
    const topicoToFase = new Map(topicos.map((t) => [t.id, t.fase_id]));
    const m: Record<number, number> = {};
    for (const c of conteudos) {
      const f = topicoToFase.get(c.topico_id);
      if (f != null) m[f] = (m[f] ?? 0) + 1;
    }
    return m;
  }, [conteudos, topicos]);

  // combina timeline fixa com nomes reais das fases quando existirem
  const timeline = useMemo(() => {
    return ETAPAS_TIMELINE.map((et) => {
      const real = fases.find((f) => f.id === et.fase);
      return {
        ...et,
        nome: real?.nome || et.nome,
        desc: real?.descricao || et.desc,
      };
    });
  }, [fases]);

  if (loading && !cliente) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground p-4">
        <Loader2 className="h-4 w-4 animate-spin" /> Carregando preview…
      </div>
    );
  }
  if (erro) return <div className="text-sm text-destructive p-4">{erro}</div>;

  return (
    <div className="rounded-[20px] p-4 sm:p-6 lg:p-8 space-y-8 sm:space-y-10" style={{ background: C.bg, color: C.text }}>
      {/* Header do preview */}
      <div className="rounded-[16px] px-5 py-4 sm:px-6 sm:py-5 flex items-center gap-3 sm:gap-4" style={{ background: C.dark, color: "#fff", boxShadow: SHADOW }}>
        <div
          className="h-11 w-11 rounded-full flex items-center justify-center text-sm font-extrabold shrink-0"
          style={{ background: `linear-gradient(135deg, ${C.mid}, ${C.gold})`, color: "#fff" }}
        >
          {cliente?.nome?.[0]?.toUpperCase() ?? "•"}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: "rgba(255,255,255,0.6)" }}>
            Preview · Portal exclusivo
          </div>
          <div className="font-extrabold text-sm sm:text-base truncate">{cliente?.nome}</div>
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
          Reserve um tempo para explorar cada bloco abaixo com calma; tudo aqui foi desenhado para destravar o seu próximo nível.
        </p>
      </section>

      {/* Vídeo de boas-vindas + guia */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 items-center">
        <div
          className="aspect-video rounded-[18px] overflow-hidden relative flex items-center justify-center cursor-pointer group"
          style={{ background: `linear-gradient(135deg, ${C.dark}, #4A2510)`, boxShadow: SHADOW }}
          onClick={() => {
            if (videoBoasVindas?.url) {
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
          {videos.length > 1 && (
            <p className="text-xs mt-3" style={{ color: C.textMid }}>
              + {videos.length - 1} outros vídeos disponíveis nas fases abaixo.
            </p>
          )}
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
              {...f}
              count={conteudosPorFase[f.fase] ?? 0}
              open={openFase === f.fase}
              onToggle={() => setOpenFase(openFase === f.fase ? null : f.fase)}
            />
          ))}
        </div>
      </section>

      {/* Bloco 3 · Áudios */}
      <section>
        <Eyebrow>Bloco 3 · Gestão de expectativas</Eyebrow>
        <h2 className="text-lg sm:text-2xl font-extrabold mt-2 mb-1 sm:mb-2" style={{ color: C.text, letterSpacing: "-0.02em" }}>
          Boas-vindas & nossa dinâmica.
        </h2>
        <p className="text-sm mb-4 sm:mb-5" style={{ color: C.textMid }}>
          Áudios de alinhamento gravados especialmente para a nossa operação — ouça antes do primeiro encontro estratégico.
        </p>
        {audios.length === 0 ? (
          <Card>
            <div className="flex items-center gap-3">
              <Headphones size={18} style={{ color: C.mid }} />
              <div className="text-sm" style={{ color: C.textMid }}>
                Nenhum áudio cadastrado ainda. Adicione na aba <strong>Portal — Gerenciar conteúdo</strong>.
              </div>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {audios.map((a) => (
              <AudioItem
                key={a.id}
                id={a.id}
                title={a.titulo || "Áudio"}
                desc=""
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
                Mínimo de 3 blocos de narrativa ao longo do dia para gerar conexão e desejo.
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
          <Card>
            <SectionLabel>Banco de Insights</SectionLabel>
            <p className="text-sm mb-4" style={{ color: C.textMid }}>
              Envie aqui ideias espontâneas, dúvidas de balcão, prints de conversas com pacientes
              e qualquer faísca que possa virar conteúdo. Nada se perde — tudo entra no radar editorial.
            </p>
            {documentos.length > 0 ? (
              <ul className="space-y-2">
                {documentos.slice(0, 4).map((d) => (
                  <li key={d.id} className="flex items-center gap-2 rounded-lg border p-2" style={{ borderColor: C.beige, background: C.beigeLight }}>
                    <FileText size={14} style={{ color: C.mid }} className="shrink-0" />
                    <span className="flex-1 text-xs truncate" style={{ color: C.text }}>{d.titulo || "Documento"}</span>
                    {d.url && (
                      <a href={d.url} target="_blank" rel="noopener noreferrer" className="text-[11px] font-semibold underline shrink-0" style={{ color: C.mid }}>
                        Abrir
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <div
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold"
                style={{ background: C.gold, color: C.dark }}
              >
                <FolderOpen size={14} /> Banco de Insights do Cliente
                <ExternalLink size={12} />
              </div>
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
        Portal exclusivo {cliente?.nome} · gerido por Thamirys · Painel 360°
      </footer>
    </div>
  );
}
