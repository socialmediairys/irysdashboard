import { createFileRoute, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { getPortalBySlug, type Fase, type Topico, type ConteudoTipo } from "@/lib/portal-conteudos.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Video, Headphones, FileText, ChevronDown, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/portal/$slug")({
  component: PublicPortalPage,
  head: () => ({
    meta: [
      { title: "Portal do cliente | Irys" },
      { name: "description", content: "Acesse os conteúdos exclusivos da sua parceria." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  errorComponent: ({ error }) => (
    <div className="min-h-screen flex items-center justify-center bg-[#EDEAE5] p-6">
      <div className="max-w-md text-center space-y-2">
        <h1 className="text-xl font-bold text-[#2C1505]">Não conseguimos abrir este portal</h1>
        <p className="text-sm text-[#7A6050]">{error.message}</p>
      </div>
    </div>
  ),
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center bg-[#EDEAE5] p-6 text-[#2C1505]">
      Portal não encontrado.
    </div>
  ),
});

type PortalData = Awaited<ReturnType<typeof getPortalBySlug>>;

function PublicPortalPage() {
  const { slug } = useParams({ from: "/portal/$slug" });
  const [data, setData] = useState<PortalData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openFase, setOpenFase] = useState<number | null>(1);

  useEffect(() => {
    let cancel = false;
    const fetchData = () => {
      getPortalBySlug({ data: { slug } })
        .then((d) => { if (!cancel) setData(d); })
        .catch((e) => { if (!cancel) setError(e instanceof Error ? e.message : "Erro ao carregar portal"); });
    };
    fetchData();
    const onVisible = () => {
      if (document.visibilityState === "visible") fetchData();
    };
    const onFocus = () => fetchData();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onFocus);
    // Refetch a cada 30s enquanto a aba estiver aberta, para pegar novos conteúdos publicados
    const interval = window.setInterval(fetchData, 30000);
    return () => {
      cancel = true;
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onFocus);
      window.clearInterval(interval);
    };
  }, [slug]);


  const conteudosPorTopico = useMemo(() => {
    const m: Record<string, PortalData["conteudos"]> = {};
    if (!data) return m;
    for (const c of data.conteudos) {
      if (!m[c.topico_id]) m[c.topico_id] = [];
      m[c.topico_id].push(c);
    }
    return m;
  }, [data]);

  const topicosPorFase = useMemo(() => {
    const m: Record<number, Topico[]> = {};
    if (!data) return m;
    for (const t of data.topicos) {
      if (!m[t.fase_id]) m[t.fase_id] = [];
      m[t.fase_id].push(t);
    }
    return m;
  }, [data]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#EDEAE5] p-6">
        <div className="max-w-md text-center space-y-2">
          <h1 className="text-xl font-bold text-[#2C1505]">Portal indisponível</h1>
          <p className="text-sm text-[#7A6050]">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return <div className="min-h-screen flex items-center justify-center bg-[#EDEAE5] text-[#7A4A18]">Carregando…</div>;
  }

  return (
    <div className="min-h-screen bg-[#EDEAE5]">
      <header className="bg-[#2C1505] text-white px-6 py-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-xs uppercase tracking-widest text-[#C9A46E]">Portal exclusivo</div>
          <h1 className="text-2xl font-extrabold">{data.cliente.nome}</h1>
          {data.cliente.plano && (
            <div className="text-sm text-[#C9A46E] mt-1">Plano: {data.cliente.plano}</div>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-4">
        <p className="text-sm text-[#7A6050]">
          Acompanhe as <strong>6 fases da nossa parceria</strong>. Cada tópico reúne os vídeos, áudios e documentos preparados especialmente para você.
        </p>

        {data.fases.map((fase: Fase) => {
          const isOpen = openFase === fase.id;
          const topicos = topicosPorFase[fase.id] ?? [];
          const totalConteudos = topicos.reduce((s, t) => s + (conteudosPorTopico[t.id]?.length ?? 0), 0);
          return (
            <Card key={fase.id} className="overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenFase(isOpen ? null : fase.id)}
                className="w-full text-left p-5 flex items-center gap-4 hover:bg-[#F5EEE5] transition"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2C1505] text-[#C9A46E] font-extrabold">
                  {fase.id}
                </div>
                <div className="flex-1">
                  <div className="text-xs uppercase tracking-wider text-[#7A6050]">Fase {fase.id}</div>
                  <div className="font-bold text-[#2C1505]">{fase.nome}</div>
                  {fase.descricao && <div className="text-xs text-[#7A6050] mt-0.5">{fase.descricao}</div>}
                </div>
                <Badge variant="outline" className="border-[#C9A46E] text-[#7A4A18]">{totalConteudos} conteúdos</Badge>
                {isOpen ? <ChevronDown className="h-5 w-5 text-[#7A6050]" /> : <ChevronRight className="h-5 w-5 text-[#7A6050]" />}
              </button>
              {isOpen && (
                <div className="border-t border-[#E8D8C0] p-5 space-y-4">
                  {topicos.length === 0 && (
                    <div className="text-sm text-[#7A6050]">Nenhum tópico configurado nesta fase.</div>
                  )}
                  {topicos.map((t) => (
                    <div key={t.id}>
                      <div className="text-sm font-semibold text-[#2C1505] mb-2">{t.nome}</div>
                      {(conteudosPorTopico[t.id] ?? []).length === 0 ? (
                        <div className="text-xs text-[#7A6050] italic">Ainda não há conteúdos liberados aqui.</div>
                      ) : (
                        <ul className="space-y-2">
                          {(conteudosPorTopico[t.id] ?? []).map((c) => (
                            <ConteudoItem key={c.id} tipo={c.tipo} titulo={c.titulo} url={c.url} />
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          );
        })}

        <footer className="pt-6 text-center text-xs text-[#7A6050]">
          Este link é pessoal e exclusivo. Não compartilhe com terceiros.
        </footer>
      </main>
    </div>
  );
}

function ConteudoItem({ tipo, titulo, url }: { tipo: ConteudoTipo; titulo: string | null; url: string | null }) {
  const Icon = tipo === "video" ? Video : tipo === "audio" ? Headphones : FileText;
  const label = titulo || (tipo === "video" ? "Vídeo" : tipo === "audio" ? "Áudio" : "Documento");
  return (
    <li className="flex items-center gap-3 rounded-lg border border-[#E8D8C0] bg-white p-3">
      <Icon className="h-4 w-4 text-[#7A4A18]" />
      <span className="flex-1 text-sm text-[#2C1505] truncate">{label}</span>
      {url && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-semibold text-[#7A4A18] underline"
        >
          Abrir
        </a>
      )}
    </li>
  );
}
