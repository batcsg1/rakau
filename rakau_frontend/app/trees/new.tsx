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

import { ApiError, type FieldErrors } from "../../api/errors";
import { getSpecies } from "../../api/speciesApi";
import { createTree } from "../../api/treesApi";
import type { Condition, Region, Significance, Species, TreeInput } from "../../api/types";
import { BackButton } from "../../components/BackButton";
import { NavBar } from "../../components/NavBar";
import { ChipGroup } from "../../components/ChipGroup";
import { FormField } from "../../components/FormField";
import colors from "../../constants/colors";
import {
  CONDITION_OPTIONS,
  LATITUDE_RANGE,
  LONGITUDE_RANGE,
  REGION_OPTIONS,
  SIGNIFICANCE_PICKER_OPTIONS,
  STATUS_OPTIONS,
} from "../../constants/options";
import { useRequireAuth } from "../../hooks/useRequireAuth";

// "" -> null (optional field left blank); "12,5" -> 12.5; anything unparsable -> NaN
function parseNumber(text: string): number | null {
  const trimmed = text.trim().replace(",", ".");
  return trimmed === "" ? null : Number(trimmed);
}

function isInRange(value: number | null, range: { min: number; max: number }): value is number {
  return value !== null && !Number.isNaN(value) && value >= range.min && value <= range.max;
}

export default function NewTreeScreen() {
  // Only signed-in users can record trees; come back here after logging in
  const checkingAuth = useRequireAuth("/trees/new");

  const [species, setSpecies] = useState<Species[]>([]);
  const [speciesError, setSpeciesError] = useState<string | null>(null);
  const [speciesSearch, setSpeciesSearch] = useState("");

  const [speciesSlug, setSpeciesSlug] = useState<string>();
  const [condition, setCondition] = useState<Condition>();
  const [region, setRegion] = useState<Region>();
  const [isPresent, setIsPresent] = useState(true);
  const [significance, setSignificance] = useState<Significance>("none");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [height, setHeight] = useState("");
  const [girth, setGirth] = useState("");
  const [crownSpread, setCrownSpread] = useState("");

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
    if (!isInRange(lat, LATITUDE_RANGE)) {
      errors.latitude = [
        `Enter a latitude between ${LATITUDE_RANGE.min} and ${LATITUDE_RANGE.max}.`,
      ];
    }
    if (!isInRange(lng, LONGITUDE_RANGE)) {
      errors.longitude = [
        `Enter a longitude between ${LONGITUDE_RANGE.min} and ${LONGITUDE_RANGE.max}.`,
      ];
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
        latitude: lat as number,
        longitude: lng as number,
        region: region ?? "",
        is_present: isPresent,
        significance_status: significance,
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
        setError(
          non_field_errors?.join(" ") ??
            (Object.keys(rest).length ? "Check the highlighted fields." : e.message),
        );
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
        <ActivityIndicator color={colors.leaf} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-sand">
      <StatusBar style="dark" />
      <NavBar />
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
                  <Text className="font-iosevka text-sm text-red-700">{speciesError}</Text>
                ) : species.length === 0 ? (
                  <ActivityIndicator color={colors.leaf} />
                ) : speciesOptions.length === 0 ? (
                  <Text className="font-iosevka text-sm text-bark/70">
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
              <Text className="mb-2 font-iosevka-semibold text-base text-bark">Location</Text>
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

            <ChipGroup
              label="Significance"
              options={SIGNIFICANCE_PICKER_OPTIONS}
              selected={significance}
              onSelect={setSignificance}
              errors={fieldErrors.significance_status}
            />

            <View>
              <Text className="mb-2 font-iosevka-semibold text-base text-bark">
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

          {error && <Text className="mt-6 font-iosevka text-sm text-red-700">{error}</Text>}

          <Pressable
            onPress={onSubmit}
            disabled={submitting}
            className="mt-8 items-center rounded-full bg-leaf px-6 py-4 active:opacity-80 disabled:opacity-50"
          >
            {submitting ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text className="font-iosevka-semibold text-base text-white">Save tree</Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
