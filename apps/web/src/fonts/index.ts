import localFont from "next/font/local";

// Self-hosted variable fonts — see packages/theme/src/tokens.ts `font` export
// for the semantic names ("display" / "body") these map to.
export const displayFont = localFont({
  src: "./bricolage-grotesque-variable.woff2",
  variable: "--font-display",
  weight: "500 800",
  display: "swap",
});

export const bodyFont = localFont({
  src: "./manrope-variable.woff2",
  variable: "--font-body",
  weight: "400 800",
  display: "swap",
});
