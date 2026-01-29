"use client";

import { useState, useEffect } from "react";
import {
  getWindowDimensions,
  hp,
  wp,
  getBreakpoint,
  responsiveFontSize,
} from "@/utils/responsive";

interface WindowDimensions {
  width: number;
  height: number;
}

/**
 * Custom hook to get responsive dimensions and breakpoints
 * Must be used in client components only
 * @example
 * const { width, height, bp, hp, wp } = useResponsive()
 */
export const useResponsive = () => {
  const [dimensions, setDimensions] = useState<WindowDimensions>({
    width: 0,
    height: 0,
  });
  const [breakpoint, setBreakpoint] = useState<ReturnType<typeof getBreakpoint>>("md");

  useEffect(() => {
    // Set initial dimensions
    const initialDimensions = getWindowDimensions();
    setDimensions(initialDimensions);
    setBreakpoint(getBreakpoint());

    // Handle window resize
    const handleResize = () => {
      const newDimensions = getWindowDimensions();
      setDimensions(newDimensions);
      setBreakpoint(getBreakpoint());
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return {
    width: dimensions.width,
    height: dimensions.height,
    bp: breakpoint,
    hp: (percentage: number) => hp(percentage),
    wp: (percentage: number) => wp(percentage),
    responsiveFontSize: (baseFontSize: number, maxWidth?: number) =>
      responsiveFontSize(baseFontSize, maxWidth),
  };
};
