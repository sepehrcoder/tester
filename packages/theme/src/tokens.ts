/**
 * Aurora Glass — design tokens.
 *
 * Single source of truth for both apps. `apps/web` mirrors these as CSS
 * custom properties in `src/app/globals.css` (Tailwind v4 reads its theme
 * from CSS, not JS, so the values are duplicated there — keep both in sync
 * when a token changes). `apps/mobile` imports this file directly.
 *
 * Concept: near-black ground, three drifting color glows (violet/cyan/ember)
 * behind frosted glass panels with a crisp light-catching top edge. Dark is
 * the flagship theme; light carries the same structure, softened.
 */

export type ThemeName = "dark" | "light";

export interface ColorTokens {
  /** base background the glow sits on */
  void: string;
  /** slightly lifted background, used behind flat surfaces */
  void2: string;
  /** primary text */
  ink: string;
  /** secondary text */
  inkSoft: string;
  /** tertiary text / placeholders / disabled */
  inkFaint: string;

  /** glass panel fill (Tier 2) */
  glassBg: string;
  /** glass panel fill for fixed chrome (Tier 3) */
  glassBgStrong: string;
  /** 1px border on every glass surface */
  glassBorder: string;
  /** inset top-edge highlight that makes glass read as catching light */
  glassEdge: string;

  /** flat, non-blurred surface (Tier 1 — lists, dense content) */
  flatBg: string;
  flatBorder: string;

  /** primary action color — the only accent used for interactive UI */
  ember: string;
  /** text/icon color to place on top of `ember` */
  emberInk: string;
  /** glow shadow color behind ember elements */
  emberGlow: string;

  /** trust / verified / success — never used for anything else */
  teal: string;
  tealSoft: string;

  /** atmosphere only — the background glow, never used on UI controls */
  violet: string;
  cyan: string;
}

export const color: Record<ThemeName, ColorTokens> = {
  dark: {
    void: "#06080C",
    void2: "#0B0F16",
    ink: "#F3F6FA",
    inkSoft: "#98A5B8",
    inkFaint: "#586274",

    glassBg: "rgba(20,24,34,0.55)",
    glassBgStrong: "rgba(13,16,24,0.74)",
    glassBorder: "rgba(255,255,255,0.09)",
    glassEdge: "rgba(255,255,255,0.20)",

    flatBg: "#10141C",
    flatBorder: "rgba(255,255,255,0.07)",

    ember: "#FF5C39",
    emberInk: "#120602",
    emberGlow: "rgba(255,92,57,0.45)",

    teal: "#34E0B0",
    tealSoft: "rgba(52,224,176,0.14)",

    violet: "#7C5CFF",
    cyan: "#22D3EE",
  },
  light: {
    void: "#EEF1F7",
    void2: "#FFFFFF",
    ink: "#10141C",
    inkSoft: "#4B5768",
    inkFaint: "#8793A3",

    glassBg: "rgba(255,255,255,0.55)",
    glassBgStrong: "rgba(255,255,255,0.78)",
    glassBorder: "rgba(16,20,28,0.08)",
    glassEdge: "rgba(255,255,255,0.95)",

    flatBg: "#FFFFFF",
    flatBorder: "rgba(16,20,28,0.08)",

    ember: "#E8481F",
    emberInk: "#FFFFFF",
    emberGlow: "rgba(232,72,31,0.28)",

    teal: "#0EA37F",
    tealSoft: "rgba(14,163,127,0.12)",

    violet: "#6A4FE0",
    cyan: "#0EA5C4",
  },
};

/**
 * Font families. Both are variable fonts, self-hosted (no runtime CDN
 * request on either platform):
 *  - web: `apps/web/src/fonts` via next/font/local
 *  - mobile: `@expo-google-fonts/bricolage-grotesque` + `@expo-google-fonts/manrope`
 */
export const font = {
  display: "Bricolage Grotesque",
  body: "Manrope",
  /** RN needs literal registered font names per static weight — see apps/mobile/src/theme/fonts.ts */
  weight: {
    regular: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
    extrabold: "800",
  },
} as const;

export const type = {
  displayLg: { size: 48, lineHeight: 52, weight: font.weight.extrabold, tracking: -0.02, family: font.display },
  displayMd: { size: 34, lineHeight: 38, weight: font.weight.extrabold, tracking: -0.02, family: font.display },
  headingLg: { size: 24, lineHeight: 30, weight: font.weight.extrabold, tracking: -0.01, family: font.display },
  headingMd: { size: 20, lineHeight: 26, weight: font.weight.extrabold, tracking: -0.01, family: font.display },
  bodyLg: { size: 16, lineHeight: 24, weight: font.weight.medium, tracking: 0, family: font.body },
  bodyMd: { size: 15, lineHeight: 22, weight: font.weight.medium, tracking: 0, family: font.body },
  bodySm: { size: 14, lineHeight: 20, weight: font.weight.medium, tracking: 0, family: font.body },
  caption: { size: 12, lineHeight: 16, weight: font.weight.bold, tracking: 0.02, family: font.body },
  tiny: { size: 11, lineHeight: 14, weight: font.weight.bold, tracking: 0.03, family: font.body },
  /** prices, stats — pair with tabular-nums (web) / variant "tabular" (RN) */
  numeral: { size: 20, lineHeight: 26, weight: font.weight.extrabold, tracking: 0, family: font.body },
} as const;

/** 8px base unit */
export const space = {
  1: 4,
  2: 8,
  3: 16,
  4: 24,
  5: 32,
  6: 48,
  7: 64,
} as const;

/** radius scales with surface size — small controls stay tight */
export const radius = {
  sm: 8, // inputs, chips
  md: 12, // flat cards
  lg: 16, // glass panels
  pill: 999, // badges, avatars
} as const;

/**
 * Elevation — where glass is allowed. This is a performance rule, not a
 * style preference: only tier2/tier3 blur. Tier 1 is flat everywhere,
 * always, no exceptions, because it's what repeats hundreds of times in a
 * scrolling feed.
 */
export const elevation = {
  tier1: {
    label: "Flat",
    usage: "Property cards, chat rows, feed items — anything in a scrolling list",
    blurPx: 0,
    /** expo-blur intensity (0-100) equivalent — unused at this tier */
    nativeBlurIntensity: 0,
  },
  tier2: {
    label: "Glass",
    usage: "Cards you tap into — detail headers, requirement summary, stat tiles",
    blurPx: 22,
    nativeBlurIntensity: 40,
  },
  tier3: {
    label: "Glass Strong",
    usage: "Fixed chrome only — top nav, bottom tabs, sheets, modals",
    blurPx: 30,
    nativeBlurIntensity: 65,
  },
} as const;

/** performance rules the whole system is built around — see also apps/web glass utilities */
export const performanceRules = [
  "Blur chrome, not content — Tier 1 stays flat, always.",
  "The aurora backdrop is a single fixed layer, never redrawn per-component.",
  "Cap concurrent blurred surfaces on screen at 2-3.",
  "Two font families only, self-hosted, variable — no runtime CDN font requests.",
  "Animate transform & opacity only — never blur radius or box-shadow. Respect prefers-reduced-motion.",
] as const;
