import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useAppTheme, space, typeStyles } from "@/theme";
import { useAppFonts } from "@/theme/fonts";
import { AuroraBackground } from "@/components/AuroraBackground";
import { AppNav } from "@/components/AppNav";
import { BottomTabs } from "@/components/BottomTabs";
import { PropertyCard, type Property } from "@/components/PropertyCard";
import { AuthProvider, useAuth } from "@/providers/AuthProvider";
import { apiFetch } from "@/lib/api";
import { LoginScreen } from "@/screens/LoginScreen";
import { RegisterScreen } from "@/screens/RegisterScreen";
import { VerifyOtpScreen } from "@/screens/VerifyOtpScreen";

const FALLBACK_LISTINGS: Property[] = [
  { price: "PKR 1,85,00,000", title: "5 Marla, 3 bed corner plot", location: "Bahria Town, Phase 7", tag: "3 bed", verified: true },
  { price: "PKR 92,00,000", title: "10 Marla residential plot", location: "Gulberg Greens", tag: "Owner listed" },
  { price: "PKR 3,20,00,000", title: "1 Kanal, west-facing villa", location: "DHA Phase 6", tag: "6 bed", verified: true },
];

interface ApiListing {
  id: string;
  price: string;
  title: string;
  city: string;
  area: string;
  beds: number | null;
  verified: boolean;
  source: "DEALER" | "OWNER";
}

function formatPKR(value: number) {
  const rounded = Math.round(value).toString();
  const last3 = rounded.slice(-3);
  const rest = rounded.slice(0, -3);
  const grouped = rest ? rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," : "";
  return `PKR ${grouped}${last3}`;
}

function HomeScreen() {
  const { colors } = useAppTheme();
  const { user, logout } = useAuth();
  const [listings, setListings] = useState<Property[]>(FALLBACK_LISTINGS);

  useEffect(() => {
    apiFetch<{ items: ApiListing[] }>("/listings?pageSize=6")
      .then((data) =>
        setListings(
          data.items.map((item) => ({
            price: formatPKR(Number(item.price)),
            title: item.title,
            location: `${item.area}, ${item.city}`,
            verified: item.verified,
            tag: item.beds ? `${item.beds} bed` : item.source === "OWNER" ? "Owner listed" : "Listing",
          })),
        ),
      )
      .catch(() => {
        /* keep fallback sample data */
      });
  }, []);

  return (
    <View style={styles.flex}>
      <AuroraBackground />
      <StatusBar style="light" />
      <AppNav title="For you" badge="12 new" />

      <ScrollView contentContainerStyle={styles.list}>
        <Text style={[typeStyles.bodySm, { color: colors.inkSoft, marginBottom: space[2] }]}>
          {user ? `Signed in as ${user.name}` : "Matched to your saved search"}
        </Text>
        {listings.map((item) => (
          <PropertyCard key={item.title} {...item} />
        ))}
        {user && (
          <Text onPress={logout} style={[typeStyles.tiny, { color: colors.inkFaint, textTransform: "none", marginTop: space[3] }]}>
            Sign out
          </Text>
        )}
      </ScrollView>

      <BottomTabs active="home" />
    </View>
  );
}

function Root() {
  const fontsLoaded = useAppFonts();
  const { user, loading } = useAuth();
  const [authScreen, setAuthScreen] = useState<"login" | "register" | "verify-otp">("login");
  const [pendingVerification, setPendingVerification] = useState<{ phone: string; devCode?: string } | null>(null);
  const { colors } = useAppTheme();

  if (!fontsLoaded || loading) {
    return <View style={[styles.flex, { backgroundColor: colors.void }]} />;
  }

  if (user) return <HomeScreen />;

  if (authScreen === "register") {
    return (
      <RegisterScreen
        onGoToLogin={() => setAuthScreen("login")}
        onRegistered={(args) => {
          setPendingVerification(args);
          setAuthScreen("verify-otp");
        }}
      />
    );
  }

  if (authScreen === "verify-otp" && pendingVerification) {
    return <VerifyOtpScreen phone={pendingVerification.phone} devCode={pendingVerification.devCode} />;
  }

  return <LoginScreen onGoToRegister={() => setAuthScreen("register")} />;
}

export default function App() {
  return (
    <AuthProvider>
      <Root />
    </AuthProvider>
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
