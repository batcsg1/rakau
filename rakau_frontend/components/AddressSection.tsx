import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import { DeviceLocationError, getCurrentPosition } from "../api/deviceLocation";
import type { FieldErrors } from "../api/errors";
import type { Region } from "../api/types";
import {
  formatAddress,
  geocodeAddress,
  isInNz,
  reverseGeocode,
  searchAddresses,
  type AddressFields,
  type AddressLookup,
  type AddressSuggestion,
} from "../api/photonApi";
import colors from "../constants/colors";
import { FormField } from "./FormField";

// Wait for a pause in typing, and for enough text to be useful, before asking Photon
const SEARCH_DELAY_MS = 300;
const MIN_SEARCH_LENGTH = 3;

const LOOKUP_UNAVAILABLE =
  "Address suggestions aren't available right now. You can still type the address in.";

// The tree's coordinates, which the form no longer shows (UAT I7, #62), and where they came from:
// - "gps": the phone's position, i.e. the tree itself, so editing the address doesn't move it
// - "address": an address point (the middle of a property or street), redone if the address changes
// - "saved": the position already saved on a tree being edited, kept like "gps"
export type TreeLocation = {
  latitude: number;
  longitude: number;
  source: "gps" | "address" | "saved";
  accuracyM?: number | null;
};

// A typed address needs a city or post code before it's looked up, so a bare street name
// can't match a street of the same name in another city (UAT I9)
export function canLookUp(address: AddressFields): boolean {
  return !!formatAddress(address) && !!(address.city.trim() || address.postcode.trim());
}

// What the status line says about the location, so the user can tell what will be saved
function describe(location: TreeLocation | null, address: AddressFields): string {
  if (!location) {
    if (canLookUp(address)) return "The tree will be placed at this address when you save.";
    if (formatAddress(address)) return "Add the city or post code so the address can be found.";
    return "Pick an address from the suggestions, or use your current location at the tree.";
  }
  if (location.source === "gps") {
    const accuracy = location.accuracyM ? ` (±${Math.round(location.accuracyM)} m)` : "";
    return `Location set from where you're standing${accuracy}. Check you're at the tree.`;
  }
  if (location.source === "saved") return "Using the location saved with this tree.";
  return (
    "Location set from the address. That's the middle of the property or street, " +
    "so use your current location if you're standing at the tree."
  );
}

type AddressSectionProps = {
  value: AddressFields;
  onChange: (value: AddressFields) => void;
  location: TreeLocation | null;
  onLocationChange: (location: TreeLocation | null) => void;
  // "location" holds the form's own message; latitude/longitude are the API's, shown here
  // because there are no coordinate fields any more
  errors: FieldErrors;
  // Called when a picked or looked-up address tells us which region the tree is in
  onRegionFound: (region: Region) => void;
};

// The tree's location: a street address with Photon suggestions while typing, and a
// "Use my current location" button. The coordinates are set in the background from whichever
// the user gives, and the status line underneath says which one will be saved
export function AddressSection({
  value,
  onChange,
  location,
  onLocationChange,
  errors,
  onRegionFound,
}: AddressSectionProps) {
  // Only set from typing, so filling the fields from a suggestion doesn't search again
  const [searchText, setSearchText] = useState("");
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (searchText.length < MIN_SEARCH_LENGTH) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setSearching(true);
      searchAddresses(searchText, controller.signal)
        .then(setSuggestions)
        .catch(() => {
          if (!controller.signal.aborted) setMessage(LOOKUP_UNAVAILABLE);
        })
        .finally(() => {
          if (!controller.signal.aborted) setSearching(false);
        });
    }, SEARCH_DELAY_MS);

    // A newer keystroke cancels both the wait and any request already in flight
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchText]);

  // Typing changes the address, so a location taken from the old address no longer applies
  const set = (field: keyof AddressFields) => (text: string) => {
    onChange({ ...value, [field]: text });
    if (location?.source === "address") onLocationChange(null);
  };

  const onStreetChange = (text: string) => {
    set("street_address")(text);
    setMessage(null);
    const query = text.trim();
    setSearchText(query.length >= MIN_SEARCH_LENGTH ? query : "");
    if (query.length < MIN_SEARCH_LENGTH) {
      setSuggestions([]);
      setSearching(false);
    }
  };

  const pick = (suggestion: AddressSuggestion) => {
    const { street_address, suburb, city, postcode, region } = suggestion;
    onChange({ street_address, suburb, city, postcode });
    if (region) onRegionFound(region);
    // A GPS fix is the tree itself, so the picked address only labels it
    if (location?.source !== "gps") {
      onLocationChange({
        latitude: suggestion.latitude,
        longitude: suggestion.longitude,
        source: "address",
      });
    }
    setSearchText("");
    setSuggestions([]);
    setSearching(false);
  };

  // Fills the address fields from a lookup, keeping anything it couldn't find
  const applyLookup = (address: AddressLookup) => {
    onChange({
      street_address: address.street_address || value.street_address,
      suburb: address.suburb || value.suburb,
      city: address.city || value.city,
      postcode: address.postcode || value.postcode,
    });
    if (address.region) onRegionFound(address.region);
    setSuggestions([]);
    setSearchText("");
  };

  // The phone's GPS position becomes the tree's location, then the address there is looked up
  const locateFromDevice = async () => {
    setMessage(null);
    setLocating(true);
    try {
      let position;
      try {
        position = await getCurrentPosition();
      } catch (e) {
        setMessage(e instanceof DeviceLocationError ? e.message : "Couldn't get your location.");
        return;
      }
      if (!isInNz(position.latitude, position.longitude)) {
        setMessage(
          "Your location is outside New Zealand (emulators often report California). " +
            "Type the tree's address in instead.",
        );
        return;
      }
      onLocationChange({
        latitude: position.latitude,
        longitude: position.longitude,
        source: "gps",
        accuracyM: position.accuracyM,
      });
      try {
        const address = await reverseGeocode(position.latitude, position.longitude);
        if (address) applyLookup(address);
        else setMessage("No address found here, so you can type it in.");
      } catch {
        // The GPS location is already set; only the address lookup failed
        setMessage(LOOKUP_UNAVAILABLE);
      }
    } finally {
      setLocating(false);
    }
  };

  // Swaps a GPS or saved location for the typed address's own position
  const locateFromAddress = async () => {
    setMessage(null);
    setLocating(true);
    try {
      const match = await geocodeAddress(formatAddress(value));
      if (!match) {
        setMessage("Couldn't find that address. Check it, or use your current location.");
        return;
      }
      onLocationChange({ latitude: match.latitude, longitude: match.longitude, source: "address" });
      applyLookup(match);
    } catch {
      setMessage(LOOKUP_UNAVAILABLE);
    } finally {
      setLocating(false);
    }
  };

  const locationErrors = [
    ...(errors.location ?? []),
    ...(errors.latitude ?? []),
    ...(errors.longitude ?? []),
  ];

  return (
    <View>
      <View className="mb-2 flex-row items-center justify-between gap-3">
        <Text className="font-iosevka-semibold text-base text-bark">Location *</Text>
        <Pressable
          onPress={locateFromDevice}
          disabled={locating}
          className="rounded-full border border-leaf px-4 py-1.5 active:opacity-70 disabled:opacity-50"
        >
          {locating ? (
            <ActivityIndicator color={colors.leaf} />
          ) : (
            <Text className="font-iosevka-semibold text-sm text-leaf">Use my current location</Text>
          )}
        </Pressable>
      </View>

      <View
        className={`mb-4 rounded-xl border px-4 py-3 ${
          locationErrors.length ? "border-red-700 bg-red-100" : "border-leaf/30 bg-leaf/10"
        }`}
      >
        <Text className="font-iosevka text-sm text-bark">{describe(location, value)}</Text>
        {location && location.source !== "address" && canLookUp(value) && (
          <Pressable onPress={locateFromAddress} disabled={locating} className="mt-2 self-start">
            <Text className="font-iosevka-semibold text-sm text-leaf underline">
              Use the address instead
            </Text>
          </Pressable>
        )}
        {locationErrors.map((error) => (
          <Text key={error} className="mt-1 font-iosevka text-sm text-red-700">
            {error}
          </Text>
        ))}
      </View>

      <View className="gap-4">
        <View>
          <FormField
            label="Street address"
            placeholder="Start typing, e.g. 51 Union Street"
            value={value.street_address}
            onChangeText={onStreetChange}
            autoCorrect={false}
            errors={errors.street_address}
          />
          {searching && <ActivityIndicator className="mt-2 self-start" color={colors.leaf} />}
          {suggestions.length > 0 && (
            <View className="mt-2 overflow-hidden rounded-xl border border-leaf/30 bg-white">
              {suggestions.map((suggestion, index) => (
                <Pressable
                  key={suggestion.id}
                  onPress={() => pick(suggestion)}
                  className={`px-4 py-3 active:bg-sand ${index > 0 ? "border-t border-leaf/10" : ""}`}
                >
                  <Text className="font-iosevka text-sm text-bark">{suggestion.label}</Text>
                </Pressable>
              ))}
              <Text className="px-4 pb-2 pt-1 font-iosevka text-xs text-bark/50">
                Suggestions from OpenStreetMap via Photon
              </Text>
            </View>
          )}
          {message && <Text className="mt-2 font-iosevka text-sm text-bark/70">{message}</Text>}
        </View>

        <FormField
          label="Suburb"
          placeholder="e.g. North Dunedin"
          value={value.suburb}
          onChangeText={set("suburb")}
          errors={errors.suburb}
        />
        <View className="flex-row gap-3">
          <View className="flex-1">
            <FormField
              label="City"
              placeholder="e.g. Dunedin"
              value={value.city}
              onChangeText={set("city")}
              errors={errors.city}
            />
          </View>
          <View className="w-32">
            <FormField
              label="Post code"
              placeholder="9016"
              value={value.postcode}
              onChangeText={set("postcode")}
              keyboardType="number-pad"
              maxLength={4}
              errors={errors.postcode}
            />
          </View>
        </View>
      </View>
    </View>
  );
}
