import { authClient, authEnabled } from "./client";
import { useEffect, useMemo } from "react";

/** Normalized user shape used across the app, auth on or off. */
export type AppUser = {
  id: string;
  displayName: string | null;
  primaryEmail: string | null;
  profileImageUrl: string | null;
  /** True when this is the sandbox/dev fallback (auth not configured). */
  isDevFallback: boolean;
};

const HINT_KEY = "bloom-auth-hint";

export type AuthHint = {
  id: string;
  displayName: string | null;
  primaryEmail: string | null;
};

export function readAuthHint(): AuthHint | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(HINT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthHint;
    return parsed?.id ? parsed : null;
  } catch {
    return null;
  }
}

function writeAuthHint(user: AppUser) {
  if (typeof window === "undefined") return;
  try {
    const hint: AuthHint = {
      id: user.id,
      displayName: user.displayName,
      primaryEmail: user.primaryEmail,
    };
    window.localStorage.setItem(HINT_KEY, JSON.stringify(hint));
  } catch {
    /* ignore */
  }
}

export function clearAuthHint() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(HINT_KEY);
  } catch {
    /* ignore */
  }
}

export const DEV_USER: AppUser = {
  id: "dev-user",
  displayName: "Dev User",
  primaryEmail: "dev@example.com",
  profileImageUrl: null,
  isDevFallback: true,
};

export type CurrentUserState = {
  user: AppUser | null;
  isPending: boolean;
};

export function useCurrentUserState(): CurrentUserState {
  if (!authEnabled) return { user: DEV_USER, isPending: false };
  const { data, isPending } = authClient.useSession();
  // eslint-disable-next-line react-hooks/rules-of-hooks -- authEnabled is constant for the app's lifetime
  const user = useMemo<AppUser | null>(() => {
    if (!data?.user) return null;
    return {
      id: data.user.id,
      displayName: data.user.name ?? null,
      primaryEmail: data.user.email ?? null,
      profileImageUrl: data.user.image ?? null,
      isDevFallback: false,
    };
  }, [data?.user]);
  // eslint-disable-next-line react-hooks/rules-of-hooks -- authEnabled is constant for the app's lifetime
  useEffect(() => {
    if (user) writeAuthHint(user);
    else if (!isPending) clearAuthHint();
  }, [user, isPending]);
  return { user, isPending };
}

export function useCurrentUser(): AppUser | null {
  return useCurrentUserState().user;
}
