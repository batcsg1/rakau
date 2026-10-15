import { Pressable, Text } from "react-native";
import { router, type Href } from "expo-router";

type BackButtonProps = {
  // Where to go when there's no history, e.g. the screen was opened from a link
  fallback: Href;
  className?: string;
};

export function BackButton({ fallback, className = "self-start pt-4" }: BackButtonProps) {
  return (
    <Pressable
      onPress={() => (router.canGoBack() ? router.back() : router.replace(fallback))}
      className={`${className} active:opacity-60`}
    >
      <Text className="font-iosevka-semibold text-base text-leaf">← Back</Text>
    </Pressable>
  );
}
