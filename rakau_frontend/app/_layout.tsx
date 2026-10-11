import "../global.css";

import { useFonts } from "expo-font";
import { Stack } from "expo-router";

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    "Iosevka-Regular": require("../assets/fonts/IosevkaNerdFont-Regular.ttf"),
    "Iosevka-SemiBold": require("../assets/fonts/IosevkaNerdFont-SemiBold.ttf"),
    "Iosevka-Bold": require("../assets/fonts/IosevkaNerdFont-Bold.ttf"),
  });

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
