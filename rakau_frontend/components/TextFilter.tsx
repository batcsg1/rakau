import { useState } from "react";
import { Text, TextInput, View } from "react-native";

import colors from "../constants/colors";

type TextFilterProps = {
  label: string;
  placeholder: string;
  value: string | undefined;
  onChange: (value: string | undefined) => void;
};

// Labelled free-text filter. Like RangeFilter, it's only applied when the user finishes
// typing, so a half-typed name doesn't fetch on every keystroke
export function TextFilter({ label, placeholder, value, onChange }: TextFilterProps) {
  const [draft, setDraft] = useState(value ?? "");
  const [applied, setApplied] = useState(value);

  // Follow outside changes, e.g. a cleared chip or "Clear filters"
  if (applied !== value) {
    setApplied(value);
    setDraft(value ?? "");
  }

  const commit = () => {
    const text = draft.trim() || undefined;
    if (text !== value) {
      onChange(text);
    } else {
      setDraft(text ?? "");
    }
  };

  return (
    <View className="mt-4 px-6">
      <Text className="font-iosevka-semibold text-sm text-bark/70">{label}</Text>
      <TextInput
        value={draft}
        onChangeText={setDraft}
        onBlur={commit}
        onSubmitEditing={commit}
        placeholder={placeholder}
        placeholderTextColor={`${colors.bark}80`}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        // A faint sand fill with a white outline, matching FormField
        className="mt-2 rounded-xl border border-white bg-sand/50 px-4 py-2 font-iosevka text-sm text-bark"
      />
    </View>
  );
}
