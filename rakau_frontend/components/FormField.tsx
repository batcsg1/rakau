import { Text, TextInput, View, type TextInputProps } from "react-native";

import colors from "../constants/colors";

type FormFieldProps = TextInputProps & {
  label: string;
  // Short explanation under the label, for terms people may not know (UAT I6, #61)
  hint?: string;
  errors?: string[];
};

// Labelled text input that shows the API's per-field validation messages underneath
export function FormField({ label, hint, errors, ...inputProps }: FormFieldProps) {
  const hasError = !!errors?.length;

  return (
    <View>
      <Text className="mb-1 font-iosevka-semibold text-sm text-bark">{label}</Text>
      {hint && <Text className="mb-2 font-iosevka text-xs leading-4 text-bark/60">{hint}</Text>}
      <TextInput
        accessibilityHint={hint}
        placeholderTextColor={`${colors.bark}80`}
        // A faint sand fill with a white outline, so the background photo still shows through
        className={`rounded-xl border bg-sand/50 px-4 py-3 font-iosevka text-base text-bark ${
          hasError ? "border-red-700" : "border-white"
        }`}
        {...inputProps}
      />
      {errors?.map((message) => (
        <Text key={message} className="mt-1 font-iosevka text-sm text-red-700">
          {message}
        </Text>
      ))}
    </View>
  );
}
