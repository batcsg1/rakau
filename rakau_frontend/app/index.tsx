import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

type Feature = {
  emoji: string;
  title: string;
  description: string;
};

const FEATURES: Feature[] = [
  {
    emoji: "🌱",
    title: "Add & Record Trees",
    description:
      "Log native and exotic trees you find with species, location and condition.",
  },
  {
    emoji: "🗺️",
    title: "Browse the Catalogue",
    description:
      "Discover trees recorded by others, from your street to across Aotearoa.",
  },
  {
    emoji: "📋",
    title: "Maintenance Records",
    description:
      "Keep a detailed history of health reports and arborist work on each tree.",
  },
  {
    emoji: "🔎",
    title: "Filter & Discover",
    description:
      "Search by species, genus, height, girth, region or significance status.",
  },
];

export default function HomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-sand">
      <StatusBar style="dark" />
      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-12"
        showsVerticalScrollIndicator={false}
      >
        <View className="bg-canopy px-6 pb-10 pt-8">
          <Text className="text-5xl">🌳</Text>
          <Text className="mt-4 text-4xl font-bold text-white">Rākau</Text>
          <Text className="mt-2 text-lg text-white/90">
            Record. Discover. Protect Aotearoa's trees.
          </Text>
          <Text className="mt-4 text-base leading-6 text-white/80">
            Rākau helps home gardeners, arborists, council members, conservation
            groups and tree enthusiasts build a living catalogue of New
            Zealand's native and exotic trees.
          </Text>
        </View>

        <View className="px-6 pt-6">
          <Text className="text-xl font-semibold text-bark">
            What you can do
          </Text>

          <View className="mt-4 gap-4">
            {FEATURES.map((feature) => (
              <View
                key={feature.title}
                className="flex-row items-start gap-4 rounded-2xl border border-leaf/20 bg-white p-4 shadow-sm"
              >
                <Text className="text-3xl">{feature.emoji}</Text>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-bark">
                    {feature.title}
                  </Text>
                  <Text className="mt-1 text-sm leading-5 text-bark/70">
                    {feature.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <View className="mt-8 gap-3">
            <Pressable className="items-center rounded-full bg-leaf px-6 py-4 active:opacity-80">
              <Text className="text-base font-semibold text-white">
                Get Started
              </Text>
            </Pressable>
            <Pressable className="items-center rounded-full border border-leaf px-6 py-4 active:opacity-70">
              <Text className="text-base font-semibold text-leaf">
                Browse the Catalogue
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
