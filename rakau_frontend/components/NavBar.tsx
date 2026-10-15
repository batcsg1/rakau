import { useState } from "react";
import { Image, Modal, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, usePathname, type Href } from "expo-router";

import { logout } from "../api/auth";
import type { User } from "../api/types";
import { useCurrentUser } from "../hooks/useCurrentUser";

const LINKS: { href: Href & string; label: string }[] = [
  { href: "/trees", label: "Catalogue" },
  { href: "/trees/mine", label: "My trees" },
];

// "Sam Batchelor" -> "SB", falling back to the username if no name was given
function initials(user: User): string {
  const fromName = `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`;
  return (fromName || user.username.slice(0, 2)).toUpperCase();
}

function displayName(user: User): string {
  return `${user.first_name} ${user.last_name}`.trim() || user.username;
}

// Top bar shared by the app's screens: logo, main links and the account menu
export function NavBar() {
  const pathname = usePathname();
  const user = useCurrentUser();
  const insets = useSafeAreaInsets();
  const [menuOpen, setMenuOpen] = useState(false);

  const go = (href: Href) => {
    setMenuOpen(false);
    router.push(href);
  };

  const onLogout = async () => {
    setMenuOpen(false);
    await logout();
    router.replace("/");
  };

  return (
    <View className="flex-row items-center gap-3 border-b border-bark/20 bg-sand px-4 py-2">
      <Pressable onPress={() => router.push("/")} className="active:opacity-60">
        <Image
          source={require("../assets/rakau-badge-green-transparent.png")}
          className="h-10 w-10"
          accessibilityLabel="Rākau home"
        />
      </Pressable>

      <View className="flex-1 flex-row gap-1">
        {LINKS.map((link) => {
          const active = pathname === link.href;
          return (
            <Pressable
              key={link.href}
              onPress={() => router.push(link.href)}
              className={`rounded-md px-3 py-1.5 active:opacity-70 ${active ? "bg-leaf/15" : ""}`}
            >
              <Text
                className={`font-iosevka-semibold text-sm ${active ? "text-canopy" : "text-bark/70"}`}
              >
                {link.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Nothing until we know who's signed in, so "Log in" doesn't flash for signed-in users */}
      {user === null && (
        <Pressable
          onPress={() => router.push({ pathname: "/login", params: { next: pathname } })}
          className="rounded-full border border-leaf px-4 py-1.5 active:opacity-70"
        >
          <Text className="font-iosevka-semibold text-sm text-leaf">Log in</Text>
        </Pressable>
      )}
      {user && (
        <Pressable
          onPress={() => setMenuOpen(true)}
          accessibilityLabel="Account menu"
          className="h-10 w-10 items-center justify-center rounded-full bg-canopy active:opacity-80"
        >
          <Text className="font-iosevka-bold text-sm text-white">{initials(user)}</Text>
        </Pressable>
      )}

      {user && (
        <Modal
          visible={menuOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setMenuOpen(false)}
        >
          {/* Tapping anywhere outside the menu closes it */}
          <Pressable className="flex-1 bg-black/20" onPress={() => setMenuOpen(false)}>
            <Pressable
              onPress={() => {}}
              style={{ top: insets.top + 56 }}
              className="absolute right-4 w-64 rounded-2xl border border-bark/10 bg-white shadow-lg"
            >
              <View className="border-b border-bark/10 px-4 py-3">
                <Text className="font-iosevka-semibold text-base text-bark" numberOfLines={1}>
                  {displayName(user)}
                </Text>
                <Text className="mt-0.5 font-iosevka text-xs text-bark/60" numberOfLines={1}>
                  {user.email}
                </Text>
              </View>
              <Pressable onPress={() => go("/trees/mine")} className="px-4 py-3 active:bg-sand">
                <Text className="font-iosevka text-sm text-bark">My trees</Text>
              </Pressable>
              <Pressable onPress={() => go("/trees/new")} className="px-4 py-3 active:bg-sand">
                <Text className="font-iosevka text-sm text-bark">Record a tree</Text>
              </Pressable>
              <Pressable
                onPress={onLogout}
                className="border-t border-bark/10 px-4 py-3 active:bg-sand"
              >
                <Text className="font-iosevka-semibold text-sm text-red-700">Log out</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>
      )}
    </View>
  );
}
