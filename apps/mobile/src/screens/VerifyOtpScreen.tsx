import { useState } from "react";
import { Text, View, StyleSheet } from "react-native";
import { useAppTheme, space, typeStyles } from "@/theme";
import { AuthShell } from "@/components/AuthShell";
import { TextField } from "@/components/TextField";
import { Button } from "@/components/Button";
import { useAuth, ApiError } from "@/providers/AuthProvider";

export function VerifyOtpScreen({ phone, devCode }: { phone: string; devCode?: string }) {
  const { colors } = useAppTheme();
  const { verifyOtp } = useAuth();
  const [code, setCode] = useState(devCode ?? "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      await verifyOtp(phone, code);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell title="Verify your number" subtitle={`We sent a 6-digit code to ${phone}.`}>
      {devCode && (
        <Text style={[typeStyles.tiny, { color: colors.teal, textTransform: "none", marginBottom: 12 }]}>
          Dev mode: code pre-filled below ({devCode}) — OTP delivery isn&apos;t wired to a real SMS provider yet.
        </Text>
      )}
      <View style={styles.form}>
        <TextField label="6-digit code" keyboardType="number-pad" maxLength={6} value={code} onChangeText={setCode} />
        {error && <Text style={[typeStyles.bodySm, { color: colors.ember }]}>{error}</Text>}
        <Button onPress={onSubmit} style={{ marginTop: space[1] }}>
          {submitting ? "Verifying…" : "Verify & continue"}
        </Button>
      </View>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 16,
  },
});
