"use client";
// prefers-reduced-motion without hydration mismatches. Framer's useReducedMotion answers differently on
// the server (null) and the client (true/false), so components that render different markup for
// reduced motion broke hydration. useSyncExternalStore renders the server answer (false) during
// hydration, then re-renders with the real preference.
import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches, () => false);
}
