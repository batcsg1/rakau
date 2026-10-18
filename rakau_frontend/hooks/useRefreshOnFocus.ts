import { useCallback, useRef } from "react";
import { useFocusEffect } from "expo-router";

// Re-runs `refresh` whenever the screen comes back into focus (e.g. after editing or
// deleting a tree on another screen), but not on the first focus, which the screen's
// own initial load already covers
export function useRefreshOnFocus(refresh: () => unknown) {
  const firstFocus = useRef(true);
  const latest = useRef(refresh);
  latest.current = refresh;

  useFocusEffect(
    useCallback(() => {
      if (firstFocus.current) {
        firstFocus.current = false;
        return;
      }
      latest.current();
    }, []),
  );
}
