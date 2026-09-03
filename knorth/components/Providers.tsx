"use client";

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
      <PageTransitionProvider>
        {children}
      </PageTransitionProvider>
    </ThemeProvider>
  );
}