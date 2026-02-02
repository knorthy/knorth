"use client";

import { useState } from "react";

export function usePreloader() {
  const [isLoading, setIsLoading] = useState(true);
  const bypassLoading = () => setIsLoading(false);

  return { isLoading, bypassLoading };
}