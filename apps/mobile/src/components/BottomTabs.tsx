import { StyleSheet, Text, View } from "react-native";
import { IconBell, IconChat, IconHome, IconLead, IconSearch } from "@repo/icons/native";
import { useAppTheme, typeStyles } from "@/theme";
import { GlassSurface } from "./GlassSurface";

const TABS = [
  { key: "home", label: "Home", Icon: IconHome },
  { key: "search", label: "Search", Icon: IconSearch },
  { key: "requirement", label: "Requirement", Icon: IconLead },
  { key: "chat", label: "Chat", Icon: IconChat },
  { key: "alerts", label: "Alerts", Icon: IconBell },
] as const;

export function BottomTabs({ active = "home" }: { active?: (typeof TABS)[number]["key"] }) {
  const { colors } = useAppTheme();

  return (
    <GlassSurface tier="tier3" style={styles.wrap}>
      <View style={styles.row}>
        {TABS.map(({ key, label, Icon }) => {
          const isActive = key === active;
          const tint = isActive ? colors.ember : colors.inkFaint;
          return (
            <View key={key} style={styles.tab}>
              <Icon size={20} color={tint} />
              <Text style={[typeStyles.tiny, { color: tint, textTransform: "none" }]}>{label}</Text>
            </View>
          );
        })}
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
    justifyContent: "space-around",
  },
  tab: {
    alignItems: "center",
    gap: 4,
  },
});
