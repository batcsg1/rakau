import { useEffect, useState } from "react";
import { Keyboard, Pressable, ScrollView, Text, TextInput, View } from "react-native";

import colors from "../constants/colors";

// Wait for a pause in typing before asking for suggestions
const SUGGESTION_DELAY_MS = 300;

type TextFilterProps = {
  label: string;
  placeholder: string;
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  // Optional matches to pick from while typing, e.g. usernames
  fetchSuggestions?: (text: string, signal: AbortSignal) => Promise<string[]>;
};

// Labelled free-text filter. Like RangeFilter, it's only applied when the user finishes
// typing or picks a suggestion, so a half-typed name doesn't filter on every keystroke.
// The parent list needs keyboardShouldPersistTaps="handled", or the first tap on a
// suggestion only closes the keyboard
export function TextFilter({
  label,
  placeholder,
  value,
  onChange,
  fetchSuggestions,
}: TextFilterProps) {
  const [draft, setDraft] = useState(value ?? "");
  const [applied, setApplied] = useState(value);
  // Only set from typing, so picking a suggestion doesn't search again
  const [searchText, setSearchText] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const closeSuggestions = () => {
    setSearchText("");
    setSuggestions([]);
  };

  // Follow outside changes, e.g. a cleared chip or "Clear filters"
  if (applied !== value) {
    setApplied(value);
    setDraft(value ?? "");
    closeSuggestions();
  }

  useEffect(() => {
    if (!fetchSuggestions || !searchText) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetchSuggestions(searchText, controller.signal)
        .then((matches) => {
          if (!controller.signal.aborted) setSuggestions(matches);
        })
        .catch(() => {
          // Suggestions are only a shortcut: typing the name in still works
          if (!controller.signal.aborted) setSuggestions([]);
        });
    }, SUGGESTION_DELAY_MS);

    // A newer keystroke cancels both the wait and any request already in flight
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [fetchSuggestions, searchText]);

  const onChangeText = (text: string) => {
    setDraft(text);
    setSearchText(text.trim());
    if (!text.trim()) setSuggestions([]);
  };

  const commit = () => {
    closeSuggestions();
    const text = draft.trim() || undefined;
    if (text !== value) {
      onChange(text);
    } else {
      setDraft(text ?? "");
    }
  };

  const pick = (suggestion: string) => {
    setDraft(suggestion);
    closeSuggestions();
    if (suggestion !== value) onChange(suggestion);
    Keyboard.dismiss();
  };

  return (
    <View className="mt-4 px-6">
      <Text className="font-iosevka-semibold text-sm text-bark/70">{label}</Text>
      <TextInput
        value={draft}
        onChangeText={onChangeText}
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
      {suggestions.length > 0 && (
        // Capped at about four rows and scrolls itself, so a long list doesn't take over the
        // screen. nestedScrollEnabled lets it scroll on Android inside the catalogue's list
        <ScrollView
          nestedScrollEnabled
          persistentScrollbar
          keyboardShouldPersistTaps="handled"
          className="mt-2 max-h-44 rounded-xl border border-leaf/30 bg-white"
        >
          {suggestions.map((suggestion, index) => (
            <Pressable
              key={suggestion}
              onPress={() => pick(suggestion)}
              accessibilityRole="button"
              className={`px-4 py-3 active:bg-sand ${index > 0 ? "border-t border-leaf/10" : ""}`}
            >
              <Text className="font-iosevka text-sm text-bark">{suggestion}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
