import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { router, useLocalSearchParams } from "expo-router";

import { isLoggedIn } from "../../api/auth";
import { deleteTree, getMyTrees } from "../../api/treesApi";
import { CONDITION_LABELS, REGION_LABELS, type Condition, type Tree } from "../../api/types";

const PAGE_SIZE = 20;

const FILTERS: { value: Condition | undefined; label: string }[] = [
  { value: undefined, label: "All" },
  ...Object.entries(CONDITION_LABELS).map(([value, label]) => ({
    value: value as Condition,
    label,
  })),
];

// "14 Mar" this year, "14 Mar 2025" otherwise
function shortDate(iso: string): string {
  const date = new Date(iso);
  const sameYear = date.getFullYear() === new Date().getFullYear();
  return date.toLocaleDateString("en-NZ", {
    day: "numeric",
    month: "short",
    ...(sameYear ? {} : { year: "numeric" }),
  });
}

// e.g. "Otago · healthy", as in the wireframe
function subtitle(tree: Tree): string {
  const place = tree.region ? REGION_LABELS[tree.region] : "No region";
  return `${place} · ${CONDITION_LABELS[tree.condition].toLowerCase()}`;
}

function TreeRow({
  tree,
  highlighted,
  dimmed,
}: {
  tree: Tree;
  highlighted: boolean;
  dimmed: boolean;
}) {
  return (
    <Pressable
      onPress={() => router.push(`/trees/${tree.id}`)}
      className={`flex-row items-center gap-4 border-b border-bark/10 px-6 py-4 active:opacity-70 ${
        highlighted ? "border-l-4 border-l-leaf bg-leaf/10" : ""
      } ${dimmed ? "opacity-50" : ""}`}
    >
      {/* Placeholder thumbnail until trees have photos */}
      <View className="h-14 w-14 items-center justify-center rounded-lg border border-bark/10 bg-leaf/10">
        <Text className="text-xl font-iosevka-bold text-leaf">
          {tree.species_name.charAt(0)}
        </Text>
      </View>
      <View className="flex-1">
        <Text className="text-base font-iosevka-semibold text-bark" numberOfLines={1}>
          {tree.species_name}
        </Text>
        <Text className="mt-0.5 text-sm text-bark/60 font-iosevka" numberOfLines={1}>
          {subtitle(tree)}
        </Text>
      </View>
      <Text className="text-xs text-bark/50 font-iosevka">
        {highlighted ? "just now" : shortDate(tree.created_at)}
      </Text>
    </Pressable>
  );
}

function SkeletonRow() {
  return (
    <View className="flex-row items-center gap-4 border-b border-bark/10 px-6 py-4">
      <View className="h-14 w-14 rounded-lg bg-bark/10" />
      <View className="flex-1 gap-2">
        <View className="h-4 w-3/5 rounded bg-bark/10" />
        <View className="h-3 w-2/5 rounded bg-bark/10" />
      </View>
    </View>
  );
}

export default function MyTreesScreen() {
  // Set by the Add Tree screen after a successful save
  const { added } = useLocalSearchParams<{ added?: string }>();

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [condition, setCondition] = useState<Condition>();
  const [trees, setTrees] = useState<Tree[]>([]);
  const [count, setCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [addedId, setAddedId] = useState<number | null>(added ? Number(added) : null);
  const [undoing, setUndoing] = useState(false);

  // Bumped on every fresh load so a slow response for an old filter is ignored
  const requestId = useRef(0);

  useEffect(() => {
    isLoggedIn().then((loggedIn) => {
      if (loggedIn) {
        setCheckingAuth(false);
      } else {
        router.replace({ pathname: "/login", params: { next: "/trees/mine" } });
      }
    });
  }, []);

  // Loads page 1 and replaces the list (first load, filter change, refresh, retry)
  const loadFirstPage = useCallback(async () => {
    const id = ++requestId.current;
    setError(null);
    try {
      const data = await getMyTrees(1, { condition });
      if (id !== requestId.current) return;
      setTrees(data.results);
      setCount(data.count);
      setPage(1);
      setHasNext(data.next !== null);
    } catch (e) {
      if (id !== requestId.current) return;
      setError(e instanceof Error ? e.message : "Could not load your trees");
    }
  }, [condition]);

  useEffect(() => {
    if (checkingAuth) return;
    setLoading(true);
    loadFirstPage().finally(() => setLoading(false));
  }, [checkingAuth, loadFirstPage]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFirstPage();
    setRefreshing(false);
  };

  // Infinite scroll: fetch the next page when the user nears the end
  const loadMore = async () => {
    if (!hasNext || loadingMore || loading || error) return;
    const id = requestId.current;
    setLoadingMore(true);
    try {
      const data = await getMyTrees(page + 1, { condition });
      if (id !== requestId.current) return;
      // Skip any tree already shown, in case a new one shifted the pages
      setTrees((current) => {
        const seen = new Set(current.map((t) => t.id));
        return [...current, ...data.results.filter((t) => !seen.has(t.id))];
      });
      setCount(data.count);
      setPage(page + 1);
      setHasNext(data.next !== null);
    } catch (e) {
      if (id === requestId.current) {
        setError(e instanceof Error ? e.message : "Could not load more trees");
      }
    } finally {
      setLoadingMore(false);
    }
  };

  const addedTree = trees.find((t) => t.id === addedId);

  const undoAdd = async () => {
    if (!addedTree) return;
    setUndoing(true);
    try {
      await deleteTree(addedTree.id);
      setTrees((current) => current.filter((t) => t.id !== addedTree.id));
      setCount((c) => c - 1);
      setAddedId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not undo");
    } finally {
      setUndoing(false);
    }
  };

  if (checkingAuth) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-sand">
        <ActivityIndicator color="#2E7D32" />
      </SafeAreaView>
    );
  }

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  const header = (
    <View>
      <View className="border-b border-bark/20 px-6 pb-4 pt-4">
        <View className="flex-row items-center justify-between">
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))}
            className="active:opacity-60"
          >
            <Text className="text-base text-leaf font-iosevka-semibold">← Back</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push("/trees/new")}
            className="rounded-full bg-leaf px-4 py-2 active:opacity-80"
          >
            <Text className="text-sm font-iosevka-semibold text-white">+ Add tree</Text>
          </Pressable>
        </View>

        <View className="mt-4 flex-row items-end justify-between">
          <Text className="text-3xl font-iosevka-bold text-bark">My Trees</Text>
          <Text className="text-right text-xs text-bark/60 font-iosevka">
            {loading ? "loading…" : error && trees.length ? "saved copy" : `${count} recorded`}
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="mt-4 gap-2"
        >
          {FILTERS.map((filter) => {
            const active = filter.value === condition;
            return (
              <Pressable
                key={filter.label}
                onPress={() => setCondition(filter.value)}
                className={`rounded-md border px-3 py-1.5 active:opacity-70 ${
                  active ? "border-canopy bg-canopy" : "border-bark/30 bg-white"
                }`}
              >
                <Text
                  className={`text-sm font-iosevka ${active ? "text-white" : "text-bark"}`}
                >
                  {filter.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {addedTree && (
        <View className="flex-row items-center justify-between border-b border-leaf/30 bg-leaf/15 px-6 py-3">
          <Text className="flex-1 text-sm text-canopy font-iosevka-semibold">
            ✓ {addedTree.species_name} added
          </Text>
          <Pressable onPress={undoAdd} disabled={undoing} className="active:opacity-60">
            {undoing ? (
              <ActivityIndicator color="#1B5E20" />
            ) : (
              <Text className="text-sm text-canopy underline font-iosevka-semibold">Undo</Text>
            )}
          </Pressable>
        </View>
      )}

      {error && (
        <View className="border-b border-red-700/30 bg-red-100 px-6 py-4">
          <Text className="text-base text-red-700 font-iosevka-semibold">
            Couldn't reach the register
          </Text>
          <Text className="mt-1 text-sm text-bark/70 font-iosevka">
            {trees.length ? "Showing the trees you'd already loaded. " : ""}
            {error}
          </Text>
          <Pressable
            onPress={onRefresh}
            className="mt-3 self-start rounded-md bg-red-700 px-4 py-2 active:opacity-80"
          >
            <Text className="text-sm text-white font-iosevka-semibold">Retry</Text>
          </Pressable>
        </View>
      )}
    </View>
  );

  const emptyState = loading ? (
    <View>
      {[0, 1, 2, 3].map((i) => (
        <SkeletonRow key={i} />
      ))}
    </View>
  ) : error ? null : (
    <View className="items-center px-6 pt-16">
      <View className="h-24 w-24 items-center justify-center border border-dashed border-bark/30">
        <View className="h-3 w-3 rounded-full bg-leaf/50" />
      </View>
      <Text className="mt-6 text-xl text-bark font-iosevka-semibold">
        {condition
          ? `No ${CONDITION_LABELS[condition].toLowerCase()} trees`
          : "No trees logged yet"}
      </Text>
      <Text className="mt-2 text-center text-sm leading-5 text-bark/60 font-iosevka">
        {condition
          ? "Try another filter, or record a new tree."
          : "Trees you record appear here, newest first."}
      </Text>
      <Pressable
        onPress={() => router.push("/trees/new")}
        className="mt-6 w-full items-center rounded-md bg-canopy px-6 py-4 active:opacity-80"
      >
        <Text className="text-base text-white font-iosevka-semibold">
          {condition ? "Record a tree" : "Add your first tree"}
        </Text>
      </Pressable>
    </View>
  );

  const footer =
    trees.length === 0 ? null : (
      <View className="items-center py-6">
        {loadingMore ? (
          <ActivityIndicator color="#2E7D32" />
        ) : (
          <Text className="text-xs text-bark/50 font-iosevka">
            {hasNext
              ? `page ${page} of ${totalPages} · scroll for more`
              : `all ${count} ${count === 1 ? "tree" : "trees"} shown`}
          </Text>
        )}
      </View>
    );

  return (
    <SafeAreaView className="flex-1 bg-sand">
      <StatusBar style="dark" />
      <FlatList
        data={loading ? [] : trees}
        keyExtractor={(tree) => String(tree.id)}
        renderItem={({ item }) => (
          <TreeRow
            tree={item}
            highlighted={item.id === addedId}
            // Faded while showing an out-of-date copy after a failed refresh
            dimmed={!!error}
          />
        )}
        ListHeaderComponent={header}
        ListEmptyComponent={emptyState}
        ListFooterComponent={footer}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />
    </SafeAreaView>
  );
}
