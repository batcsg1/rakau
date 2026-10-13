import { useEffect, useMemo, useState } from "react";
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

import { isLoggedIn } from "../../api/auth";
import { ApiError, type FieldErrors } from "../../api/errors";
import { getSpecies } from "../../api/speciesApi";
import { createTree } from "../../api/treesApi";
import {
  CONDITION_LABELS,
  REGION_LABELS,
  type Condition,
  type Region,
  type Species,
  type TreeInput,
} from "../../api/types";
import { ChipGroup } from "../../components/ChipGroup";
import { FormField } from "../../components/FormField";

const CONDITION_OPTIONS = Object.entries(CONDITION_LABELS).map(([value, label]) => ({
  value: value as Condition,
  label,
}));

const REGION_OPTIONS = Object.entries(REGION_LABELS).map(([value, label]) => ({
  value: value as Region,
  label,
}));

const STATUS_OPTIONS = [
  { value: true, label: "Present" },
  { value: false, label: "Removed" },
];

// "" -> null (optional field left blank); "12,5" -> 12.5; anything unparsable -> NaN
function parseNumber(text: string): number | null {
  const trimmed = text.trim().replace(",", ".");
  return trimmed === "" ? null : Number(trimmed);
}

export default function NewTreeScreen() {
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [species, setSpecies] = useState<Species[]>([]);
  const [speciesError, setSpeciesError] = useState<string | null>(null);
  const [speciesSearch, setSpeciesSearch] = useState("");

  const [speciesSlug, setSpeciesSlug] = useState<string>();
  const [condition, setCondition] = useState<Condition>();
  const [region, setRegion] = useState<Region>();
  const [isPresent, setIsPresent] = useState(true);
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [height, setHeight] = useState("");
  const [girth, setGirth] = useState("");
  const [crownSpread, setCrownSpread] = useState("");

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Only signed-in users can record trees; come back here after logging in
  useEffect(() => {
    isLoggedIn().then((loggedIn) => {
      if (loggedIn) {
        setCheckingAuth(false);
      } else {
        router.replace({ pathname: "/login", params: { next: "/trees/new" } });
      }
    });
  }, []);

  useEffect(() => {
    getSpecies()
      .then((all) => setSpecies(all.filter((s) => s.is_active)))
      .catch(() => setSpeciesError("Couldn't load the species list. Go back and try again."));
  }, []);

  const speciesOptions = useMemo(() => {
    const query = speciesSearch.trim().toLowerCase();
    return species
      .filter(
        (s) =>
          !query ||
          s.common_name.toLowerCase().includes(query) ||
          s.scientific_name.toLowerCase().includes(query) ||
          // Keep the chosen species visible even when the search no longer matches it
          s.slug === speciesSlug,
      )
      .map((s) => ({ value: s.slug, label: s.common_name }));
  }, [species, speciesSearch, speciesSlug]);

  // Catches what the API would reject, so the user gets instant feedback without a round trip
  const validate = (): { input?: TreeInput; errors: FieldErrors } => {
    const errors: FieldErrors = {};
    const lat = parseNumber(latitude);
    const lng = parseNumber(longitude);
    const heightM = parseNumber(height);
    const girthCm = parseNumber(girth);
    const crownM = parseNumber(crownSpread);

    if (!speciesSlug) errors.species_slug = ["Choose a species."];
    if (!condition) errors.condition = ["Choose the tree's condition."];
    if (lat === null || Number.isNaN(lat) || lat < -90 || lat > 90) {
      errors.latitude = ["Enter a latitude between -90 and 90."];
    }
    if (lng === null || Number.isNaN(lng) || lng < -180 || lng > 180) {
      errors.longitude = ["Enter a longitude between -180 and 180."];
    }
    if (Number.isNaN(heightM)) errors.height_m = ["Enter a number, e.g. 12.5"];
    if (Number.isNaN(girthCm)) errors.trunk_girth_cm = ["Enter a number, e.g. 240"];
    if (Number.isNaN(crownM)) errors.crown_spread_m = ["Enter a number, e.g. 8"];

    if (Object.keys(errors).length) return { errors };

    return {
      errors,
      input: {
        species_slug: speciesSlug!,
        condition: condition!,
        latitude: lat!,
        longitude: lng!,
        region: region ?? "",
        is_present: isPresent,
        height_m: heightM,
        trunk_girth_cm: girthCm,
        crown_spread_m: crownM,
      },
    };
  };

  const onSubmit = async () => {
    setError(null);
    const { input, errors } = validate();
    setFieldErrors(errors);
    if (!input) {
      setError("Check the highlighted fields.");
      return;
    }

    setSubmitting(true);
    try {
      const tree = await createTree(input);
      router.replace({ pathname: "/trees/mine", params: { added: String(tree.id) } });
    } catch (e) {
      if (e instanceof ApiError) {
        const { non_field_errors, ...rest } = e.fieldErrors;
        setFieldErrors(rest);
        setError(non_field_errors?.join(" ") ?? (Object.keys(rest).length ? "Check the highlighted fields." : e.message));
      } else {
        setError("Couldn't reach the server. Check your connection and try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (checkingAuth) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-sand">
        <ActivityIndicator color="#2E7D32" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-sand">
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerClassName="px-6 pb-12" keyboardShouldPersistTaps="handled">
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace("/trees"))}
            className="self-start pt-4 active:opacity-60"
          >
            <Text className="text-base text-leaf font-iosevka-semibold">← Back</Text>
          </Pressable>

          <Text className="mt-6 text-3xl font-iosevka-bold text-bark">Record a tree</Text>
          <Text className="mt-1 text-sm text-bark/70 font-iosevka">
            Fields marked * are required.
          </Text>

          <View className="mt-8 gap-6">
            <View>
              <FormField
                label="Species *"
                placeholder="Search species…"
                value={speciesSearch}
                onChangeText={setSpeciesSearch}
                autoCorrect={false}
              />
              <View className="mt-3">
                {speciesError ? (
                  <Text className="text-sm text-red-700 font-iosevka">{speciesError}</Text>
                ) : species.length === 0 ? (
                  <ActivityIndicator color="#2E7D32" />
                ) : speciesOptions.length === 0 ? (
                  <Text className="text-sm text-bark/70 font-iosevka">
                    No species match "{speciesSearch}".
                  </Text>
                ) : (
                  <ChipGroup
                    label="Choose one"
                    options={speciesOptions}
                    selected={speciesSlug}
                    onSelect={setSpeciesSlug}
                    errors={fieldErrors.species_slug}
                  />
                )}
              </View>
            </View>

            <ChipGroup
              label="Condition *"
              options={CONDITION_OPTIONS}
              selected={condition}
              onSelect={setCondition}
              errors={fieldErrors.condition}
            />

            <View>
              <Text className="mb-2 text-base font-iosevka-semibold text-bark">Location</Text>
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <FormField
                    label="Latitude *"
                    placeholder="-45.8788"
                    value={latitude}
                    onChangeText={setLatitude}
                    keyboardType="numbers-and-punctuation"
                    errors={fieldErrors.latitude}
                  />
                </View>
                <View className="flex-1">
                  <FormField
                    label="Longitude *"
                    placeholder="170.5028"
                    value={longitude}
                    onChangeText={setLongitude}
                    keyboardType="numbers-and-punctuation"
                    errors={fieldErrors.longitude}
                  />
                </View>
              </View>
            </View>

            <ChipGroup
              label="Region"
              options={REGION_OPTIONS}
              selected={region}
              onSelect={(value) => setRegion(value === region ? undefined : value)}
              errors={fieldErrors.region}
            />

            <ChipGroup
              label="Status"
              options={STATUS_OPTIONS}
              selected={isPresent}
              onSelect={setIsPresent}
              errors={fieldErrors.is_present}
            />

            <View>
              <Text className="mb-2 text-base font-iosevka-semibold text-bark">
                Measurements (optional)
              </Text>
              <View className="gap-4">
                <FormField
                  label="Height (m)"
                  placeholder="e.g. 12.5"
                  value={height}
                  onChangeText={setHeight}
                  keyboardType="decimal-pad"
                  errors={fieldErrors.height_m}
                />
                <FormField
                  label="Trunk girth (cm)"
                  placeholder="e.g. 240"
                  value={girth}
                  onChangeText={setGirth}
                  keyboardType="decimal-pad"
                  errors={fieldErrors.trunk_girth_cm}
                />
                <FormField
                  label="Crown spread (m)"
                  placeholder="e.g. 8"
                  value={crownSpread}
                  onChangeText={setCrownSpread}
                  keyboardType="decimal-pad"
                  errors={fieldErrors.crown_spread_m}
                />
              </View>
            </View>
          </View>

          {error && <Text className="mt-6 text-sm text-red-700 font-iosevka">{error}</Text>}

          <Pressable
            onPress={onSubmit}
            disabled={submitting}
            className="mt-8 items-center rounded-full bg-leaf px-6 py-4 active:opacity-80 disabled:opacity-50"
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-base font-iosevka-semibold text-white">Save tree</Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
