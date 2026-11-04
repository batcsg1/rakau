import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Image as ExpoImage } from "expo-image";
import { router } from "expo-router";

import { getSpecies } from "../../api/speciesApi";
import { ApiError, type FieldErrors } from "../../api/client";
import { getTreeOwners, getTrees } from "../../api/treesApi";
import {
  REGION_LABELS,
  type Species,
  type Tree,
  type TreeFilters,
  type TreeOrdering,
} from "../../api/types";
import { NavBar } from "../../components/NavBar";
import { ConditionBadge } from "../../components/ConditionBadge";
import { RangeFilter } from "../../components/RangeFilter";
import { SignificanceBadge } from "../../components/SignificanceBadge";
import { TextFilter } from "../../components/TextFilter";
import colors from "../../constants/colors";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { useRefreshOnFocus } from "../../hooks/useRefreshOnFocus";
import { shortDateTime } from "../../utils/dates";
import {
  CONDITION_OPTIONS,
  ORDERING_OPTIONS,
  REGION_OPTIONS,
  SIGNIFICANCE_OPTIONS,
  STATUS_OPTIONS,
  type Option,
} from "../../constants/options";

// One labelled row of horizontally scrolling chips, with "All" to clear that filter
// unless clearable is false (e.g. the sort, which always has a value)
function FilterRow<T>({
  label,
  options,
  selected,
  onSelect,
  clearable = true,
}: {
  label: string;
  options: Option<T>[];
  selected: T | undefined;
  onSelect: (value: T | undefined) => void;
  clearable?: boolean;
}) {
  const chips: Option<T | undefined>[] = clearable
    ? [{ value: undefined, label: "All" }, ...options]
    : options;

  return (
    <View className="mt-4">
      <Text className="px-6 font-iosevka-semibold text-sm text-bark/70">{label}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-2 px-6 pt-2"
      >
        {chips.map((chip) => {
          const active = chip.value === selected;
          return (
            <Pressable
              key={chip.label}
              onPress={() => onSelect(chip.value)}
              className={`rounded-full border px-4 py-2 active:opacity-70 ${
                active ? "border-leaf bg-leaf" : "border-leaf/40 bg-white"
              }`}
            >
              <Text className={`font-iosevka text-sm ${active ? "text-white" : "text-bark"}`}>
                {chip.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

// The numeric ranges the catalogue filters on, keyed to their TreeFilters params
const RANGES = [
  { name: "Height", unit: "m", min: "height_min", max: "height_max" },
  { name: "Girth", unit: "cm", min: "girth_min", max: "girth_max" },
] as const;

// "Height 5–10 m", "Height ≥ 5 m" or "Height ≤ 10 m"
function rangeLabel(name: string, unit: string, min?: number, max?: number) {
  if (min !== undefined && max !== undefined) return `${name} ${min}–${max} ${unit}`;
  if (min !== undefined) return `${name} ≥ ${min} ${unit}`;
  return `${name} ≤ ${max} ${unit}`;
}

// A filter that's in use, shown as a chip that clears it when tapped
function ActiveFilterChip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <Pressable
      onPress={onClear}
      accessibilityRole="button"
      accessibilityLabel={`Clear filter: ${label}`}
      className="flex-row items-center gap-2 rounded-full bg-leaf px-4 py-2 active:opacity-70"
    >
      <Text className="font-iosevka text-sm text-white">{label}</Text>
      <Text className="font-iosevka-semibold text-sm text-white">✕</Text>
    </Pressable>
  );
}

function TreeCard({ tree }: { tree: Tree }) {
  return (
    <Pressable
      onPress={() => router.push(`/trees/${tree.id}`)}
      // Faint sand fill like the My Trees rows. No shadow: on Android it shows through a
      // see-through background as a dark smudge
      className="mx-6 rounded-2xl border border-leaf/20 bg-sand/50 p-4 active:opacity-80"
    >
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="font-iosevka-semibold text-base text-bark">{tree.species_name}</Text>
          <Text className="font-iosevka text-sm italic text-bark/60">
            {tree.species_scientific_name}
          </Text>
        </View>
        <View className="items-end gap-2">
          <ConditionBadge condition={tree.condition} />
          <SignificanceBadge significance={tree.significance_status} />
        </View>
      </View>

      <View className="mt-3 flex-row flex-wrap gap-x-4 gap-y-1">
        <Text className="font-iosevka text-sm text-bark/70">
          {tree.region ? REGION_LABELS[tree.region] : "No region"}
        </Text>
        <Text className="font-iosevka text-sm text-bark/70">
          {tree.is_present ? "Present" : "Removed"}
        </Text>
        {tree.height_m && (
          <Text className="font-iosevka text-sm text-bark/70">{Number(tree.height_m)} m tall</Text>
        )}
      </View>

      <Text className="mt-2 font-iosevka text-xs text-bark/50">
        Recorded {shortDateTime(tree.created_at)}
        {tree.owner ? ` by ${tree.owner}` : ""}
      </Text>
    </Pressable>
  );
}

export default function TreesScreen() {
  const user = useCurrentUser();
  const insets = useSafeAreaInsets();
  const [filters, setFilters] = useState<TreeFilters>({});
  // Kept apart from filters so "Clear filters" leaves the sort alone
  const [ordering, setOrdering] = useState<TreeOrdering>("newest");
  const [trees, setTrees] = useState<Tree[]>([]);
  const [species, setSpecies] = useState<Species[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // The API's 400 messages for invalid filter values, shown under the matching input
  const [filterErrors, setFilterErrors] = useState<FieldErrors>({});

  // The species endpoint needs login, so the species filter is hidden if this fails
  useEffect(() => {
    getSpecies()
      .then((all) => setSpecies(all.filter((s) => s.is_active)))
      .catch(() => setSpecies(null));
  }, []);

  // A 400 means a filter value was rejected; anything else is a failed load
  const showLoadError = (e: unknown) => {
    if (e instanceof ApiError && e.status === 400 && Object.keys(e.fieldErrors).length > 0) {
      setFilterErrors(e.fieldErrors);
    } else {
      setError(e instanceof Error ? e.message : "Could not load trees");
    }
  };

  const loadTrees = useCallback(async () => {
    setError(null);
    setFilterErrors({});
    try {
      setTrees(await getTrees({ ...filters, ordering }));
    } catch (e) {
      showLoadError(e);
    }
  }, [filters, ordering]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setFilterErrors({});
    getTrees({ ...filters, ordering })
      .then((result) => {
        if (!cancelled) setTrees(result);
      })
      .catch((e) => {
        if (!cancelled) showLoadError(e);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    // Ignore a slower response from filters the user has already changed
    return () => {
      cancelled = true;
    };
  }, [filters, ordering]);

  // Coming back from a tree's page picks up any edit or delete made there
  useRefreshOnFocus(loadTrees);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTrees();
    setRefreshing(false);
  };

  const setFilter = <K extends keyof TreeFilters>(key: K, value: TreeFilters[K]) =>
    setFilters((current) => ({ ...current, [key]: value }));

  const hasFilters = Object.values(filters).some((value) => value !== undefined);
  const hasFilterErrors = Object.keys(filterErrors).length > 0;

  const activeRanges = RANGES.filter(
    (range) => filters[range.min] !== undefined || filters[range.max] !== undefined,
  );

  const speciesOptions = (species ?? []).map((s) => ({
    value: s.slug,
    label: s.common_name,
  }));

  const header = (
    <View className="pb-4">
      <View className="px-6 pt-4">
        <View className="flex-row items-center justify-between gap-3">
          <Text className="font-iosevka-bold text-3xl text-bark">Tree catalogue</Text>
          {/* Only signed-in users can add, so it's hidden when logged out (UAT I5, #60).
              Also hidden while the check runs, so it never flashes up for a logged-out user */}
          {user && (
            <Pressable
              onPress={() => router.push("/trees/new")}
              className="rounded-full bg-leaf px-4 py-2 active:opacity-80"
            >
              <Text className="font-iosevka-semibold text-sm text-white">+ Add</Text>
            </Pressable>
          )}
        </View>
        <Text className="mt-1 font-iosevka text-sm text-bark/70">
          Every tree recorded across Aotearoa.
        </Text>
      </View>

      <FilterRow
        label="Sort by date recorded"
        options={ORDERING_OPTIONS}
        selected={ordering}
        onSelect={(value) => value && setOrdering(value)}
        clearable={false}
      />
      {/* Near the top so the keyboard doesn't cover its suggestions */}
      <TextFilter
        label="Recorded by"
        placeholder="Start typing a username"
        value={filters.owner}
        onChange={(value) => setFilter("owner", value)}
        fetchSuggestions={getTreeOwners}
      />
      {species && species.length > 0 && (
        <FilterRow
          label="Species"
          options={speciesOptions}
          selected={filters.species_slug}
          onSelect={(value) => setFilter("species_slug", value)}
        />
      )}
      <FilterRow
        label="Region"
        options={REGION_OPTIONS}
        selected={filters.region}
        onSelect={(value) => setFilter("region", value)}
      />
      <FilterRow
        label="Condition"
        options={CONDITION_OPTIONS}
        selected={filters.condition}
        onSelect={(value) => setFilter("condition", value)}
      />
      <FilterRow
        label="Status"
        options={STATUS_OPTIONS}
        selected={filters.is_present}
        onSelect={(value) => setFilter("is_present", value)}
      />
      <FilterRow
        label="Significance"
        options={SIGNIFICANCE_OPTIONS}
        selected={filters.significance_status}
        onSelect={(value) => setFilter("significance_status", value)}
      />
      <View className="mt-3 px-6">
        <Pressable
          onPress={() => setFilter("significant_only", filters.significant_only ? undefined : true)}
          accessibilityRole="switch"
          accessibilityState={{ checked: !!filters.significant_only }}
          className={`self-start rounded-full border px-4 py-2 active:opacity-70 ${
            filters.significant_only ? "border-leaf bg-leaf" : "border-leaf/40 bg-white"
          }`}
        >
          <Text
            className={`font-iosevka text-sm ${filters.significant_only ? "text-white" : "text-bark"}`}
          >
            {filters.significant_only ? "✓ Significant only" : "Significant only"}
          </Text>
        </Pressable>
      </View>
      {RANGES.map((range) => (
        <RangeFilter
          key={range.name}
          label={`${range.name} (${range.unit})`}
          min={filters[range.min]}
          max={filters[range.max]}
          onChange={(bound, value) => setFilter(range[bound], value)}
          errors={[...(filterErrors[range.min] ?? []), ...(filterErrors[range.max] ?? [])]}
        />
      ))}

      {(activeRanges.length > 0 || filters.owner) && (
        <View className="mt-4 flex-row flex-wrap gap-2 px-6">
          {filters.owner && (
            <ActiveFilterChip
              label={`Recorded by ${filters.owner}`}
              onClear={() => setFilter("owner", undefined)}
            />
          )}
          {activeRanges.map((range) => (
            <ActiveFilterChip
              key={range.name}
              label={rangeLabel(range.name, range.unit, filters[range.min], filters[range.max])}
              onClear={() =>
                setFilters((current) => ({
                  ...current,
                  [range.min]: undefined,
                  [range.max]: undefined,
                }))
              }
            />
          ))}
        </View>
      )}

      <View className="mt-4 flex-row items-center justify-between px-6">
        <Text className="font-iosevka text-sm text-bark/70">
          {loading
            ? "Loading…"
            : hasFilterErrors
              ? "Check the filters above"
              : `${trees.length} ${trees.length === 1 ? "tree" : "trees"}`}
        </Text>
        {hasFilters && (
          <Pressable onPress={() => setFilters({})} className="active:opacity-60">
            <Text className="font-iosevka-semibold text-sm text-leaf">Clear filters</Text>
          </Pressable>
        )}
      </View>
    </View>
  );

  const emptyState = loading ? (
    <ActivityIndicator className="mt-10" color={colors.leaf} />
  ) : error ? (
    <View className="mx-6 mt-6 items-center rounded-2xl bg-white p-6">
      <Text className="text-center font-iosevka-semibold text-base text-bark">
        Couldn't load trees
      </Text>
      <Text className="mt-1 text-center font-iosevka text-sm text-bark/70">{error}</Text>
      <Pressable
        onPress={onRefresh}
        className="mt-4 rounded-full bg-leaf px-6 py-3 active:opacity-80"
      >
        <Text className="font-iosevka-semibold text-sm text-white">Try again</Text>
      </Pressable>
    </View>
  ) : hasFilterErrors ? (
    <View className="mx-6 mt-6 items-center rounded-2xl bg-white p-6">
      <Text className="text-center font-iosevka-semibold text-base text-bark">
        Some filters aren't valid
      </Text>
      {Object.values(filterErrors)
        .flat()
        .map((message) => (
          <Text key={message} className="mt-1 text-center font-iosevka text-sm text-red-700">
            {message}
          </Text>
        ))}
      <Pressable onPress={() => setFilters({})} className="mt-3 active:opacity-60">
        <Text className="font-iosevka-semibold text-sm text-leaf">Clear filters</Text>
      </Pressable>
    </View>
  ) : (
    <View className="mx-6 mt-6 items-center rounded-2xl bg-white p-6">
      <Text className="text-center font-iosevka-semibold text-base text-bark">
        {hasFilters ? "No trees match these filters" : "No trees recorded yet"}
      </Text>
      {hasFilters && (
        <Pressable onPress={() => setFilters({})} className="mt-3 active:opacity-60">
          <Text className="font-iosevka-semibold text-sm text-leaf">Clear filters</Text>
        </Pressable>
      )}
    </View>
  );

  return (
    // The top inset is applied to the nav bar's wrapper instead, so the solid sand runs up
    // behind the status bar rather than leaving a strip of the faded photo above the nav bar
    <SafeAreaView edges={["left", "right", "bottom"]} className="flex-1 bg-sand">
      <StatusBar style="dark" />
      {/* ImageBackground is deprecated in SDK 58, so the photo is an absolutely positioned
          expo-image behind the content, matching the home screen */}
      <ExpoImage
        source={require("../../assets/decaying-tree.jpg")}
        contentFit="cover"
        style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}
      />
      {/* Fades the photo so the filters and cards stay readable */}
      <View className="absolute inset-0 bg-sand/80" />
      <View style={{ paddingTop: insets.top }} className="bg-sand">
        <NavBar />
      </View>
      <FlatList
        data={loading || error || hasFilterErrors ? [] : trees}
        keyExtractor={(tree) => String(tree.id)}
        renderItem={({ item }) => <TreeCard tree={item} />}
        ItemSeparatorComponent={() => <View className="h-3" />}
        ListHeaderComponent={header}
        ListEmptyComponent={emptyState}
        contentContainerClassName="pb-12"
        keyboardShouldPersistTaps="handled"
        refreshing={refreshing}
        onRefresh={onRefresh}
      />
    </SafeAreaView>
  );
}
