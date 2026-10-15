import { useEffect, useState } from "react";
import { router, type Href } from "expo-router";

import { isLoggedIn } from "../api/auth";

// Sends signed-out users to login, coming back to `returnTo` afterwards.
// Returns true while the check is still running, so screens can show a spinner
export function useRequireAuth(returnTo: Href & string): boolean {
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    isLoggedIn().then((loggedIn) => {
      if (loggedIn) {
        setCheckingAuth(false);
      } else {
        router.replace({ pathname: "/login", params: { next: returnTo } });
      }
    });
  }, [returnTo]);

  return checkingAuth;
}
