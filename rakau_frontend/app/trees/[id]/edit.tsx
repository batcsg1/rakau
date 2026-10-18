import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { router, useLocalSearchParams } from "expo-router";

import { getTree, updateTree } from "../../../api/treesApi";
import type { Tree, TreeInput } from "../../../api/types";
import { BackButton } from "../../../components/BackButton";
import { NavBar } from "../../../components/NavBar";
import { TreeForm } from "../../../components/TreeForm";
import colors from "../../../constants/colors";
import { useCurrentUser } from "../../../hooks/useCurrentUser";
import { useRequireAuth } from "../../../hooks/useRequireAuth";

export default function EditTreeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const treeId = Number(id);
  const validLink = Number.isInteger(treeId);

  // Only signed-in users can edit; come back here after logging in
  const checkingAuth = useRequireAuth(`/trees/${id}/edit`);
  const user = useCurrentUser();

  const [tree, setTree] = useState<Tree | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (checkingAuth || !validLink) return;
    getTree(treeId)
      .then(setTree)
      .catch((e) => setError(e instanceof Error ? e.message : "Could not load this tree"));
  }, [checkingAuth, validLink, treeId]);

  const onSubmit = async (input: TreeInput) => {
    // Only send the species if it changed, so a tree whose species has since been retired
    // can still have its other fields edited
    const { species_slug, ...rest } = input;
    await updateTree(treeId, species_slug === tree?.species_slug ? rest : input);
    // Back to the tree's page, which reloads on focus
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(`/trees/${treeId}`);
    }
  };

  // The API returns 403 for non-owners anyway; this just explains it up front
  const canModify =
    !!user && !!tree && (user.is_staff || (!!tree.owner && tree.owner === user.username));

  const message = !validLink
    ? "This isn't a valid tree link."
    : (error ??
      (tree && user !== undefined && !canModify ? "You can only edit trees you recorded." : null));

  return (
    <SafeAreaView className="flex-1 bg-sand">
      <StatusBar style="dark" />
      <NavBar />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerClassName="px-6 pb-12" keyboardShouldPersistTaps="handled">
          <BackButton fallback={`/trees/${id}`} />

          <Text className="mt-6 font-iosevka-bold text-3xl text-bark">Edit tree</Text>

          {message ? (
            <View className="mt-6 items-center rounded-2xl bg-white p-6">
              <Text className="text-center font-iosevka-semibold text-base text-bark">
                Can't edit this tree
              </Text>
              <Text className="mt-1 text-center font-iosevka text-sm text-bark/70">{message}</Text>
            </View>
          ) : !tree || user === undefined ? (
            <ActivityIndicator className="mt-10" color={colors.leaf} />
          ) : (
            <>
              <Text className="mt-1 font-iosevka text-sm text-bark/70">
                {tree.species_name} · Fields marked * are required.
              </Text>
              <TreeForm initial={tree} submitLabel="Save changes" onSubmit={onSubmit} />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
