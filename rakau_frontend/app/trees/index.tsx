import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";

import { getSpecies } from "../../api/speciesApi";
import { getTrees } from "../../api/treesApi";
import { REGION_LABELS, type Species, type Tree, type TreeFilters } from "../../api/types";
import { NavBar } from "../../components/NavBar";
import { ConditionBadge } from "../../components/ConditionBadge";
import colors from "../../constants/colors";
import {
  CONDITION_OPTIONS,
  REGION_OPTIONS,
  STATUS_OPTIONS,
  type Option,
} from "../../constants/options";

// One labelled row of horizontally scrolling chips, with "All" to clear that filter
function FilterRow<T>({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string;
  options: Option<T>[];
  selected: T | undefined;
  onSelect: (value: T | undefined) => void;
}) {
  const chips: Option<T | undefined>[] = [{ value: undefined, label: "All" }, ...options];

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

function TreeCard({ tree }: { tree: Tree }) {
  return (
    <Pressable
      onPress={() => router.push(`/trees/${tree.id}`)}
      className="mx-6 rounded-2xl border border-leaf/20 bg-white p-4 shadow-sm active:opacity-80"
    >
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="font-iosevka-semibold text-base text-bark">{tree.species_name}</Text>
          <Text className="font-iosevka text-sm italic text-bark/60">
            {tree.species_scientific_name}
          </Text>
        </View>
        <ConditionBadge condition={tree.condition} />
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
        Recorded {new Date(tree.created_at).toLocaleDateString("en-NZ")}
        {tree.owner ? ` by ${tree.owner}` : ""}
      </Text>
    </Pressable>
  );
}

export default function TreesScreen() {
  const [filters, setFilters] = useState<TreeFilters>({});
  const [trees, setTrees] = useState<Tree[]>([]);
  const [species, setSpecies] = useState<Species[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The species endpoint needs login, so the species filter is hidden if this fails
  useEffect(() => {
    getSpecies()
      .then((all) => setSpecies(all.filter((s) => s.is_active)))
      .catch(() => setSpecies(null));
  }, []);

  const loadTrees = useCallback(async () => {
    setError(null);
    try {
      setTrees(await getTrees(filters));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load trees");
    }
  }, [filters]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getTrees(filters)
      .then((result) => {
        if (!cancelled) setTrees(result);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Could not load trees");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    // Ignore a slower response from filters the user has already changed
    return () => {
      cancelled = true;
    };
  }, [filters]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTrees();
    setRefreshing(false);
  };

  const setFilter = <K extends keyof TreeFilters>(key: K, value: TreeFilters[K]) =>
    setFilters((current) => ({ ...current, [key]: value }));

  const hasFilters = Object.values(filters).some((value) => value !== undefined);

  const speciesOptions = (species ?? []).map((s) => ({
    value: s.slug,
    label: s.common_name,
  }));

  const header = (
    <View className="pb-4">
      <View className="px-6 pt-4">
        <View className="flex-row items-center justify-between gap-3">
          <Text className="font-iosevka-bold text-3xl text-bark">Tree catalogue</Text>
          <Pressable
            onPress={() => router.push("/trees/new")}
            className="rounded-full bg-leaf px-4 py-2 active:opacity-80"
          >
            <Text className="font-iosevka-semibold text-sm text-white">+ Add</Text>
          </Pressable>
        </View>
        <Text className="mt-1 font-iosevka text-sm text-bark/70">
          Every tree recorded across Aotearoa.
        </Text>
      </View>

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

      <View className="mt-4 flex-row items-center justify-between px-6">
        <Text className="font-iosevka text-sm text-bark/70">
          {loading ? "Loading…" : `${trees.length} ${trees.length === 1 ? "tree" : "trees"}`}
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
    <SafeAreaView className="flex-1 bg-sand">
      <StatusBar style="dark" />
      <NavBar />
      <FlatList
        data={loading || error ? [] : trees}
        keyExtractor={(tree) => String(tree.id)}
        renderItem={({ item }) => <TreeCard tree={item} />}
        ItemSeparatorComponent={() => <View className="h-3" />}
        ListHeaderComponent={header}
        ListEmptyComponent={emptyState}
        contentContainerClassName="pb-12"
        refreshing={refreshing}
        onRefresh={onRefresh}
      />
    </SafeAreaView>
  );
}
