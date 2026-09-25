import logoUrl from "@/assets/airys-logo.svg?raw";
import { cn } from "@/lib/utils";

/**
 * Logo oficial extraído vetorialmente do PDF da marca (sem redesenho).
 * Cor herdada via currentColor — use text-foreground (fundo claro) ou
 * text-background (fundo escuro). Proporção original 102.5 × 34.3.
 */
export function BrandLogo({ className }: { className?: string }) {
  return (
    <span
      className={cn("inline-block text-foreground [&>svg]:block [&>svg]:h-full [&>svg]:w-auto", className)}
      dangerouslySetInnerHTML={{ __html: logoUrl }}
    />
  );
}
