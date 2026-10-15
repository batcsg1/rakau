import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";

import { getMe } from "../api/accountsApi";
import { getToken } from "../api/auth";
import type { User } from "../api/types";

// Shared by every screen's nav bar so /auth/me/ isn't refetched on each navigation.
// Keyed by the access token, so logging in as someone else (or a token refresh) refetches
let cached: { token: string; user: User } | null = null;

// The signed-in user, null when signed out, or undefined while still checking.
// Re-checks whenever the screen regains focus, e.g. after logging in or out elsewhere
export function useCurrentUser(): User | null | undefined {
  const [user, setUser] = useState<User | null | undefined>(cached?.user);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      (async () => {
        const token = await getToken();
        if (!token) {
          cached = null;
          if (active) setUser(null);
          return;
        }
        if (cached?.token !== token) {
          try {
            cached = { token, user: await getMe() };
          } catch {
            // Offline or server down: leave the nav as it was rather than showing "Log in"
            return;
          }
        }
        if (active) setUser(cached.user);
      })();

      return () => {
        active = false;
      };
    }, []),
  );

  return user;
}
