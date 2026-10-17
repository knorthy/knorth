"use client";
// True below the md breakpoint (768px). Pinned scroll sections use it to shorten their scroll length on
// phones, where every extra screen of thumb-scrolling costs more than on a trackpad.
// The server render assumes desktop; phones switch right after hydration.
import { useSyncExternalStore } from "react";

const QUERY = "(max-width: 767.98px)";

export function useIsMobile(): boolean {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(QUERY);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}
