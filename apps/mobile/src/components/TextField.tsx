import { StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";
import { useAppTheme, radius } from "@/theme";
import { fontFamily } from "@/theme/fonts";

interface TextFieldProps extends TextInputProps {
  label: string;
}

export function TextField({ label, style, ...props }: TextFieldProps) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: colors.inkSoft, fontFamily: fontFamily.bodyBold }]}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.inkFaint}
        style={[
          styles.input,
          { color: colors.ink, backgroundColor: colors.flatBg, borderColor: colors.flatBorder, fontFamily: fontFamily.bodyMedium },
          style,
        ]}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 6,
  },
  label: {
    fontSize: 11,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
  },
});
