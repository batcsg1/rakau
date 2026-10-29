import { router } from "expo-router";
import { clearTokens, getToken, refreshAccessToken } from "./auth";
import { BASE_URL } from "./config";

export { ApiError, toApiError, type FieldErrors } from "./errors";

// Base HTTP helper: attaches auth, resolves the URL, handles 401s
export async function request(
  path: string,
  options: RequestInit = {},
  retried = false,
): Promise<Response> {
  const token = await getToken();

  const headers: Record<string, string> = {
    // A FormData upload sets its own multipart Content-Type, including the boundary
    ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
    Accept: "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  // A 401 without a token just means the endpoint needs login.
  // With a token, the access token has expired: refresh it once and retry,
  // and only send the user to login if the refresh token has expired too
  if (response.status === 401 && token) {
    if (!retried && (await refreshAccessToken())) {
      return request(path, options, true);
    }
    await clearTokens();
    router.replace("/login");
  }

  return response;
}
