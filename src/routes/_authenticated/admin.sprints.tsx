import { createFileRoute } from "@tanstack/react-router";
import { SprintsBoard } from "@/components/SprintsBoard";

export const Route = createFileRoute("/_authenticated/admin/sprints")({
  head: () => ({ meta: [{ title: "Sprints — Irys OS" }] }),
  component: SprintsBoard,
});
