import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { IconMapPin } from "@repo/icons/native";
import { useAppTheme, radius, space, typeStyles } from "@/theme";
import { Badge } from "./Badge";

export interface Property {
  price: string;
  title: string;
  location: string;
  tag: string;
  verified?: boolean;
}

/** Tier 1 — flat surface, no blur. This is what repeats by the hundred in a feed. */
export function PropertyCard({ price, title, location, tag, verified }: Property) {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.flatBg, borderColor: colors.flatBorder }]}>
      <LinearGradient
        colors={[colors.violet, colors.cyan]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.thumb}
      />
      <View style={styles.info}>
        <Text style={[typeStyles.numeral, { color: colors.ink }]}>{price}</Text>
        <Text style={[typeStyles.bodySm, { color: colors.ink }]} numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.locRow}>
          <IconMapPin size={12} color={colors.inkSoft} />
          <Text style={[typeStyles.tiny, { color: colors.inkSoft, textTransform: "none" }]} numberOfLines={1}>
            {location}
          </Text>
        </View>
        <View style={styles.tags}>
          {verified && <Badge variant="teal">Verified</Badge>}
          <Badge variant="ghost">{tag}</Badge>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    gap: space[3],
    padding: space[3],
    borderRadius: radius.md,
    borderWidth: 1,
  },
  thumb: {
    width: 64,
    height: 56,
    borderRadius: radius.sm,
  },
  info: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  locRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  tags: {
    flexDirection: "row",
    gap: 6,
    marginTop: 4,
  },
});
