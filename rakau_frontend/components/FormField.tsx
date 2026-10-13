import { Text, TextInput, View, type TextInputProps } from "react-native";

type FormFieldProps = TextInputProps & {
  label: string;
  errors?: string[];
};

// Labelled text input that shows the API's per-field validation messages underneath
export function FormField({ label, errors, ...inputProps }: FormFieldProps) {
  const hasError = !!errors?.length;

  return (
    <View>
      <Text className="mb-1 text-sm font-iosevka-semibold text-bark">{label}</Text>
      <TextInput
        placeholderTextColor="#3E272380"
        className={`rounded-xl border bg-white px-4 py-3 text-base text-bark font-iosevka ${
          hasError ? "border-red-700" : "border-leaf/30"
        }`}
        {...inputProps}
      />
      {errors?.map((message) => (
        <Text key={message} className="mt-1 text-sm text-red-700 font-iosevka">
          {message}
        </Text>
      ))}
    </View>
  );
}
