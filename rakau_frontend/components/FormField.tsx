import { Text, TextInput, View, type TextInputProps } from "react-native";

import colors from "../constants/colors";

type FormFieldProps = TextInputProps & {
  label: string;
  errors?: string[];
};

// Labelled text input that shows the API's per-field validation messages underneath
export function FormField({ label, errors, ...inputProps }: FormFieldProps) {
  const hasError = !!errors?.length;

  return (
    <View>
      <Text className="mb-1 font-iosevka-semibold text-sm text-bark">{label}</Text>
      <TextInput
        placeholderTextColor={`${colors.bark}80`}
        className={`rounded-xl border bg-white px-4 py-3 font-iosevka text-base text-bark ${
          hasError ? "border-red-700" : "border-leaf/30"
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
