import { CLIENT_TABS, type ClientTabKey } from "@/lib/client-workspace";
import { cn } from "@/lib/utils";

/** Underline tabs; scroll horizontally on small screens. */
export function ClientTabs({ value, onChange }: { value: ClientTabKey; onChange: (t: ClientTabKey) => void }) {
  return (
    <div className="-mx-4 mb-8 overflow-x-auto border-b border-border px-4 md:mx-0 md:px-0" role="tablist">
      <div className="flex min-w-max gap-5">
        {CLIENT_TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={value === t.key}
            onClick={() => onChange(t.key)}
            className={cn(
              "-mb-px border-b-2 py-2.5 text-sm transition-colors",
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
