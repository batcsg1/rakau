import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { ApiError, type FieldErrors } from "../api/errors";
import { formatAddress, geocodeAddress, type AddressFields } from "../api/photonApi";
import { getSpecies } from "../api/speciesApi";
import type { Condition, Region, Significance, Species, Tree, TreeInput } from "../api/types";
import { AddressSection, canLookUp, type TreeLocation } from "./AddressSection";
import { ChipGroup } from "./ChipGroup";
import { FormField } from "./FormField";
import colors from "../constants/colors";
import {
  CONDITION_OPTIONS,
  LATITUDE_RANGE,
  LONGITUDE_RANGE,
  REGION_FORM_OPTIONS,
  SIGNIFICANCE_PICKER_OPTIONS,
  STATUS_OPTIONS,
} from "../constants/options";

// "" -> null (optional field left blank); "12,5" -> 12.5; anything unparsable -> NaN
function parseNumber(text: string): number | null {
  const trimmed = text.trim().replace(",", ".");
  return trimmed === "" ? null : Number(trimmed);
}

function isInRange(value: number | null, range: { min: number; max: number }): value is number {
  return value !== null && !Number.isNaN(value) && value >= range.min && value <= range.max;
}

// DRF sends decimals as strings ("30.00"); show them as "30" in the input
const toText = (value: string | number | null | undefined) =>
  value === null || value === undefined ? "" : String(Number(value));

type TreeFormProps = {
  // Pre-fills the fields when editing an existing tree
  initial?: Tree;
  submitLabel: string;
  // Throw an ApiError to show the API's per-field messages under the matching fields
  onSubmit: (input: TreeInput) => Promise<void>;
};

// The tree fields shared by the Add Tree and Edit Tree screens, with client-side checks
// that mirror the API's, and the API's own 400 messages shown under each field
export function TreeForm({ initial, submitLabel, onSubmit }: TreeFormProps) {
  const [species, setSpecies] = useState<Species[]>([]);
  const [speciesError, setSpeciesError] = useState<string | null>(null);
  const [speciesSearch, setSpeciesSearch] = useState("");

  const [speciesSlug, setSpeciesSlug] = useState<string | undefined>(initial?.species_slug);
  const [condition, setCondition] = useState<Condition | undefined>(initial?.condition);
  const [region, setRegion] = useState<Region | undefined>(initial?.region || undefined);
  const [isPresent, setIsPresent] = useState(initial?.is_present ?? true);
  const [significance, setSignificance] = useState<Significance>(
    initial?.significance_status ?? "none",
  );
  // No latitude/longitude fields: set from the address or the phone's location (UAT I7, #62)
  const [location, setLocation] = useState<TreeLocation | null>(
    initial ? { latitude: initial.latitude, longitude: initial.longitude, source: "saved" } : null,
  );
  const [height, setHeight] = useState(toText(initial?.height_m));
  const [girth, setGirth] = useState(toText(initial?.trunk_girth_cm));
  const [crownSpread, setCrownSpread] = useState(toText(initial?.crown_spread_m));
  const [address, setAddress] = useState<AddressFields>({
    street_address: initial?.street_address ?? "",
    suburb: initial?.suburb ?? "",
    city: initial?.city ?? "",
    postcode: initial?.postcode ?? "",
  });

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getSpecies()
      // Keep a tree's current species listed even if it has since been retired
      .then((all) => setSpecies(all.filter((s) => s.is_active || s.slug === initial?.species_slug)))
      .catch(() => setSpeciesError("Couldn't load the species list. Go back and try again."));
  }, [initial?.species_slug]);

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

  // Catches what the API would reject, so the user gets instant feedback without a round trip.
  // locationError is set when looking up a typed address failed
  const validate = (
    loc: TreeLocation | null,
    addr: AddressFields,
    regionValue: Region | undefined,
    locationError?: string,
  ): { input?: TreeInput; errors: FieldErrors } => {
    const errors: FieldErrors = {};
    const heightM = parseNumber(height);
    const girthCm = parseNumber(girth);
    const crownM = parseNumber(crownSpread);

    if (!speciesSlug) errors.species_slug = ["Choose a species."];
    if (!condition) errors.condition = ["Choose the tree's condition."];
    if (locationError) {
      errors.location = [locationError];
    } else if (!loc) {
      errors.location = [
        formatAddress(addr)
          ? "Add the city or post code so the address can be found, or use your current location."
          : "Add the tree's address, or use your current location.",
      ];
    } else if (
      !isInRange(loc.latitude, LATITUDE_RANGE) ||
      !isInRange(loc.longitude, LONGITUDE_RANGE)
    ) {
      errors.location = [
        "That location isn't valid. Pick the address again, or use your current location.",
      ];
    }
    if (Number.isNaN(heightM)) errors.height_m = ["Enter a number, e.g. 12.5"];
    if (Number.isNaN(girthCm)) errors.trunk_girth_cm = ["Enter a number, e.g. 240"];
    if (Number.isNaN(crownM)) errors.crown_spread_m = ["Enter a number, e.g. 8"];
    const postcode = addr.postcode.trim();
    if (postcode && !/^\d{4}$/.test(postcode)) {
      errors.postcode = ["Enter a 4-digit NZ post code."];
    }

    if (Object.keys(errors).length) return { errors };

    return {
      errors,
      input: {
        species_slug: speciesSlug!,
        condition: condition!,
        latitude: loc!.latitude,
        longitude: loc!.longitude,
        region: regionValue ?? "",
        street_address: addr.street_address.trim(),
        suburb: addr.suburb.trim(),
        city: addr.city.trim(),
        postcode,
        is_present: isPresent,
        significance_status: significance,
        height_m: heightM,
        trunk_girth_cm: girthCm,
        crown_spread_m: crownM,
      },
    };
  };

  // Places the tree at a typed address that hasn't been looked up yet, filling in any
  // address parts and region the lookup found. Returns an error message when it can't
  const lookUpTypedAddress = async (): Promise<
    { location: TreeLocation; address: AddressFields; region: Region | undefined } | string
  > => {
    let match;
    try {
      match = await geocodeAddress(formatAddress(address));
    } catch {
      return "Couldn't look up the address right now. Use your current location, or try again.";
    }
    if (!match) return "Couldn't find that address. Check it, or use your current location.";
    return {
      location: { latitude: match.latitude, longitude: match.longitude, source: "address" },
      address: {
        street_address: address.street_address || match.street_address,
        suburb: address.suburb || match.suburb,
        city: address.city || match.city,
        postcode: address.postcode || match.postcode,
      },
      region: region ?? match.region ?? undefined,
    };
  };

  const submit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      let loc = location;
      let addr = address;
      let regionValue = region;
      let locationError: string | undefined;
      if (!loc && canLookUp(address)) {
        const found = await lookUpTypedAddress();
        if (typeof found === "string") {
          locationError = found;
        } else {
          ({ location: loc, address: addr, region: regionValue } = found);
          setLocation(loc);
          setAddress(addr);
          setRegion(regionValue);
        }
      }

      const { input, errors } = validate(loc, addr, regionValue, locationError);
      setFieldErrors(errors);
      if (!input) {
        setError("Check the highlighted fields.");
        return;
      }

      await onSubmit(input);
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

  return (
    <View>
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

        <AddressSection
          value={address}
          onChange={setAddress}
          location={location}
          onLocationChange={(loc) => {
            // ~10 cm precision is plenty; GPS isn't more accurate than that anyway
            setLocation(
              loc && {
                ...loc,
                latitude: Number(loc.latitude.toFixed(6)),
                longitude: Number(loc.longitude.toFixed(6)),
              },
            );
            // A new location answers any earlier "add the address" message
            if (loc) {
              setFieldErrors(({ location: _l, latitude: _a, longitude: _o, ...rest }) => rest);
            }
          }}
          errors={fieldErrors}
          onRegionFound={setRegion}
        />

        <ChipGroup<Region | "">
          label="Region"
          options={REGION_FORM_OPTIONS}
          selected={region ?? ""}
          onSelect={(value) => setRegion(value || undefined)}
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
              hint="From the ground to the highest point of the tree."
              placeholder="e.g. 12.5"
              value={height}
              onChangeText={setHeight}
              keyboardType="decimal-pad"
              errors={fieldErrors.height_m}
            />
            <FormField
              label="Trunk girth (cm)"
              hint="The distance around the trunk, measured with a tape at 1.4 m above the ground (about chest height)."
              placeholder="e.g. 240"
              value={girth}
              onChangeText={setGirth}
              keyboardType="decimal-pad"
              errors={fieldErrors.trunk_girth_cm}
            />
            <FormField
              label="Crown spread (m)"
              hint="How wide the tree's leafy top is: the distance from one edge of the branches to the other, at the widest point."
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
        onPress={submit}
        disabled={submitting}
        className="mt-8 items-center rounded-full bg-leaf px-6 py-4 active:opacity-80 disabled:opacity-50"
      >
        {submitting ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text className="font-iosevka-semibold text-base text-white">{submitLabel}</Text>
        )}
      </Pressable>
    </View>
  );
}
