import { Image, ImageBackground, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Image as ExpoImage } from "expo-image";
import { router } from "expo-router";

type Feature = {
  emoji: string;
  title: string;
  description: string;
};

const FEATURES: Feature[] = [
  {
    emoji: "🌱",
    title: "Add & Record Trees",
    description: "Log native and exotic trees you find with species, location and condition.",
  },
  {
    emoji: "🗺️",
    title: "Browse the Catalogue",
    description: "Discover trees recorded by others, from your street to across Aotearoa.",
  },
  {
    emoji: "🔎",
    title: "Filter & Discover",
    description: "Search by species, genus, height, girth, region or significance status.",
  },
];

export default function HomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-sand">
      <StatusBar style="dark" />
      {/* expo-image is used here because React Native's Image can't decode AVIF on Android */}
      <ExpoImage
        source={require("../assets/Vintage_NewZealandMap.avif")}
        contentFit="cover"
        style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}
      />
      {/* Fades the busy map so the headings and buttons stay readable */}
      <View className="absolute inset-0 bg-sand/70" />
      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-12"
        showsVerticalScrollIndicator={false}
      >
        <ImageBackground
          source={require("../assets/Kauri_Forest.jpg")}
          resizeMode="cover"
          className="px-6 pb-10 pt-8"
        >
          {/* Darkens the busy forest photo so the white text stays readable */}
          <View className="absolute inset-0 bg-black/50" />
          <Image
            source={require("../assets/rakau-badge-green-transparent.png")}
            className="h-28 w-28"
            accessibilityLabel="Rākau"
          />
          <Text className="mt-4 font-iosevka text-lg text-white/90">
            Record. Discover. Protect Aotearoa's trees.
          </Text>
          <Text className="mt-4 font-iosevka text-base leading-6 text-white/80">
            Rākau helps home gardeners, arborists, council members, conservation groups and tree
            enthusiasts build a living catalogue of New Zealand's native and exotic trees.
          </Text>
        </ImageBackground>

        <View className="px-6 pt-6">
          <Text className="font-iosevka-semibold text-xl text-bark">What you can do</Text>

          <View className="mt-4 gap-4">
            {FEATURES.map((feature) => (
              <View
                key={feature.title}
                className="flex-row items-start gap-4 rounded-2xl border border-leaf/20 bg-white p-4 shadow-sm"
              >
                <Text className="text-3xl">{feature.emoji}</Text>
                <View className="flex-1">
                  <Text className="font-iosevka-semibold text-base text-bark">{feature.title}</Text>
                  <Text className="mt-1 font-iosevka text-sm leading-5 text-bark/70">
                    {feature.description}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          <View className="mt-8 gap-3">
            <Pressable
              onPress={() => router.push("/register")}
              className="items-center rounded-full bg-leaf px-6 py-4 active:opacity-80"
            >
              <Text className="font-iosevka-semibold text-base text-white">Get Started</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push("/trees")}
              className="items-center rounded-full border border-leaf px-6 py-4 active:opacity-70"
            >
              <Text className="font-iosevka-semibold text-base text-leaf">
                Browse the Catalogue
              </Text>
            </Pressable>
            <Pressable
              onPress={() => router.push("/login")}
              className="mt-2 items-center active:opacity-60"
            >
              <Text className="font-iosevka text-sm text-bark/70">
                Already have an account?{" "}
                <Text className="font-iosevka-semibold text-leaf">Log in</Text>
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
