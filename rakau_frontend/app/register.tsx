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
import { router, useLocalSearchParams } from "expo-router";

import { register } from "../api/auth";
import { ApiError, type FieldErrors } from "../api/errors";
import { safeNext } from "../api/navigation";
import { FormField } from "../components/FormField";

export default function RegisterScreen() {
  // Set when a protected screen sent the user here, e.g. /login?next=/trees/new
  const { next } = useLocalSearchParams<{ next?: string }>();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    setError(null);
    // Checked here because the API only receives one password
    if (password !== confirmPassword) {
      setFieldErrors({ confirm_password: ["Passwords don't match."] });
      return;
    }

    setSubmitting(true);
    setFieldErrors({});
    try {
      await register({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        username: username.trim(),
        email: email.trim(),
        password,
      });
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

          <Text className="mt-6 text-3xl font-iosevka-bold text-bark">Create an account</Text>
          <Text className="mt-1 text-sm text-bark/70 font-iosevka">
            Start recording the trees around you.
          </Text>

          <View className="mt-8 gap-4">
            <View className="flex-row gap-3">
              <View className="flex-1">
                <FormField
                  label="First name"
                  value={firstName}
                  onChangeText={setFirstName}
                  autoCapitalize="words"
                  autoComplete="given-name"
                  textContentType="givenName"
                  errors={fieldErrors.first_name}
                />
              </View>
              <View className="flex-1">
                <FormField
                  label="Last name"
                  value={lastName}
                  onChangeText={setLastName}
                  autoCapitalize="words"
                  autoComplete="family-name"
                  textContentType="familyName"
                  errors={fieldErrors.last_name}
                />
              </View>
            </View>
            <FormField
              label="Username"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="username-new"
              textContentType="username"
              errors={fieldErrors.username}
            />
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
              autoComplete="new-password"
              textContentType="newPassword"
              errors={fieldErrors.password}
            />
            <FormField
              label="Confirm password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoComplete="new-password"
              textContentType="newPassword"
              returnKeyType="go"
              onSubmitEditing={onSubmit}
              errors={fieldErrors.confirm_password}
            />
          </View>

          {fieldErrors.non_field_errors?.map((message) => (
            <Text key={message} className="mt-4 text-sm text-red-700 font-iosevka">
              {message}
            </Text>
          ))}
          {error && (
            <Text className="mt-4 text-sm text-red-700 font-iosevka">{error}</Text>
          )}

          <Pressable
            onPress={onSubmit}
            disabled={
              submitting ||
              !firstName.trim() ||
              !lastName.trim() ||
              !username ||
              !email ||
              !password ||
              !confirmPassword
            }
            className="mt-8 items-center rounded-full bg-leaf px-6 py-4 active:opacity-80 disabled:opacity-50"
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-base font-iosevka-semibold text-white">
                Create account
              </Text>
            )}
          </Pressable>

          <Pressable
            onPress={() => router.replace({ pathname: "/login", params: next ? { next } : {} })}
            className="mt-6 items-center active:opacity-60"
          >
            <Text className="text-sm text-bark/70 font-iosevka">
              Already have an account?{" "}
              <Text className="text-leaf font-iosevka-semibold">Log in</Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
