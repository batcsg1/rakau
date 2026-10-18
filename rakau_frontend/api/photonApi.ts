import { REGION_LABELS, type Region } from "./types";

// Address lookup with Photon (https://photon.komoot.io), an OpenStreetMap geocoder.
// It needs no API key, but the public server is fair-use, so callers should debounce
const PHOTON_URL = "https://photon.komoot.io";

// Keeps search results inside New Zealand: west, south, east, north
const NZ_BOUNDS = { west: 166, south: -47.5, east: 179, north: -34 };
const NZ_BBOX = `${NZ_BOUNDS.west},${NZ_BOUNDS.south},${NZ_BOUNDS.east},${NZ_BOUNDS.north}`;

// Roughly mainland NZ, Stewart Island and the near islands (not the Chathams)
export function isInNz(latitude: number, longitude: number): boolean {
  return (
    latitude >= NZ_BOUNDS.south &&
    latitude <= NZ_BOUNDS.north &&
    longitude >= NZ_BOUNDS.west &&
    longitude <= NZ_BOUNDS.east
  );
}

// The address fields stored on a tree
export interface AddressFields {
  street_address: string;
  suburb: string;
  city: string;
  postcode: string;
}

// A looked-up address, plus the region it's in when Photon could tell
export interface AddressLookup extends AddressFields {
  region: Region | null;
}

export interface AddressSuggestion extends AddressLookup {
  id: string;
  latitude: number;
  longitude: number;
  label: string; // what the suggestion list shows, e.g. "51 Union Street, North Dunedin, Dunedin 9016"
}

// The parts of a Photon GeoJSON feature's properties that we use
interface PhotonProperties {
  osm_type?: string;
  osm_id?: number;
  type?: string; // "house", "street", ...
  name?: string;
  housenumber?: string;
  street?: string;
  district?: string;
  locality?: string;
  city?: string;
  postcode?: string;
  state?: string; // the regional council area in NZ, e.g. "Otago" or "Manawatū-Whanganui"
  countrycode?: string;
}

// A GeoJSON point: note the order is [longitude, latitude]
interface PhotonFeature {
  geometry: { coordinates: [number, number] };
  properties: PhotonProperties;
}

interface PhotonResponse {
  features: PhotonFeature[];
}

// Older OSM data uses the pre-2019 spelling of Whanganui
const REGION_ALIASES: Record<string, Region> = { "manawatu-wanganui": "manawatu-whanganui" };

// "Manawatū-Whanganui" -> "manawatu-whanganui", "Hawke's Bay" -> "hawkes-bay": the same keys
// as trees.models.Region. Anything that isn't one of the 16 regions gives null
function toRegion(state: string | undefined): Region | null {
  if (!state) return null;
  const key = state
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // drop macrons and other accents
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z]+/g, "-")
    .replace(/^-|-$/g, "");
  if (key in REGION_LABELS) return key as Region;
  return REGION_ALIASES[key] ?? null;
}

function toLookup(p: PhotonProperties): AddressLookup {
  return { ...toAddress(p), region: toRegion(p.state) };
}

// Street-level results carry the road name in `name` and have no house number
function toAddress(p: PhotonProperties): AddressFields {
  const street =
    p.type === "street" ? (p.name ?? "") : [p.housenumber, p.street].filter(Boolean).join(" ");
  return {
    street_address: street,
    suburb: p.district ?? p.locality ?? "",
    city: p.city ?? "",
    // OSM occasionally has odd values (e.g. "9016;9010"); leave those for the user to fill in
    postcode: p.postcode && /^\d{4}$/.test(p.postcode) ? p.postcode : "",
  };
}

// One line for an address, e.g. "51 Union Street, North Dunedin, Dunedin 9016"
export function formatAddress(address: AddressFields): string {
  const cityLine = [address.city, address.postcode].filter(Boolean).join(" ");
  return [address.street_address, address.suburb, cityLine].filter(Boolean).join(", ");
}

function toSuggestion({ geometry, properties: p }: PhotonFeature): AddressSuggestion {
  const address = toLookup(p);
  const [longitude, latitude] = geometry.coordinates;
  // Landmarks (e.g. "Auckland Town Hall") lead with their name so they're recognisable
  const landmark = p.type !== "street" && p.name ? p.name : null;
  return {
    ...address,
    id: `${p.osm_type}${p.osm_id}`,
    latitude,
    longitude,
    label: [landmark, formatAddress(address)].filter(Boolean).join(", "),
  };
}

async function fetchPhoton(path: string, signal?: AbortSignal): Promise<PhotonFeature[]> {
  const response = await fetch(`${PHOTON_URL}${path}`, { signal });
  if (!response.ok) {
    throw new Error(`Address lookup failed: ${response.status}`);
  }
  const data: PhotonResponse = await response.json();
  return data.features.filter((f) => f.properties.countrycode === "NZ");
}

// Address suggestions for what the user has typed, best match first
export async function searchAddresses(
  text: string,
  signal?: AbortSignal,
): Promise<AddressSuggestion[]> {
  const query = new URLSearchParams({ q: text, limit: "6", lang: "en", bbox: NZ_BBOX });
  const results = await fetchPhoton(`/api/?${query}`, signal);

  // A long road is often split into several OSM ways with the same label; show it once
  const seen = new Set<string>();
  return results
    .map(toSuggestion)
    .filter((s) => s.street_address && !seen.has(s.label) && seen.add(s.label));
}

// The best match for a typed address, with its coordinates, or null if Photon can't find it
export async function geocodeAddress(text: string): Promise<AddressSuggestion | null> {
  const [best] = await searchAddresses(text);
  return best ?? null;
}

// The nearest address to a point, or null if Photon has nothing there
export async function reverseGeocode(
  latitude: number,
  longitude: number,
): Promise<AddressLookup | null> {
  const query = new URLSearchParams({ lat: String(latitude), lon: String(longitude), lang: "en" });
  const [nearest] = await fetchPhoton(`/reverse?${query}`);
  return nearest ? toLookup(nearest.properties) : null;
}
