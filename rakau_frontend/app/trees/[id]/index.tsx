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
import { router, useLocalSearchParams } from "expo-router";

import { ApiError } from "../../../api/client";
import { formatAddress } from "../../../api/photonApi";
import { deleteTree, getTree } from "../../../api/treesApi";
import { REGION_LABELS, type Tree } from "../../../api/types";
import { BackButton } from "../../../components/BackButton";
import { NavBar } from "../../../components/NavBar";
import { PhotoGallery } from "../../../components/PhotoGallery";
import { ConditionBadge } from "../../../components/ConditionBadge";
import { SignificanceBadge } from "../../../components/SignificanceBadge";
import colors from "../../../constants/colors";
import { useCurrentUser } from "../../../hooks/useCurrentUser";
import { useRefreshOnFocus } from "../../../hooks/useRefreshOnFocus";

// "30.00" -> "30 m"; missing measurements show as a dash
function measurement(value: string | null, unit: string): string {
  return value === null ? "—" : `${Number(value)} ${unit}`;
}

// "2026-10-18T06:50:00Z" -> "18 October 2026 at 7:50 pm", in the device's time zone
function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-NZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
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

  const user = useCurrentUser();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

  // Picks up changes saved on the edit screen
  useRefreshOnFocus(loadTree);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTree();
    setRefreshing(false);
  };

  const onDelete = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteTree(treeId);
      // Back to My Trees if it's in the history (it refreshes on focus), otherwise open it
      router.dismissTo("/trees/mine");
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : "Could not delete this tree");
      setDeleting(false);
    }
  };

  const openInMaps = (latitude: number, longitude: number) =>
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`);

  const backButton = <BackButton fallback="/trees" className="self-start px-6 pt-4" />;

  // Mirrors IsOwnerOrReadOnly: only the tree's owner (or staff) can change it
  const canModify =
    !!user && !!tree && (user.is_staff || (!!tree.owner && tree.owner === user.username));

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
            {/* Labelled so the coloured pills read as fields, not decoration (UAT I1, #56) */}
            <View className="items-end gap-2">
              <View className="flex-row items-center gap-2">
                <Text className="font-iosevka text-xs text-bark/60">Condition</Text>
                <ConditionBadge condition={tree.condition} />
              </View>
              {/* The badge hides itself for "none", so the label goes with it */}
              {tree.significance_status !== "none" && (
                <View className="flex-row items-center gap-2">
                  <Text className="font-iosevka text-xs text-bark/60">Significance</Text>
                  <SignificanceBadge significance={tree.significance_status} />
                </View>
              )}
            </View>
          </View>
          <Text className="mt-3 font-iosevka text-sm text-bark/70">
            {tree.is_present ? "Still standing" : "No longer present"}
            {tree.region ? ` · ${REGION_LABELS[tree.region]}` : ""}
          </Text>

          {canModify && !confirmingDelete && (
            <View className="mt-4 flex-row gap-3">
              <Pressable
                onPress={() => router.push(`/trees/${tree.id}/edit`)}
                className="flex-1 items-center rounded-full bg-leaf px-6 py-3 active:opacity-80"
              >
                <Text className="font-iosevka-semibold text-sm text-white">Edit</Text>
              </Pressable>
              <Pressable
                onPress={() => setConfirmingDelete(true)}
                className="flex-1 items-center rounded-full border border-red-700 px-6 py-3 active:opacity-70"
              >
                <Text className="font-iosevka-semibold text-sm text-red-700">Delete</Text>
              </Pressable>
            </View>
          )}

          {/* Shown in-app rather than with Alert, which does nothing on web */}
          {/* Asked as a question, naming the tree, so it reads as a confirmation (UAT I3, #58) */}
          {canModify && confirmingDelete && (
            <View className="mt-4 rounded-2xl border border-red-700/40 bg-white p-4">
              <Text className="font-iosevka-semibold text-base text-bark">
                Are you sure you want to delete this {tree.species_name}?
              </Text>
              <Text className="mt-1 font-iosevka text-sm text-bark/70">
                This removes the record for everyone and can't be undone.
              </Text>
              {deleteError && (
                <Text className="mt-2 font-iosevka text-sm text-red-700">{deleteError}</Text>
              )}
              <View className="mt-4 flex-row gap-3">
                <Pressable
                  onPress={() => {
                    setConfirmingDelete(false);
                    setDeleteError(null);
                  }}
                  disabled={deleting}
                  className="flex-1 items-center rounded-full border border-leaf px-6 py-3 active:opacity-70 disabled:opacity-50"
                >
                  <Text className="font-iosevka-semibold text-sm text-leaf">No, keep it</Text>
                </Pressable>
                <Pressable
                  onPress={onDelete}
                  disabled={deleting}
                  className="flex-1 items-center rounded-full bg-red-700 px-6 py-3 active:opacity-80 disabled:opacity-50"
                >
                  {deleting ? (
                    <ActivityIndicator color={colors.white} />
                  ) : (
                    <Text className="font-iosevka-semibold text-sm text-white">Yes, delete</Text>
                  )}
                </Pressable>
              </View>
            </View>
          )}
        </View>

        <Section title="Photos">
          <PhotoGallery
            treeId={tree.id}
            photos={tree.photos}
            canModify={canModify}
            onPhotosChange={(photos) => setTree((current) => current && { ...current, photos })}
          />
        </Section>

        <Section title="Measurements">
          <DetailRow label="Height" value={measurement(tree.height_m, "m")} />
          <DetailRow label="Trunk girth" value={measurement(tree.trunk_girth_cm, "cm")} />
          <DetailRow label="Crown spread" value={measurement(tree.crown_spread_m, "m")} />
        </Section>

        <Section title="Location">
          <DetailRow label="Address" value={formatAddress(tree) || "Not set"} />
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
          <DetailRow label="Recorded on" value={formatDateTime(tree.created_at)} />
          <DetailRow label="Last updated" value={formatDateTime(tree.updated_at)} />
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}
