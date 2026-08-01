import { ScrollView, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useAppTheme, space, typeStyles } from "@/theme";
import { useAppFonts } from "@/theme/fonts";
import { AuroraBackground } from "@/components/AuroraBackground";
import { AppNav } from "@/components/AppNav";
import { BottomTabs } from "@/components/BottomTabs";
import { PropertyCard, type Property } from "@/components/PropertyCard";

const listings: Property[] = [
  { price: "PKR 1,85,00,000", title: "5 Marla, 3 bed corner plot", location: "Bahria Town, Phase 7", tag: "3 bed", verified: true },
  { price: "PKR 92,00,000", title: "10 Marla residential plot", location: "Gulberg Greens", tag: "Owner listed" },
  { price: "PKR 3,20,00,000", title: "1 Kanal, west-facing villa", location: "DHA Phase 6", tag: "6 bed", verified: true },
  { price: "PKR 1,10,00,000", title: "3 bed apartment, top floor", location: "Askari 11", tag: "3 bed", verified: true },
];

export default function App() {
  const fontsLoaded = useAppFonts();
  const { colors } = useAppTheme();

  if (!fontsLoaded) {
    return <View style={[styles.flex, { backgroundColor: colors.void }]} />;
  }

  return (
    <View style={styles.flex}>
      <AuroraBackground />
      <StatusBar style="light" />
      <AppNav title="For you" badge="12 new" />

      <ScrollView contentContainerStyle={styles.list}>
        <Text style={[typeStyles.bodySm, { color: colors.inkSoft, marginBottom: space[2] }]}>
          Matched to your saved search
        </Text>
        {listings.map((item) => (
          <PropertyCard key={item.title} {...item} />
        ))}
      </ScrollView>

      <BottomTabs active="home" />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  list: {
    padding: space[3],
    gap: space[3],
    paddingBottom: space[6],
  },
});
