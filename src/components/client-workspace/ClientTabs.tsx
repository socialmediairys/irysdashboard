import { CLIENT_TABS, type ClientTabKey } from "@/lib/client-workspace";
import { cn } from "@/lib/utils";
import { useStaffAccess } from "@/lib/use-staff-roles";

/** Underline tabs; scroll horizontally on small screens. */
export function ClientTabs({ value, onChange }: { value: ClientTabKey; onChange: (t: ClientTabKey) => void }) {
  const { canTab } = useStaffAccess();
  return (
    <div className="mobile-scroll-tabs -mx-3 mb-5 overflow-x-auto overscroll-x-contain border-b border-border px-3 sm:-mx-4 sm:px-4 md:mx-0 md:mb-8 md:px-0" role="tablist">
      <div className="flex min-w-max gap-5">
        {CLIENT_TABS.filter((t) => canTab(t.key)).map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={value === t.key}
            onClick={() => onChange(t.key)}
            className={cn(
              "-mb-px min-h-11 shrink-0 border-b-2 py-2.5 text-sm transition-colors",
              value === t.key
                ? "border-primary font-medium text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
