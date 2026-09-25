import { Link } from "@tanstack/react-router";
import { ClientsAttention } from "./ClientsAttention";
import { ContentProduction } from "./ContentProduction";
import { OverviewSection } from "./OverviewSection";
import { OverviewStats } from "./OverviewStats";
import { PriorityList } from "./PriorityList";
import { RecentActivity } from "./RecentActivity";
import { WeekView } from "./WeekView";
import { useOverviewData } from "./useOverviewData";

const linkCls = "text-[13px] text-muted-foreground hover:text-foreground";

export function Overview() {
  const { data, isLoading, error } = useOverviewData();

  return (
    <div className="space-y-10">
      <header>
        <h1 className="text-[28px] font-semibold leading-tight tracking-tight text-foreground">
          Olá{data?.firstName ? `, ${data.firstName}` : ""}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">Aqui está o que precisa da sua atenção hoje.</p>
      </header>

      {isLoading && <div className="text-sm text-muted-foreground">Carregando…</div>}
      {error && <div className="text-sm text-destructive">Não foi possível carregar a visão geral.</div>}

      {data && (
        <>
          <OverviewStats stats={data.stats} />

          <OverviewSection
            title="Prioridades"
            description="Ordenadas por urgência."
            action={<Link to="/admin/sprints" className={linkCls}>Ver sprints</Link>}
          >
            <PriorityList items={data.priorities} />
          </OverviewSection>

          <OverviewSection
            title="Sua semana"
            description="Reuniões e prazos dos próximos 7 dias."
            action={<Link to="/admin/agenda" className={linkCls}>Abrir agenda</Link>}
          >
            <WeekView week={data.week} />
          </OverviewSection>

          <div className="grid gap-10 lg:grid-cols-2">
            <OverviewSection
              title="Clientes que precisam de atenção"
              action={<Link to="/admin/clientes" className={linkCls}>Todos os clientes</Link>}
            >
              <ClientsAttention clients={data.attention} />
            </OverviewSection>

            <OverviewSection title="Produção de conteúdo" action={<Link to="/admin/conteudo" className={linkCls}>Abrir Conteúdo</Link>}>
              <ContentProduction counts={data.production} />
            </OverviewSection>
          </div>

          {data.activity.length > 0 && (
            <OverviewSection title="Atividade recente">
              <RecentActivity items={data.activity} />
            </OverviewSection>
          )}
        </>
      )}
    </div>
  );
}
