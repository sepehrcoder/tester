import type { PropsWithChildren } from "react";
import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from "react-native";
import { useAppTheme, radius, space } from "@/theme";
import { fontFamily } from "@/theme/fonts";

type Variant = "primary" | "secondary" | "ghost";

interface ButtonProps extends PropsWithChildren {
  variant?: Variant;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function Button({ variant = "primary", onPress, style, children }: ButtonProps) {
  const { colors } = useAppTheme();

  const variantStyle: ViewStyle =
    variant === "primary"
      ? {
          backgroundColor: colors.ember,
          shadowColor: colors.ember,
          shadowOpacity: 0.5,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 6 },
        }
      : variant === "secondary"
        ? { backgroundColor: "transparent", borderWidth: 1.5, borderColor: colors.teal }
        : { backgroundColor: colors.glassBg, borderWidth: 1, borderColor: colors.glassBorder };

  const textColor = variant === "primary" ? colors.emberInk : variant === "secondary" ? colors.teal : colors.ink;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variantStyle,
        pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
        style,
      ]}
    >
      <Text style={[styles.label, { color: textColor, fontFamily: fontFamily.bodyBold }]}>{children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.sm,
    paddingHorizontal: space[4],
    paddingVertical: space[3],
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 14,
  },
});
