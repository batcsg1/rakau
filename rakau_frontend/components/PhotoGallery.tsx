import { useState } from "react";
import { ActivityIndicator, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";

import { ApiError } from "../api/errors";
import { deleteTreePhoto, uploadTreePhoto } from "../api/treesApi";
import { MAX_PHOTOS_PER_TREE, type TreePhoto } from "../api/types";
import colors from "../constants/colors";

type Source = "camera" | "library";

// Re-compresses phone photos (often 3–8 MB) to well under the API's 5 MB limit
const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = { mediaTypes: ["images"], quality: 0.8 };

const PERMISSION_DENIED: Record<Source, string> = {
  camera: "Camera permission was denied. Allow it in your phone's settings to take a photo.",
  library: "Photo library permission was denied. Allow it in your phone's settings to add a photo.",
};

type PhotoGalleryProps = {
  treeId: number;
  photos: TreePhoto[];
  // The tree's owner or staff: mirrors IsOwnerOrReadOnly, which the API enforces anyway
  canModify: boolean;
  onPhotosChange: (photos: TreePhoto[]) => void;
};

// A tree's photos in a horizontal strip. Everyone can see them; the owner can add one from
// the camera or library and delete one after confirming (#44)
export function PhotoGallery({ treeId, photos, canModify, onPhotosChange }: PhotoGalleryProps) {
  const [choosingSource, setChoosingSource] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const atLimit = photos.length >= MAX_PHOTOS_PER_TREE;

  const addPhoto = async (source: Source) => {
    setError(null);
    // On web the picker must open straight from the tap, and there are no permissions to ask
    if (Platform.OS !== "web") {
      const permission =
        source === "camera"
          ? await ImagePicker.requestCameraPermissionsAsync()
          : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setError(PERMISSION_DENIED[source]);
        return;
      }
    }

    const result =
      source === "camera"
        ? await ImagePicker.launchCameraAsync(PICKER_OPTIONS)
        : await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);
    if (result.canceled) return;

    const asset = result.assets[0];
    const type = asset.mimeType ?? "image/jpeg";
    setChoosingSource(false);
    setUploading(true);
    try {
      const photo = await uploadTreePhoto(treeId, {
        uri: asset.uri,
        name: asset.fileName ?? `tree-photo.${type.split("/")[1]}`,
        type,
        file: asset.file,
      });
      onPhotosChange([...photos, photo]);
    } catch (e) {
      // e.g. "Photos must be 5 MB or smaller." or "Upload a JPEG, PNG or WebP image."
      setError(
        e instanceof ApiError
          ? (e.fieldErrors.image?.join(" ") ?? e.message)
          : "Couldn't reach the server. Check your connection and try again.",
      );
    } finally {
      setUploading(false);
    }
  };

  const deletePhoto = async (photoId: number) => {
    setDeleting(true);
    setError(null);
    try {
      await deleteTreePhoto(treeId, photoId);
      onPhotosChange(photos.filter((p) => p.id !== photoId));
      setConfirmingId(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete the photo");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <View className="pb-3">
      {photos.length === 0 && !uploading ? (
        <Text className="py-2 font-iosevka text-sm text-bark/60">No photos yet.</Text>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-3 py-2"
        >
          {photos.map((photo) => (
            <View key={photo.id} className="w-40">
              <Image
                source={{ uri: photo.url }}
                contentFit="cover"
                accessibilityLabel={photo.caption || "Photo of the tree"}
                style={{ width: 160, height: 120, borderRadius: 12 }}
              />
              {canModify && (
                <Pressable
                  onPress={() => setConfirmingId(photo.id)}
                  accessibilityRole="button"
                  accessibilityLabel="Delete photo"
                  className="absolute right-1.5 top-1.5 h-7 w-7 items-center justify-center rounded-full bg-black/60 active:opacity-70"
                >
                  <Text className="font-iosevka-semibold text-sm text-white">✕</Text>
                </Pressable>
              )}
              {photo.caption ? (
                <Text className="mt-1 font-iosevka text-xs text-bark/70" numberOfLines={2}>
                  {photo.caption}
                </Text>
              ) : null}
            </View>
          ))}
          {uploading && (
            <View className="h-[120px] w-40 items-center justify-center rounded-xl bg-leaf/10">
              <ActivityIndicator color={colors.leaf} />
              <Text className="mt-2 font-iosevka text-xs text-bark/70">Uploading…</Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* In-page rather than Alert, which does nothing on web; same wording as deleting a tree */}
      {confirmingId !== null && (
        <View className="mt-2 rounded-2xl border border-red-700/40 bg-white p-4">
          <Text className="font-iosevka-semibold text-base text-bark">
            Are you sure you want to delete this photo?
          </Text>
          <Text className="mt-1 font-iosevka text-sm text-bark/70">This can't be undone.</Text>
          <View className="mt-4 flex-row gap-3">
            <Pressable
              onPress={() => setConfirmingId(null)}
              disabled={deleting}
              className="flex-1 items-center rounded-full border border-leaf px-6 py-3 active:opacity-70 disabled:opacity-50"
            >
              <Text className="font-iosevka-semibold text-sm text-leaf">No, keep it</Text>
            </Pressable>
            <Pressable
              onPress={() => deletePhoto(confirmingId)}
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

      {error && <Text className="mt-2 font-iosevka text-sm text-red-700">{error}</Text>}

      {canModify && confirmingId === null && (
        <View className="mt-2">
          {atLimit ? (
            <Text className="font-iosevka text-xs text-bark/60">
              {MAX_PHOTOS_PER_TREE} of {MAX_PHOTOS_PER_TREE} photos. Delete one to add another.
            </Text>
          ) : choosingSource ? (
            <View className="flex-row flex-wrap gap-2">
              <Pressable
                onPress={() => addPhoto("camera")}
                disabled={uploading}
                className="rounded-full bg-leaf px-4 py-2 active:opacity-80 disabled:opacity-50"
              >
                <Text className="font-iosevka-semibold text-sm text-white">Take photo</Text>
              </Pressable>
              <Pressable
                onPress={() => addPhoto("library")}
                disabled={uploading}
                className="rounded-full bg-leaf px-4 py-2 active:opacity-80 disabled:opacity-50"
              >
                <Text className="font-iosevka-semibold text-sm text-white">
                  Choose from library
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setChoosingSource(false)}
                className="rounded-full px-4 py-2 active:opacity-60"
              >
                <Text className="font-iosevka-semibold text-sm text-leaf">Cancel</Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={() => {
                setError(null);
                setChoosingSource(true);
              }}
              disabled={uploading}
              className="self-start rounded-full border border-leaf px-4 py-2 active:opacity-70 disabled:opacity-50"
            >
              <Text className="font-iosevka-semibold text-sm text-leaf">+ Add photo</Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}
