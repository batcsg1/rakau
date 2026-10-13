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
import { router } from "expo-router";

import { login } from "../api/auth";
import { ApiError, type FieldErrors } from "../api/errors";
import { FormField } from "../components/FormField";

export default function LoginScreen() {
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
      router.replace("/trees");
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
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerClassName="px-6 pb-12" keyboardShouldPersistTaps="handled">
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
            className="self-start pt-4 active:opacity-60"
          >
            <Text className="text-base text-leaf font-iosevka-semibold">← Back</Text>
          </Pressable>

          <Text className="mt-6 text-3xl font-iosevka-bold text-bark">Welcome back</Text>
          <Text className="mt-1 text-sm text-bark/70 font-iosevka">
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

          {error && (
            <Text className="mt-4 text-sm text-red-700 font-iosevka">{error}</Text>
          )}

          <Pressable
            onPress={onSubmit}
            disabled={submitting || !email || !password}
            className="mt-8 items-center rounded-full bg-leaf px-6 py-4 active:opacity-80 disabled:opacity-50"
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-base font-iosevka-semibold text-white">Log in</Text>
            )}
          </Pressable>

          <Pressable
            onPress={() => router.replace("/register")}
            className="mt-6 items-center active:opacity-60"
          >
            <Text className="text-sm text-bark/70 font-iosevka">
              New to Rākau?{" "}
              <Text className="text-leaf font-iosevka-semibold">Create an account</Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
