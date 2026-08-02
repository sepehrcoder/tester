import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAppTheme, space, typeStyles } from "@/theme";
import { AuthShell } from "@/components/AuthShell";
import { TextField } from "@/components/TextField";
import { Button } from "@/components/Button";
import { Badge } from "@/components/Badge";
import { useAuth, ApiError } from "@/providers/AuthProvider";

type Role = "CUSTOMER" | "DEALER";

export function RegisterScreen({
  onGoToLogin,
  onRegistered,
}: {
  onGoToLogin: () => void;
  onRegistered: (args: { phone: string; devCode?: string }) => void;
}) {
  const { colors } = useAppTheme();
  const { register } = useAuth();
  const [role, setRole] = useState<Role>("CUSTOMER");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      const result = await register({ name, phone, password, role });
      onRegistered({ phone, devCode: result.devCode });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell title="Create an account" subtitle="Buying, selling, or dealing — pick what fits.">
      <View style={styles.roleRow}>
        {(["CUSTOMER", "DEALER"] as const).map((r) => (
          <TouchableOpacity key={r} onPress={() => setRole(r)}>
            <Badge variant={role === r ? "ember" : "ghost"}>{r === "CUSTOMER" ? "Buyer / Owner" : "Dealer"}</Badge>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.form}>
        <TextField label="Full name" value={name} onChangeText={setName} />
        <TextField label="Phone number" keyboardType="phone-pad" placeholder="+923001234567" value={phone} onChangeText={setPhone} />
        <TextField label="Password" secureTextEntry value={password} onChangeText={setPassword} />
        {error && <Text style={[typeStyles.bodySm, { color: colors.ember }]}>{error}</Text>}
        <Button onPress={onSubmit} style={{ marginTop: space[1] }}>
          {submitting ? "Creating account…" : "Continue"}
        </Button>
      </View>
      <TouchableOpacity onPress={onGoToLogin} style={{ marginTop: space[4] }}>
        <Text style={[typeStyles.bodySm, { color: colors.inkSoft }]}>
          Already have an account? <Text style={{ color: colors.ember }}>Sign in</Text>
        </Text>
      </TouchableOpacity>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  roleRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  form: {
    gap: 16,
  },
});
