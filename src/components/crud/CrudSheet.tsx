import type { ReactNode } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { Loader2 } from "lucide-react";

export type CrudSheetProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description?: string;
  submitLabel?: string;
  cancelLabel?: string;
  saving?: boolean;
  onSubmit: () => void;
  children: ReactNode;
};

/**
 * Reusable CRUD modal:
 * - desktop: centered Dialog
 * - mobile: bottom sheet (~90vh, slides from bottom)
 * - handles overlay click, X close, submit spinner
 */
export function CrudSheet({
  open,
  onOpenChange,
  title,
  description,
  submitLabel = "Salvar",
  cancelLabel = "Cancelar",
  saving = false,
  onSubmit,
  children,
}: CrudSheetProps) {
  const isMobile = useIsMobile();

  const body = (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-4">{children}</div>
      <div className="flex items-center justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={saving}
          className="min-h-11"
        >
          {cancelLabel}
        </Button>
        <Button type="submit" disabled={saving} className="min-h-11">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="h-[90vh] overflow-y-auto rounded-t-2xl p-5"
        >
          <SheetHeader className="text-left pb-2">
            <SheetTitle>{title}</SheetTitle>
            {description && <SheetDescription>{description}</SheetDescription>}
          </SheetHeader>
          {body}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {body}
      </DialogContent>
    </Dialog>
  );
}

// Silence unused-import lint by re-exporting for DialogFooter/SheetFooter callers
export { DialogFooter, SheetFooter };
