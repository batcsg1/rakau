import type { Href } from "expo-router";

// Where to go after login/register. Only accepts in-app paths, so a crafted
// link can't send someone off to an external site after they sign in
export function safeNext(next: string | string[] | undefined): Href {
  const path = Array.isArray(next) ? next[0] : next;
  return path?.startsWith("/") && !path.startsWith("//") ? (path as Href) : "/trees";
}
