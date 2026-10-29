import { File as DeviceFile } from "expo-file-system";

import { request, toApiError } from "./client";
import type { Paginated, Tree, TreeFilters, TreeInput, TreePhoto } from "./types";

// Builds "?species_slug=kauri&region=otago" from the params that are set
function toQuery(filters: object): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== "") {
      params.append(key, String(value));
    }
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}

// Get Trees, optionally filtered
export async function getTrees(filters: TreeFilters = {}): Promise<Tree[]> {
  const response = await request(`/trees/${toQuery(filters)}`);

  if (!response.ok) {
    throw await toApiError(response, `Failed to fetch trees: ${response.status}`);
  }

  return response.json();
}

// Get the signed-in user's Trees, 20 per page, newest first unless filters.ordering says otherwise
export async function getMyTrees(page = 1, filters: TreeFilters = {}): Promise<Paginated<Tree>> {
  const query = toQuery({ ...filters, page });
  const response = await request(`/trees/mine/${query}`);

  if (!response.ok) {
    throw await toApiError(response, `Failed to fetch your trees: ${response.status}`);
  }

  return response.json();
}

// Get Tree by ID
export async function getTree(id: number): Promise<Tree> {
  const response = await request(`/trees/${id}/`);

  if (!response.ok) {
    throw await toApiError(response, `Failed to fetch tree: ${response.status}`);
  }

  return response.json();
}

// Create a tree
export async function createTree(tree: TreeInput): Promise<Tree> {
  const response = await request("/trees/", {
    method: "POST",
    body: JSON.stringify(tree),
  });

  if (!response.ok) {
    throw await toApiError(response, "Could not create tree");
  }

  return response.json();
}

// Update a tree
export async function updateTree(id: number, tree: Partial<TreeInput>): Promise<Tree> {
  const response = await request(`/trees/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(tree),
  });

  if (!response.ok) {
    throw await toApiError(response, "Could not update tree");
  }

  return response.json();
}

// Delete a tree
export async function deleteTree(id: number): Promise<void> {
  const response = await request(`/trees/${id}/`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw await toApiError(response, "Could not delete tree");
  }
}

// A picked or taken image, as expo-image-picker describes it
export interface PhotoFile {
  uri: string; // file:// on a phone
  file?: File; // web only: the browser's File
}

// Upload a photo to a tree (owner or staff). A rejected file throws an ApiError whose
// fieldErrors.image says why, e.g. too large, the wrong type, or the tree already has 5
export async function uploadTreePhoto(treeId: number, photo: PhotoFile): Promise<TreePhoto> {
  const body = new FormData();
  // SDK 58's fetch (expo/fetch) only accepts Blob-like parts, and rejects React Native's
  // { uri, name, type } with "Unsupported FormDataPart implementation". expo-file-system's
  // File is a Blob read from the uri, named after the file, e.g. "abc123.jpeg"
  body.append("image", photo.file ?? new DeviceFile(photo.uri));

  const response = await request(`/trees/${treeId}/photos/`, { method: "POST", body });

  if (!response.ok) {
    throw await toApiError(response, "Could not upload the photo");
  }

  return response.json();
}

// Delete one of a tree's photos (owner or staff); the API removes the file too
export async function deleteTreePhoto(treeId: number, photoId: number): Promise<void> {
  const response = await request(`/trees/${treeId}/photos/${photoId}/`, { method: "DELETE" });

  if (!response.ok) {
    throw await toApiError(response, "Could not delete the photo");
  }
}
