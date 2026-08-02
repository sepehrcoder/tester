import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useAppTheme } from "@/theme";

/**
 * Native has no direct equivalent of the web's blurred multi-radial-gradient
 * backdrop (no cheap way to blur an arbitrary shape into a glow on RN), so
 * this is a deliberate platform adaptation: a single diagonal 3-stop wash
 * over the void background, at low opacity. Same mood, cheap to render —
 * one gradient layer, no per-component redraw.
 */
export function AuroraBackground() {
  const { colors, name } = useAppTheme();

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.void }]}>
      <LinearGradient
        colors={[colors.violet, colors.cyan, colors.ember]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={[StyleSheet.absoluteFill, { opacity: name === "light" ? 0.14 : 0.22 }]}
      />
    </View>
  );
}
