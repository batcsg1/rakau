import { Pressable, Text, View } from "react-native";

import type { Option } from "../constants/options";

type ChipGroupProps<T> = {
  label: string;
  options: Option<T>[];
  selected: T | undefined;
  onSelect: (value: T) => void;
  errors?: string[];
};

// Single-select set of chips that wraps onto new lines, for picking a value in a form
export function ChipGroup<T>({ label, options, selected, onSelect, errors }: ChipGroupProps<T>) {
  return (
    <View>
      <Text className="mb-2 font-iosevka-semibold text-sm text-bark">{label}</Text>
      <View className="flex-row flex-wrap gap-2">
        {options.map((option) => {
          const active = option.value === selected;
          return (
            <Pressable
              key={option.label}
              onPress={() => onSelect(option.value)}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              className={`rounded-full border px-4 py-2 active:opacity-70 ${
                active ? "border-leaf bg-leaf" : "border-leaf/40 bg-white"
              }`}
            >
              <Text className={`font-iosevka text-sm ${active ? "text-white" : "text-bark"}`}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {errors?.map((message) => (
        <Text key={message} className="mt-1 font-iosevka text-sm text-red-700">
          {message}
        </Text>
      ))}
    </View>
  );
}
