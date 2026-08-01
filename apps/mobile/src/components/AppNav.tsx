import { StyleSheet, Text, View } from "react-native";
import { IconBell } from "@repo/icons/native";
import { useAppTheme, typeStyles } from "@/theme";
import { GlassSurface } from "./GlassSurface";
import { Badge } from "./Badge";

export function AppNav({ title, badge }: { title: string; badge?: string }) {
  const { colors } = useAppTheme();

  return (
    <GlassSurface tier="tier3" style={styles.wrap}>
      <View style={styles.row}>
        <Text style={[typeStyles.headingMd, { color: colors.ink }]}>{title}</Text>
        {badge ? (
          <Badge variant="teal">{badge}</Badge>
        ) : (
          <IconBell size={19} color={colors.inkSoft} />
        )}
      </View>
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 0,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
