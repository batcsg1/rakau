import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Image as ExpoImage } from "expo-image";
import { router } from "expo-router";

import { createTree } from "../../api/treesApi";
import type { TreeInput } from "../../api/types";
import { BackButton } from "../../components/BackButton";
import { NavBar } from "../../components/NavBar";
import { TreeForm } from "../../components/TreeForm";
import colors from "../../constants/colors";
import { useRequireAuth } from "../../hooks/useRequireAuth";

export default function NewTreeScreen() {
  // Only signed-in users can record trees; come back here after logging in
  const checkingAuth = useRequireAuth("/trees/new");
  const insets = useSafeAreaInsets();

  const onSubmit = async (input: TreeInput) => {
    const tree = await createTree(input);
    router.replace({ pathname: "/trees/mine", params: { added: String(tree.id) } });
  };

  if (checkingAuth) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-sand">
        <ActivityIndicator color={colors.leaf} />
      </SafeAreaView>
    );
  }

  return (
    // The top inset is applied to the nav bar's wrapper instead, so the solid sand runs up
    // behind the status bar rather than leaving a strip of the faded photo above the nav bar
    <SafeAreaView edges={["left", "right", "bottom"]} className="flex-1 bg-sand">
      <StatusBar style="dark" />
      {/* ImageBackground is deprecated in SDK 58, so the photo is an absolutely positioned
          expo-image behind the content, matching the catalogue */}
      <ExpoImage
        source={require("../../assets/upper_botanic_gardens_dunedin.jpg")}
        contentFit="cover"
        style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}
      />
      {/* Fades the photo so the form stays readable */}
      <View className="absolute inset-0 bg-sand/80" />
      <View style={{ paddingTop: insets.top }} className="bg-sand">
        <NavBar />
      </View>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerClassName="px-6 pb-12" keyboardShouldPersistTaps="handled">
          <BackButton fallback="/trees" />

          <Text className="mt-6 font-iosevka-bold text-3xl text-bark">Record a tree</Text>
          <Text className="mt-1 font-iosevka text-sm text-bark/70">
            Fields marked * are required.
          </Text>

          <TreeForm submitLabel="Save tree" onSubmit={onSubmit} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
