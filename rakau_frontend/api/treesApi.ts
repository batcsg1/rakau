import { request, toApiError } from "./client";
import type { Paginated, Tree, TreeFilters, TreeInput } from "./types";

// Builds "?species_slug=kauri&region=otago" from the filters that are set
function toQuery(filters: TreeFilters): string {
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

// Get the signed-in user's Trees, newest first, 20 per page
// Needs GET /api/trees/mine/ (#9), which the API doesn't have yet
export async function getMyTrees(page = 1): Promise<Paginated<Tree>> {
  const response = await request(`/trees/mine/?page=${page}`);

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
export async function updateTree(
  id: number,
  tree: Partial<TreeInput>,
): Promise<Tree> {
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
