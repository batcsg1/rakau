import { request, toApiError } from "./client";
import type { User } from "./types";

// Get the signed-in user, e.g. to show their name or decide whether to show Edit on a tree
export async function getMe(): Promise<User> {
  const response = await request("/auth/me/");

  if (!response.ok) {
    throw await toApiError(response, `Failed to fetch your account: ${response.status}`);
  }

  return response.json();
}
