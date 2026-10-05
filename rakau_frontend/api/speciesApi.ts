import { request, toApiError } from "./client";
import type { Species } from "./types";

// Get Species, e.g. for the Add Tree species picker
export async function getSpecies(): Promise<Species[]> {
  const response = await request("/species/");

  if (!response.ok) {
    throw await toApiError(response, `Failed to fetch species: ${response.status}`);
  }

  return response.json();
}

// Get Species by ID
export async function getSpeciesById(id: number): Promise<Species> {
  const response = await request(`/species/${id}/`);

  if (!response.ok) {
    throw await toApiError(response, `Failed to fetch species: ${response.status}`);
  }

  return response.json();
}
