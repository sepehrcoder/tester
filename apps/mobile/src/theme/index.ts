import { useColorScheme } from "react-native";
import { color, space, radius, elevation, type ThemeName } from "@repo/theme";
import { fontFamily } from "./fonts";

export { space, radius, elevation };
export type { ThemeName };

/** Resolves system color scheme to our token set — dark is the flagship, falls back to dark on an undetermined scheme. */
export function useAppTheme() {
  const scheme = useColorScheme();
  const name: ThemeName = scheme === "light" ? "light" : "dark";
  return { name, colors: color[name] };
}

/** Mirrors packages/theme tokens.type, resolved to concrete RN font-family strings (see ./fonts.ts). */
export const typeStyles = {
  displayLg: { fontFamily: fontFamily.displayExtraBold, fontSize: 40, lineHeight: 44, letterSpacing: -0.5 },
  displayMd: { fontFamily: fontFamily.displayExtraBold, fontSize: 30, lineHeight: 34, letterSpacing: -0.4 },
  headingLg: { fontFamily: fontFamily.displayExtraBold, fontSize: 22, lineHeight: 27, letterSpacing: -0.2 },
  headingMd: { fontFamily: fontFamily.displayExtraBold, fontSize: 18, lineHeight: 23, letterSpacing: -0.1 },
  bodyLg: { fontFamily: fontFamily.bodyMedium, fontSize: 16, lineHeight: 24 },
  bodyMd: { fontFamily: fontFamily.bodyMedium, fontSize: 15, lineHeight: 22 },
  bodySm: { fontFamily: fontFamily.bodyMedium, fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: fontFamily.bodyBold, fontSize: 12, lineHeight: 16, letterSpacing: 0.3 },
  tiny: { fontFamily: fontFamily.bodyBold, fontSize: 11, lineHeight: 14, letterSpacing: 0.4 },
  numeral: { fontFamily: fontFamily.bodyExtraBold, fontSize: 19, lineHeight: 24 },
} as const;
