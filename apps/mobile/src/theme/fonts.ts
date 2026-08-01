import {
  useFonts as useDisplayFonts,
  BricolageGrotesque_500Medium,
  BricolageGrotesque_800ExtraBold,
} from "@expo-google-fonts/bricolage-grotesque";
import {
  useFonts as useBodyFonts,
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from "@expo-google-fonts/manrope";

/**
 * React Native has no variable-font weight switching on a single family —
 * each static cut is its own font-family string. These are the concrete
 * names to use in `fontFamily` styles; see `typeStyles` below for the
 * pre-built presets that mirror `packages/theme` tokens.type.
 */
export const fontFamily = {
  displayMedium: "BricolageGrotesque_500Medium",
  displayExtraBold: "BricolageGrotesque_800ExtraBold",
  bodyRegular: "Manrope_400Regular",
  bodyMedium: "Manrope_500Medium",
  bodySemiBold: "Manrope_600SemiBold",
  bodyBold: "Manrope_700Bold",
  bodyExtraBold: "Manrope_800ExtraBold",
} as const;

export function useAppFonts() {
  const [displayLoaded] = useDisplayFonts({
    BricolageGrotesque_500Medium,
    BricolageGrotesque_800ExtraBold,
  });
  const [bodyLoaded] = useBodyFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  return displayLoaded && bodyLoaded;
}
