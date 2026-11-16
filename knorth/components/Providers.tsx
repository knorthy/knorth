"use client";

import { MotionConfig } from "framer-motion";
import { ThemeProvider } from "next-themes";
import { PageTransitionProvider } from "@/components/PageTransition";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      storageKey="theme"
    >
      <MotionConfig reducedMotion="user">
        <PageTransitionProvider>
          {children}
        </PageTransitionProvider>
      </MotionConfig>
    </ThemeProvider>
  );
}