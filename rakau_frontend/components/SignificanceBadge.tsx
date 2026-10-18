import { Text, View } from "react-native";

import { SIGNIFICANCE_LABELS, type Significance } from "../api/types";

// Kept clear of the ConditionBadge colours so the two pills never look alike
const SIGNIFICANCE_BADGE: Record<Exclude<Significance, "none">, string> = {
  locally_notable: "bg-sky-700",
  heritage: "bg-violet-700",
  protected: "bg-indigo-900",
};

// Pill for a notable tree, shared by the list and detail screens; renders nothing for "none"
export function SignificanceBadge({ significance }: { significance: Significance }) {
  if (significance === "none") return null;

  return (
    <View className={`rounded-full px-3 py-1 ${SIGNIFICANCE_BADGE[significance]}`}>
      <Text className="font-iosevka-semibold text-xs text-white">
        {SIGNIFICANCE_LABELS[significance]}
      </Text>
    </View>
  );
}
