import * as SecureStore from "expo-secure-store";
import { BASE_URL } from "./config";
import { ApiError, toApiError } from "./errors";
import type { User } from "./types";

const ACCESS_KEY = "rakau.access";
const REFRESH_KEY = "rakau.refresh";

type TokenPair = { access: string; refresh: string };

export async function saveTokens({ access, refresh }: TokenPair): Promise<void> {
  await SecureStore.setItemAsync(ACCESS_KEY, access);
  await SecureStore.setItemAsync(REFRESH_KEY, refresh);
}

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(ACCESS_KEY);
}

export async function clearTokens(): Promise<void> {
  await SecureStore.deleteItemAsync(ACCESS_KEY);
  await SecureStore.deleteItemAsync(REFRESH_KEY);
}

export async function isLoggedIn(): Promise<boolean> {
  return (await getToken()) !== null;
}

function post(path: string, body: object): Promise<Response> {
  return fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
}

// Logs in with email + password; returns the user so screens can greet them straight away
export async function login(email: string, password: string): Promise<User> {
  const response = await post("/auth/login/", { email, password });

  if (response.status === 401) {
    throw new ApiError("Invalid email or password", 401);
  }
  if (!response.ok) {
    throw await toApiError(response, "Could not log in");
  }

  const data: TokenPair & { user: User } = await response.json();
  await saveTokens(data);
  return data.user;
}

// Creates the account, then logs straight in so the user doesn't have to re-enter details
export async function register(
  username: string,
  email: string,
  password: string,
): Promise<User> {
  const response = await post("/auth/register/", { username, email, password });

  if (!response.ok) {
    throw await toApiError(response, "Could not create your account");
  }

  return login(email, password);
}

export async function logout(): Promise<void> {
  await clearTokens();
}

// Shared so several requests failing with 401 at once only trigger one refresh
let refreshing: Promise<boolean> | null = null;

// Swaps the refresh token for a new access token; false if the refresh token has expired too
export function refreshAccessToken(): Promise<boolean> {
  refreshing ??= (async () => {
    try {
      const refresh = await SecureStore.getItemAsync(REFRESH_KEY);
      if (!refresh) return false;

      const response = await post("/auth/token/refresh/", { refresh });
      if (!response.ok) return false;

      const data: { access: string } = await response.json();
      await SecureStore.setItemAsync(ACCESS_KEY, data.access);
      return true;
    } catch {
      return false;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}
