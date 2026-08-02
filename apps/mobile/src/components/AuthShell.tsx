import type { PropsWithChildren } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { useAppTheme, space, typeStyles } from "@/theme";
import { AuroraBackground } from "./AuroraBackground";
import { GlassSurface } from "./GlassSurface";

export function AuthShell({ title, subtitle, children }: PropsWithChildren<{ title: string; subtitle: string }>) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.flex}>
      <AuroraBackground />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.center}>
          <GlassSurface tier="tier2" style={styles.card}>
            <Text style={[typeStyles.headingLg, { color: colors.ink }]}>{title}</Text>
            <Text style={[typeStyles.bodySm, { color: colors.inkSoft, marginTop: 8, marginBottom: space[4] }]}>{subtitle}</Text>
            {children}
          </GlassSurface>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flexGrow: 1, alignItems: "center", justifyContent: "center", padding: space[4] },
  card: { width: "100%", maxWidth: 360 },
});
