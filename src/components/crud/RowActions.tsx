import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex items-center gap-1 shrink-0">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={(e) => { e.stopPropagation(); onEdit(); }}
        aria-label="Editar"
        className="h-9 w-9"
      >
        <Pencil className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        aria-label="Excluir"
        className="h-9 w-9 text-destructive hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
