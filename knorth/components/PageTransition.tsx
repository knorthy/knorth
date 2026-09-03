"use client";

import {
  createContext,
  useContext,
  useRef,
  useState,
  useCallback,
  useEffect,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { CircleWipe } from "@/components/CircleWipe";

/* ── Context ─────────────────────────────────────────────────────────────── */
interface TransitionContextValue {
  navigate: (href: string, originX?: number, originY?: number) => void;
}

const TransitionContext = createContext<TransitionContextValue>({
  navigate: (href) => { window.location.href = href; },
});

export function usePageTransition() {
  return useContext(TransitionContext);
}

/* ── Provider ────────────────────────────────────────────────────────────── */
export function PageTransitionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [wipeActive, setWipeActive] = useState(false);
  const [wipeOrigin, setWipeOrigin] = useState({ x: 0, y: 0 });
  const pendingHref = useRef<string | null>(null);
  const pendingReveal = useRef(false);
  const savedOrigin = useRef({ x: 0, y: 0 });

  const navigate = useCallback(
    (href: string, ox?: number, oy?: number) => {
      // Always expand from the center of the viewport for a clean centered transition
      const x = window.innerWidth / 2;
      const y = window.innerHeight / 2;
      savedOrigin.current = { x, y };
      pendingHref.current = href;
      setWipeOrigin({ x, y });
      setWipeActive(true);
    },
    []
  );

  // Called when circles have fully covered the screen
  const handleCovered = useCallback(() => {
    if (pendingHref.current) {
      pendingReveal.current = true;
      router.push(pendingHref.current);
      pendingHref.current = null;
    }
  }, [router]);

  // Called when the reveal shrink is complete
  const handleDone = useCallback(() => {
    setWipeActive(false);
  }, []);

  // On route change, keep the wipe mounted so it can play the reveal
  useEffect(() => {
    // pathname changed — reveal is handled by CircleWipe's own onDone
  }, [pathname]);

  return (
    <TransitionContext.Provider value={{ navigate }}>
      {children}
      {wipeActive && (
        <CircleWipe
          origin={wipeOrigin}
          onCovered={handleCovered}
          onDone={handleDone}
        />
      )}
    </TransitionContext.Provider>
  );
}
