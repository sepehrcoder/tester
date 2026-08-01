import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAppTheme, space, typeStyles } from "@/theme";
import { AuthShell } from "@/components/AuthShell";
import { TextField } from "@/components/TextField";
import { Button } from "@/components/Button";
import { useAuth, ApiError } from "@/providers/AuthProvider";

export function LoginScreen({ onGoToRegister }: { onGoToRegister: () => void }) {
  const { colors } = useAppTheme();
  const { login } = useAuth();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      await login(phone, password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell title="Sign in" subtitle="Welcome back — enter your phone number and password.">
      <View style={styles.form}>
        <TextField label="Phone number" keyboardType="phone-pad" placeholder="+923001234567" value={phone} onChangeText={setPhone} />
        <TextField label="Password" secureTextEntry value={password} onChangeText={setPassword} />
        {error && <Text style={[typeStyles.bodySm, { color: colors.ember }]}>{error}</Text>}
        <Button onPress={onSubmit} style={{ marginTop: space[1] }}>
          {submitting ? "Signing in…" : "Sign in"}
        </Button>
      </View>
      <TouchableOpacity onPress={onGoToRegister} style={{ marginTop: space[4] }}>
        <Text style={[typeStyles.bodySm, { color: colors.inkSoft }]}>
          New here? <Text style={{ color: colors.ember }}>Create an account</Text>
        </Text>
      </TouchableOpacity>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 16,
  },
});
