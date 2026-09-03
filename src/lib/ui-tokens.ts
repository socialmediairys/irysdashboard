/**
 * Shared visual tokens mapped to the neutral design system.
 * Consumed by modules that previously imported the legacy `C` palette
 * from Painel360.tsx. Keys keep their old names for compatibility, but
 * all values resolve to the neutral token set defined in styles.css.
 */
export const C = {
  dark: "var(--primary)",
  mid: "var(--muted-foreground)",
  gold: "var(--secondary)",
  beige: "var(--border)",
  beigeLight: "var(--secondary)",
  bg: "var(--background)",
  text: "var(--foreground)",
  textMid: "var(--muted-foreground)",
  textMuted: "var(--muted-foreground)",
};

export const SHADOW = "var(--shadow-card)";
export const SHADOW_HOVER = "var(--shadow-card-hover)";
