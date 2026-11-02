import { useState } from "react";
import { Text, TextInput, View } from "react-native";

import colors from "../constants/colors";

type RangeFilterProps = {
  label: string;
  min: number | undefined;
  max: number | undefined;
  onChange: (bound: "min" | "max", value: number | undefined) => void;
  errors?: string[];
};

// "" clears the bound; anything that isn't a number is dropped rather than sent
function parseBound(text: string): number | undefined {
  const trimmed = text.trim().replace(",", ".");
  if (trimmed === "") return undefined;
  const value = Number(trimmed);
  return Number.isNaN(value) ? undefined : value;
}

const toText = (value: number | undefined) => (value === undefined ? "" : String(value));

// Labelled min/max number inputs for a filter range. A bound is only applied when the
// user finishes editing it, so typing "12" doesn't fetch for "1" first
export function RangeFilter({ label, min, max, onChange, errors }: RangeFilterProps) {
  const [draft, setDraft] = useState({ min: toText(min), max: toText(max) });
  const [applied, setApplied] = useState({ min, max });
  const hasError = !!errors?.length;

  // Follow outside changes, e.g. a cleared chip or "Clear filters"
  if (applied.min !== min || applied.max !== max) {
    setApplied({ min, max });
    setDraft({ min: toText(min), max: toText(max) });
  }

  const commit = (bound: "min" | "max") => {
    const value = parseBound(draft[bound]);
    if (value !== (bound === "min" ? min : max)) {
      onChange(bound, value);
    } else {
      setDraft((current) => ({ ...current, [bound]: toText(value) }));
    }
  };

  const input = (bound: "min" | "max") => (
    <TextInput
      value={draft[bound]}
      onChangeText={(text) => setDraft((current) => ({ ...current, [bound]: text }))}
      onBlur={() => commit(bound)}
      onSubmitEditing={() => commit(bound)}
      placeholder={bound === "min" ? "Min" : "Max"}
      placeholderTextColor={`${colors.bark}80`}
      keyboardType="decimal-pad"
      returnKeyType="done"
      // A faint sand fill with a white outline, matching FormField
      className={`flex-1 rounded-xl border bg-sand/50 px-4 py-2 font-iosevka text-sm text-bark ${
        hasError ? "border-red-700" : "border-white"
      }`}
    />
  );

  return (
    <View className="mt-4 px-6">
      <Text className="font-iosevka-semibold text-sm text-bark/70">{label}</Text>
      <View className="flex-row items-center gap-2 pt-2">
        {input("min")}
        <Text className="font-iosevka text-sm text-bark/70">to</Text>
        {input("max")}
      </View>
      {errors?.map((message) => (
        <Text key={message} className="mt-1 font-iosevka text-sm text-red-700">
          {message}
        </Text>
      ))}
    </View>
  );
}
