import { type ReactNode, useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams } from "expo-router";

import { ApiError } from "../../api/client";
import { getTree } from "../../api/treesApi";
import { REGION_LABELS, type Tree } from "../../api/types";
import { BackButton } from "../../components/BackButton";
import { NavBar } from "../../components/NavBar";
import { ConditionBadge } from "../../components/ConditionBadge";
import colors from "../../constants/colors";

// "30.00" -> "30 m"; missing measurements show as a dash
function measurement(value: string | null, unit: string): string {
  return value === null ? "—" : `${Number(value)} ${unit}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-NZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between gap-4 border-t border-leaf/10 py-3">
      <Text className="font-iosevka text-sm text-bark/70">{label}</Text>
      <Text className="flex-1 text-right font-iosevka-semibold text-sm text-bark">{value}</Text>
    </View>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="mx-6 mt-4 rounded-2xl border border-leaf/20 bg-white px-4 py-2 shadow-sm">
      <Text className="pb-1 pt-2 font-iosevka-semibold text-base text-bark">{title}</Text>
      {children}
    </View>
  );
}

export default function TreeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const treeId = Number(id);

  const [tree, setTree] = useState<Tree | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTree = useCallback(async () => {
    if (!Number.isInteger(treeId)) {
      setError("This isn't a valid tree link.");
      return;
    }
    setError(null);
    try {
      setTree(await getTree(treeId));
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) {
        setError("This tree doesn't exist or has been deleted.");
      } else {
        setError(e instanceof Error ? e.message : "Could not load this tree");
      }
    }
  }, [treeId]);

  useEffect(() => {
    setLoading(true);
    loadTree().finally(() => setLoading(false));
  }, [loadTree]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTree();
    setRefreshing(false);
  };

  const openInMaps = (latitude: number, longitude: number) =>
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`);

  const backButton = <BackButton fallback="/trees" className="self-start px-6 pt-4" />;

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-sand">
        <StatusBar style="dark" />
        <NavBar />
        {backButton}
        <ActivityIndicator className="mt-10" color={colors.leaf} />
      </SafeAreaView>
    );
  }

  if (error || !tree) {
    return (
      <SafeAreaView className="flex-1 bg-sand">
        <StatusBar style="dark" />
        <NavBar />
        {backButton}
        <View className="mx-6 mt-6 items-center rounded-2xl bg-white p-6">
          <Text className="text-center font-iosevka-semibold text-base text-bark">
            Couldn't load this tree
          </Text>
          <Text className="mt-1 text-center font-iosevka text-sm text-bark/70">{error}</Text>
          <Pressable
            onPress={onRefresh}
            className="mt-4 rounded-full bg-leaf px-6 py-3 active:opacity-80"
          >
            <Text className="font-iosevka-semibold text-sm text-white">Try again</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-sand">
      <StatusBar style="dark" />
      <NavBar />
      <ScrollView
        contentContainerClassName="pb-12"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {backButton}

        <View className="px-6 pt-3">
          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-1">
              <Text className="font-iosevka-bold text-3xl text-bark">{tree.species_name}</Text>
              <Text className="mt-1 font-iosevka text-base italic text-bark/60">
                {tree.species_scientific_name}
              </Text>
            </View>
            <ConditionBadge condition={tree.condition} />
          </View>
          <Text className="mt-3 font-iosevka text-sm text-bark/70">
            {tree.is_present ? "Still standing" : "No longer present"}
            {tree.region ? ` · ${REGION_LABELS[tree.region]}` : ""}
          </Text>
        </View>

        <Section title="Measurements">
          <DetailRow label="Height" value={measurement(tree.height_m, "m")} />
          <DetailRow label="Trunk girth" value={measurement(tree.trunk_girth_cm, "cm")} />
          <DetailRow label="Crown spread" value={measurement(tree.crown_spread_m, "m")} />
        </Section>

        <Section title="Location">
          <DetailRow label="Region" value={tree.region ? REGION_LABELS[tree.region] : "Not set"} />
          <DetailRow label="Latitude" value={tree.latitude.toFixed(5)} />
          <DetailRow label="Longitude" value={tree.longitude.toFixed(5)} />
          <Pressable
            onPress={() => openInMaps(tree.latitude, tree.longitude)}
            className="my-3 items-center rounded-full border border-leaf px-6 py-3 active:opacity-70"
          >
            <Text className="font-iosevka-semibold text-sm text-leaf">Open in Maps</Text>
          </Pressable>
        </Section>

        <Section title="Record">
          <DetailRow label="Recorded by" value={tree.owner ?? "Unknown"} />
          <DetailRow label="Recorded on" value={formatDate(tree.created_at)} />
          <DetailRow label="Last updated" value={formatDate(tree.updated_at)} />
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}
