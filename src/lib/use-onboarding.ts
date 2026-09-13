const KEY = "bloom-onboarding-done";

function isDone(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(KEY) === "1";
  } catch {
    return true;
  }
}

function markDone() {
  try {
    window.localStorage.setItem(KEY, "1");
  } catch {
    /* ignore */
  }
}

export { isDone as isOnboardingDone, markDone as markOnboardingDone };
