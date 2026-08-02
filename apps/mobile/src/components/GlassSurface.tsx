import type { PropsWithChildren } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import { BlurView } from "expo-blur";
import { useAppTheme, elevation, radius } from "@/theme";

type Tier = "tier2" | "tier3";

interface GlassSurfaceProps extends PropsWithChildren {
  tier?: Tier;
  style?: ViewStyle;
}

/**
 * Tier 2/3 glass surface — backed by expo-blur's native BlurView. Only ever
 * use this for chrome and cards you tap into, never for repeating list rows;
 * see packages/theme tokens.elevation for the full rule.
 */
export function GlassSurface({ tier = "tier2", style, children }: GlassSurfaceProps) {
  const { name, colors } = useAppTheme();
  const { nativeBlurIntensity } = elevation[tier];

  return (
    <View
      style={[
        styles.wrap,
        {
          borderColor: colors.glassBorder,
          borderRadius: radius.lg,
          shadowColor: "#000",
        },
        style,
      ]}
    >
      <BlurView
        intensity={nativeBlurIntensity}
        tint={name === "light" ? "light" : "dark"}
        style={StyleSheet.absoluteFill}
      />
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: tier === "tier3" ? colors.glassBgStrong : colors.glassBg },
        ]}
      />
      <View style={[styles.edge, { borderTopColor: colors.glassEdge }]} />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: "hidden",
    borderWidth: 1,
    elevation: 8,
    shadowOpacity: 0.35,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
  },
  edge: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
  },
  content: {
    padding: 12,
  },
});
