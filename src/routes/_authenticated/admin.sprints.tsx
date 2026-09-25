import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { SprintsBoard } from "@/components/SprintsBoard";

export const Route = createFileRoute("/_authenticated/admin/sprints")({
  validateSearch: z.object({ task: z.string().optional() }),
  head: () => ({ meta: [{ title: "Sprints — Irys" }, { name: "description", content: "Tarefas e sprints da equipe." }] }),
  component: SprintsRoute,
});

function SprintsRoute() {
  const { task } = Route.useSearch();
  return <SprintsBoard key={task ?? "board"} initialTaskId={task} />;
}
