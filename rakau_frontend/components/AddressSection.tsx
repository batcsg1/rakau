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

// Address points are the middle of a property or street, not the tree itself
const COORDINATES_FROM_ADDRESS =
  "Coordinates set from the address. Adjust them if the tree isn't right at the address.";

const LOOKUP_UNAVAILABLE =
  "Address suggestions aren't available right now. You can still type the address in.";

type AddressSectionProps = {
  value: AddressFields;
  onChange: (value: AddressFields) => void;
  // The coordinates entered above, for "Fill from location"; null when not valid yet
  coordinates: { latitude: number; longitude: number } | null;
  // Whether anything has been typed into Latitude or Longitude, valid or not
  coordinatesEntered: boolean;
  // Called when the coordinates are filled from GPS or from a looked-up address
  onCoordinatesFound: (latitude: number, longitude: number) => void;
  errors: FieldErrors;
  // Called when a picked or looked-up address tells us which region the tree is in
  onRegionFound: (region: Region) => void;
};

// Optional street address with Photon suggestions while typing the street, and a
// "Fill from location" button that fills in whichever of the address and coordinates is
// missing (see fillFromLocation). Every field stays editable
export function AddressSection({
  value,
  onChange,
  coordinates,
  coordinatesEntered,
  onCoordinatesFound,
  errors,
  onRegionFound,
}: AddressSectionProps) {
  // Only set from typing, so filling the fields from a suggestion doesn't search again
  const [searchText, setSearchText] = useState("");
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [filling, setFilling] = useState(false);
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

  const set = (field: keyof AddressFields) => (text: string) =>
    onChange({ ...value, [field]: text });

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
    // Only fill empty coordinates: ones already entered are the tree's own position
    if (!coordinatesEntered) {
      onCoordinatesFound(suggestion.latitude, suggestion.longitude);
      setMessage(COORDINATES_FROM_ADDRESS);
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

  // Works from whatever the user already has, in this order:
  // 1. valid coordinates: look up the address there (they win, so a tree recorded from home
  //    isn't moved to where the phone is)
  // 2. a typed address: look up its coordinates
  // 3. nothing yet: use the phone's GPS, then look up the address there
  const fillFromLocation = async () => {
    setMessage(null);
    if (!coordinates && coordinatesEntered) {
      setMessage("Fix the latitude and longitude, or clear both to fill them in automatically.");
      return;
    }

    setFilling(true);
    let note: string | null = null;
    try {
      if (coordinates) {
        const address = await reverseGeocode(coordinates.latitude, coordinates.longitude);
        if (address) applyLookup(address);
        else setMessage("No address found at these coordinates. You can type it in instead.");
        return;
      }

      const typedAddress = formatAddress(value);
      if (typedAddress) {
        const match = await geocodeAddress(typedAddress);
        if (!match) {
          setMessage("Couldn't find that address. Check it, or type the coordinates in.");
          return;
        }
        onCoordinatesFound(match.latitude, match.longitude);
        applyLookup(match);
        setMessage(COORDINATES_FROM_ADDRESS);
        return;
      }

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
            "Type the address or coordinates in instead.",
        );
        return;
      }
      onCoordinatesFound(position.latitude, position.longitude);
      const accuracy = position.accuracyM ? ` (±${Math.round(position.accuracyM)} m)` : "";
      note = `Coordinates set from your current location${accuracy}. Check you're standing at the tree.`;

      const address = await reverseGeocode(position.latitude, position.longitude);
      if (address) {
        applyLookup(address);
        setMessage(note);
      } else {
        setMessage(`${note} No address found here, so you can type it in.`);
      }
    } catch {
      // Photon failed; any GPS coordinates already filled in are kept
      setMessage([note, LOOKUP_UNAVAILABLE].filter(Boolean).join(" "));
    } finally {
      setFilling(false);
    }
  };

  return (
    <View>
      <View className="mb-2 flex-row items-center justify-between gap-3">
        <Text className="font-iosevka-semibold text-base text-bark">Address (optional)</Text>
        <Pressable
          onPress={fillFromLocation}
          disabled={filling}
          className="rounded-full border border-leaf px-4 py-1.5 active:opacity-70 disabled:opacity-50"
        >
          {filling ? (
            <ActivityIndicator color={colors.leaf} />
          ) : (
            <Text className="font-iosevka-semibold text-sm text-leaf">Fill from location</Text>
          )}
        </Pressable>
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
