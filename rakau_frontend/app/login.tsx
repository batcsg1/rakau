import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Image as ExpoImage } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";

import { login } from "../api/auth";
import { ApiError, type FieldErrors } from "../api/errors";
import { safeNext } from "../api/navigation";
import { BackButton } from "../components/BackButton";
import { FormField } from "../components/FormField";
import colors from "../constants/colors";

export default function LoginScreen() {
  // Set when a protected screen sent the user here, e.g. /login?next=/trees/new
  const { next } = useLocalSearchParams<{ next?: string }>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    setSubmitting(true);
    setError(null);
    setFieldErrors({});
    try {
      await login(email.trim(), password);
      router.replace(safeNext(next));
    } catch (e) {
      if (e instanceof ApiError) {
        setFieldErrors(e.fieldErrors);
        setError(Object.keys(e.fieldErrors).length ? null : e.message);
      } else {
        setError("Couldn't reach the server. Check your connection and try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-sand">
      <StatusBar style="dark" />
      {/* ImageBackground is deprecated in SDK 58, so the photo is an absolutely positioned
          expo-image behind the content, matching the other screens */}
      <ExpoImage
        source={require("../assets/dunedin_botanic_garden_foreground.jpg")}
        contentFit="cover"
        style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}
      />
      {/* Fades the photo so the form stays readable */}
      <View className="absolute inset-0 bg-sand/80" />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerClassName="px-6 pb-12" keyboardShouldPersistTaps="handled">
          <BackButton fallback="/" />

          <Text className="mt-6 font-iosevka-bold text-3xl text-bark">Welcome back</Text>
          <Text className="mt-1 font-iosevka text-sm text-bark/70">
            Log in to record and manage your trees.
          </Text>

          <View className="mt-8 gap-4">
            <FormField
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
              errors={fieldErrors.email}
            />
            <FormField
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="current-password"
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={onSubmit}
              errors={fieldErrors.password}
            />
          </View>

          {error && <Text className="mt-4 font-iosevka text-sm text-red-700">{error}</Text>}

          <Pressable
            onPress={onSubmit}
            disabled={submitting || !email || !password}
            className="mt-8 items-center rounded-full bg-leaf px-6 py-4 active:opacity-80 disabled:opacity-50"
          >
            {submitting ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text className="font-iosevka-semibold text-base text-white">Log in</Text>
            )}
          </Pressable>

          <Pressable
            onPress={() => router.replace({ pathname: "/register", params: next ? { next } : {} })}
            className="mt-6 items-center active:opacity-60"
          >
            <Text className="font-iosevka text-sm text-bark/70">
              New to Rākau?{" "}
              <Text className="font-iosevka-semibold text-leaf">Create an account</Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
