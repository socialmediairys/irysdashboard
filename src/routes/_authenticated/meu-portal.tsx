import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LogOut, Video, Headphones, FileText, ChevronDown, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/meu-portal")({
  head: () => ({
    meta: [
      { title: "Meu portal — Irys" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: MeuPortalPage,
});

type Fase = { id: number; nome: string; descricao: string | null };
type Topico = { id: string; fase_id: number; nome: string; ordem: number };
type ConteudoTipo = "video" | "audio" | "documento";
type Conteudo = {
  id: string;
  topico_id: string;
  tipo: ConteudoTipo;
  titulo: string | null;
  url: string | null;
  storage_bucket: string | null;
  storage_path: string | null;
};
type Cliente = { id: string; nome: string; plano_atual: string | null; plano_label: string | null };

function MeuPortalPage() {
  const navigate = useNavigate();
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [fases, setFases] = useState<Fase[]>([]);
  const [topicos, setTopicos] = useState<Topico[]>([]);
  const [conteudos, setConteudos] = useState<Conteudo[]>([]);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [openFase, setOpenFase] = useState<number | null>(1);
  const [erro, setErro] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setErro(null);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return navigate({ to: "/login" });

      const { data: cli, error: cliErr } = await supabase
        .from("clientes")
        .select("id, nome, plano_atual, plano_label, status_cadastro")
        .eq("auth_user_id", userData.user.id)
        .maybeSingle();
      if (cliErr) throw cliErr;

      if (!cli || cli.status_cadastro !== "ativo") {
        return navigate({ to: "/app" });
      }
      setCliente(cli as Cliente);

      const [f, t, c] = await Promise.all([
        supabase.from("fases").select("id, nome, descricao").order("id"),
        supabase.from("topicos_fase").select("id, fase_id, nome, ordem").order("fase_id").order("ordem"),
        supabase
          .from("conteudos_cliente")
          .select("id, topico_id, tipo, titulo, url, storage_bucket, storage_path")
          .eq("cliente_id", cli.id)
          .order("created_at"),
      ]);
      if (f.error) throw f.error;
      if (t.error) throw t.error;
      if (c.error) throw c.error;
      setFases((f.data ?? []) as Fase[]);
      setTopicos((t.data ?? []) as Topico[]);
      const rows = (c.data ?? []) as Conteudo[];
      setConteudos(rows);

      // Signed URLs para conteúdos em storage
      const map: Record<string, string> = {};
      await Promise.all(
        rows.map(async (r) => {
          if (!r.url && r.storage_bucket && r.storage_path) {
            const { data: s } = await supabase.storage
              .from(r.storage_bucket)
              .createSignedUrl(r.storage_path, 60 * 60 * 6);
            if (s?.signedUrl) map[r.id] = s.signedUrl;
          }
        }),
      );
      setSignedUrls(map);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao carregar portal");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    const onFocus = () => void load();
    window.addEventListener("focus", onFocus);
    const interval = window.setInterval(load, 30000);
    return () => {
      window.removeEventListener("focus", onFocus);
      window.clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const conteudosPorTopico = useMemo(() => {
    const m: Record<string, Conteudo[]> = {};
    for (const c of conteudos) (m[c.topico_id] ??= []).push(c);
    return m;
  }, [conteudos]);

  const topicosPorFase = useMemo(() => {
    const m: Record<number, Topico[]> = {};
    for (const t of topicos) (m[t.fase_id] ??= []).push(t);
    return m;
  }, [topicos]);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/login" });
  };

  if (loading && !cliente) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#EDEAE5] text-[#7A4A18]">
        Carregando...
      </div>
    );
  }
  if (erro) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#EDEAE5] p-6">
        <div className="max-w-md text-center space-y-3">
          <h1 className="text-xl font-bold text-[#2C1505]">Erro ao abrir seu portal</h1>
          <p className="text-sm text-[#7A6050]">{erro}</p>
          <Button onClick={signOut} variant="outline">Sair</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EDEAE5]">
      <header className="bg-[#2C1505] text-white px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-widest text-[#C9A46E]">Portal exclusivo</div>
          <h1 className="text-lg sm:text-xl font-extrabold break-words">{cliente?.nome}</h1>
          {(cliente?.plano_label ?? cliente?.plano_atual) && (
            <div className="text-xs text-[#C9A46E]">Plano: {cliente?.plano_label ?? cliente?.plano_atual}</div>
          )}
        </div>
        <Button onClick={signOut} variant="ghost" size="sm" className="text-white hover:bg-[#7A4A18] shrink-0">
          <LogOut className="w-4 h-4 mr-1" /> Sair
        </Button>
      </header>

      <main className="max-w-4xl mx-auto p-4 sm:p-6 space-y-4">
        <p className="text-sm text-[#7A6050]">
          Acompanhe as <strong>6 fases da nossa parceria</strong>. Cada tópico reúne os vídeos, áudios e documentos preparados para você.
        </p>

        {fases.map((fase) => {
          const isOpen = openFase === fase.id;
          const tps = topicosPorFase[fase.id] ?? [];
          const total = tps.reduce((s, t) => s + (conteudosPorTopico[t.id]?.length ?? 0), 0);
          return (
            <Card key={fase.id} className="overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenFase(isOpen ? null : fase.id)}
                className="w-full text-left p-4 sm:p-5 flex items-center gap-3 sm:gap-4 hover:bg-[#F5EEE5] transition"
              >
                <div className="shrink-0 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-[#2C1505] text-[#C9A46E] font-extrabold">
                  {fase.id}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] uppercase tracking-wider text-[#7A6050]">Fase {fase.id}</div>
                  <div className="font-bold text-[#2C1505] break-words">{fase.nome}</div>
                  {fase.descricao && <div className="text-xs text-[#7A6050] mt-0.5 break-words">{fase.descricao}</div>}
                </div>
                <Badge variant="outline" className="shrink-0 border-[#C9A46E] text-[#7A4A18] text-[10px] sm:text-xs">
                  {total}
                  <span className="hidden sm:inline">&nbsp;conteúdos</span>
                </Badge>
                {isOpen ? <ChevronDown className="shrink-0 h-5 w-5 text-[#7A6050]" /> : <ChevronRight className="shrink-0 h-5 w-5 text-[#7A6050]" />}
              </button>
              {isOpen && (
                <div className="border-t border-[#E8D8C0] p-4 sm:p-5 space-y-4">
                  {tps.length === 0 && (
                    <div className="text-sm text-[#7A6050]">Nenhum tópico configurado nesta fase.</div>
                  )}
                  {tps.map((t) => (
                    <div key={t.id} className="min-w-0">
                      <div className="text-sm font-semibold text-[#2C1505] mb-2 break-words">{t.nome}</div>
                      {(conteudosPorTopico[t.id] ?? []).length === 0 ? (
                        <div className="text-xs text-[#7A6050] italic">Ainda não há conteúdos liberados aqui.</div>
                      ) : (
                        <ul className="space-y-2">
                          {(conteudosPorTopico[t.id] ?? []).map((c) => {
                            const Icon = c.tipo === "video" ? Video : c.tipo === "audio" ? Headphones : FileText;
                            const href = c.url || signedUrls[c.id] || null;
                            const label = c.titulo || (c.tipo === "video" ? "Vídeo" : c.tipo === "audio" ? "Áudio" : "Documento");
                            return (
                              <li key={c.id} className="flex items-center gap-3 rounded-lg border border-[#E8D8C0] bg-white p-3 min-w-0">
                                <Icon className="shrink-0 h-4 w-4 text-[#7A4A18]" />
                                <span className="flex-1 text-sm text-[#2C1505] truncate min-w-0">{label}</span>
                                {href && (
                                  <a href={href} target="_blank" rel="noopener noreferrer" className="shrink-0 text-xs font-semibold text-[#7A4A18] underline">
                                    Abrir
                                  </a>
                                )}
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </main>
    </div>
  );
}
