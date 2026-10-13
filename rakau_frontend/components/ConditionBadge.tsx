import { Text, View } from "react-native";

import { CONDITION_LABELS, type Condition } from "../api/types";

const CONDITION_BADGE: Record<Condition, string> = {
  healthy: "bg-leaf",
  stressed: "bg-amber-600",
  diseased: "bg-red-700",
  dead: "bg-stone-500",
};

// Colour-coded pill for a tree's condition, shared by the list and detail screens
export function ConditionBadge({ condition }: { condition: Condition }) {
  return (
    <View className={`rounded-full px-3 py-1 ${CONDITION_BADGE[condition]}`}>
      <Text className="text-xs font-iosevka-semibold text-white">
        {CONDITION_LABELS[condition]}
      </Text>
    </View>
  );
}
