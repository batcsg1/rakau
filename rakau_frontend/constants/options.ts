import {
  CONDITION_LABELS,
  REGION_LABELS,
  SIGNIFICANCE_LABELS,
  type Condition,
  type Region,
  type Significance,
} from "../api/types";

// A selectable value and the text shown for it, e.g. in a ChipGroup or filter row
export type Option<T> = { value: T; label: string };

function toOptions<T extends string>(labels: Record<T, string>): Option<T>[] {
  return Object.entries<string>(labels).map(([value, label]) => ({ value: value as T, label }));
}

export const CONDITION_OPTIONS = toOptions<Condition>(CONDITION_LABELS);

export const REGION_OPTIONS = toOptions<Region>(REGION_LABELS);

export const SIGNIFICANCE_OPTIONS = toOptions<Significance>(SIGNIFICANCE_LABELS);

// For the Add Tree picker: most users won't know a tree's official status, so "Unsure"
// comes first and saves as "none"
export const SIGNIFICANCE_PICKER_OPTIONS: Option<Significance>[] = [
  { value: "none", label: "Unsure" },
  ...SIGNIFICANCE_OPTIONS.filter((option) => option.value !== "none"),
];

export const STATUS_OPTIONS: Option<boolean>[] = [
  { value: true, label: "Present" },
  { value: false, label: "Removed" },
];

// Mirrors the coordinate validators on trees.models.Tree
export const LATITUDE_RANGE = { min: -90, max: 90 };
export const LONGITUDE_RANGE = { min: -180, max: 180 };
