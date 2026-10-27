import { Link } from "@tanstack/react-router";
import { ClientsAttention } from "./ClientsAttention";
import { ContentProduction } from "./ContentProduction";
import { OverviewSection } from "./OverviewSection";
import { OverviewStats } from "./OverviewStats";
import { PriorityList } from "./PriorityList";
import { RecentActivity } from "./RecentActivity";
import { WeekView } from "./WeekView";
import { useOverviewData } from "./useOverviewData";
import { useWeekWithCalendar } from "./useWeekWithCalendar";
import { useStaffAccess } from "@/lib/use-staff-roles";

const linkCls = "text-[13px] text-muted-foreground hover:text-foreground";

export function Overview() {
  const { data, isLoading, error } = useOverviewData();
  const week = useWeekWithCalendar(data?.week);
  const { can } = useStaffAccess();
  const show = { clientes: can("/admin/clientes"), conteudo: can("/admin/conteudo"), financeiro: can("/admin/financeiro") };
  // Itens cujo destino o perfil não acessa somem (a origem já é filtrada pelo banco).
  const priorities = (data?.priorities ?? []).filter((p) => can(p.action.to));
  const activity = (data?.activity ?? []).filter((a) => !a.to || can(a.to));

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
          <OverviewStats stats={data.stats} show={show} />

          <OverviewSection
            title="Prioridades"
            description="Ordenadas por urgência."
            action={<Link to="/admin/sprints" className={linkCls}>Ver sprints</Link>}
          >
            <PriorityList items={priorities} />
          </OverviewSection>

          <OverviewSection
            title="Sua semana"
            description="Reuniões e prazos dos próximos 7 dias."
            action={<Link to="/admin/agenda" className={linkCls}>Abrir agenda</Link>}
          >
            <WeekView week={week ?? data.week} />
          </OverviewSection>

          {(show.clientes || show.conteudo) && (
          <div className={show.clientes && show.conteudo ? "grid gap-10 lg:grid-cols-2" : "grid gap-10"}>
            {show.clientes && (
            <OverviewSection
              title="Clientes que precisam de atenção"
              action={<Link to="/admin/clientes" className={linkCls}>Todos os clientes</Link>}
            >
              <ClientsAttention clients={data.attention} />
            </OverviewSection>
            )}

            {show.conteudo && (
            <OverviewSection title="Produção de conteúdo" action={<Link to="/admin/conteudo" className={linkCls}>Abrir Conteúdo</Link>}>
              <ContentProduction counts={data.production} />
            </OverviewSection>
            )}
          </div>
          )}

          {activity.length > 0 && (
            <OverviewSection title="Atividade recente">
              <RecentActivity items={activity} />
            </OverviewSection>
          )}
        </>
      )}
    </div>
  );
}
