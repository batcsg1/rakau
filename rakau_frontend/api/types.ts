// Mirrors trees.models.Condition
export type Condition = "healthy" | "stressed" | "diseased" | "dead";

export const CONDITION_LABELS: Record<Condition, string> = {
  healthy: "Healthy",
  stressed: "Stressed",
  diseased: "Diseased",
  dead: "Dead",
};

// Mirrors trees.models.Region — the 16 regional council areas of New Zealand
export type Region =
  | "northland"
  | "auckland"
  | "waikato"
  | "bay-of-plenty"
  | "gisborne"
  | "hawkes-bay"
  | "taranaki"
  | "manawatu-whanganui"
  | "wellington"
  | "tasman"
  | "nelson"
  | "marlborough"
  | "west-coast"
  | "canterbury"
  | "otago"
  | "southland";

export const REGION_LABELS: Record<Region, string> = {
  northland: "Northland",
  auckland: "Auckland",
  waikato: "Waikato",
  "bay-of-plenty": "Bay of Plenty",
  gisborne: "Gisborne",
  "hawkes-bay": "Hawke's Bay",
  taranaki: "Taranaki",
  "manawatu-whanganui": "Manawatū-Whanganui",
  wellington: "Wellington",
  tasman: "Tasman",
  nelson: "Nelson",
  marlborough: "Marlborough",
  "west-coast": "West Coast",
  canterbury: "Canterbury",
  otago: "Otago",
  southland: "Southland",
};

// Mirrors trees.models.Significance — "none" also covers trees whose status is unknown
export type Significance = "none" | "locally_notable" | "heritage" | "protected";

export const SIGNIFICANCE_LABELS: Record<Significance, string> = {
  none: "None",
  locally_notable: "Locally notable",
  heritage: "Heritage",
  protected: "Protected",
};

// A species from GET /api/species/
export interface Species {
  id: number;
  common_name: string;
  scientific_name: string;
  is_native: boolean;
  is_active: boolean;
  slug: string;
}

// A tree from GET /api/trees/ and GET /api/trees/{id}/
export interface Tree {
  id: number;
  owner?: string; // owner's username, read-only; DRF omits it when the tree has no owner
  species_name: string;
  species_scientific_name: string;
  species_slug: string;
  latitude: number;
  longitude: number;
  region: Region | ""; // blank is allowed on the model
  // Optional street address; each part is "" when not set
  street_address: string;
  suburb: string;
  city: string;
  postcode: string;
  condition: Condition;
  is_present: boolean;
  significance_status: Significance;
  // DecimalFields — DRF sends decimals as strings, e.g. "30.00"
  height_m: string | null;
  trunk_girth_cm: string | null;
  crown_spread_m: string | null;
  created_at: string; // ISO 8601 string, not Date
  updated_at: string;
}

// Writable fields for POST /api/trees/ and PATCH /api/trees/{id}/
export interface TreeInput {
  species_slug: string;
  latitude: number;
  longitude: number;
  condition: Condition;
  region?: Region | "";
  street_address?: string;
  suburb?: string;
  city?: string;
  postcode?: string;
  is_present?: boolean;
  significance_status?: Significance;
  height_m?: number | null;
  trunk_girth_cm?: number | null;
  crown_spread_m?: number | null;
}

// Query params the tree list endpoint filters on
export interface TreeFilters {
  species_slug?: string;
  condition?: Condition;
  region?: Region;
  is_present?: boolean;
  significance_status?: Significance;
  significant_only?: boolean;
  height_min?: number;
  height_max?: number;
  girth_min?: number;
  girth_max?: number;
  ordering?: TreeOrdering; // the API lists newest first when this is left out
}

// Mirrors trees.filters.ORDERINGS
export type TreeOrdering = "newest" | "oldest";

// DRF PageNumberPagination envelope
export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// The signed-in user from GET /api/auth/me/
export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_staff: boolean;
}
