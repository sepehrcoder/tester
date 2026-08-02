import type { PropsWithChildren } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useAppTheme, radius } from "@/theme";
import { fontFamily } from "@/theme/fonts";

type Variant = "ember" | "teal" | "ghost";

export function Badge({ variant = "ghost", children }: PropsWithChildren<{ variant?: Variant }>) {
  const { colors } = useAppTheme();

  const bg = variant === "ember" ? colors.ember : variant === "teal" ? colors.tealSoft : `${colors.inkSoft}26`;
  const fg = variant === "ember" ? colors.emberInk : variant === "teal" ? colors.teal : colors.inkSoft;

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color: fg, fontFamily: fontFamily.bodyExtraBold }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: 11,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
});
