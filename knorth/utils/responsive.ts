/**
 * Responsive dimension utilities for web
 * Similar to React Native Dimensions but for web apps
 */

export const getWindowDimensions = () => {
  if (typeof window === "undefined") {
    return { width: 0, height: 0 };
  }
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
};

/**
 * Height percentage - calculates a percentage of viewport height
 * @param percentage - number between 0-100
 * @returns pixel value
 * @example hp(50) returns 50% of viewport height
 */
export const hp = (percentage: number): number => {
  if (typeof window === "undefined") return 0;
  const { height } = getWindowDimensions();
  return (percentage * height) / 100;
};

/**
 * Width percentage - calculates a percentage of viewport width
 * @param percentage - number between 0-100
 * @returns pixel value
 * @example wp(50) returns 50% of viewport width
 */
export const wp = (percentage: number): number => {
  if (typeof window === "undefined") return 0;
  const { width } = getWindowDimensions();
  return (percentage * width) / 100;
};

/**
 * Responsive font size that scales based on viewport width
 * @param baseFontSize - base font size in pixels
 * @param maxWidth - max screen width to stop scaling
 * @returns scaled font size
 */
export const responsiveFontSize = (
  baseFontSize: number,
  maxWidth: number = 1200
): number => {
  const { width } = getWindowDimensions();
  if (width >= maxWidth) return baseFontSize;
  return (baseFontSize * width) / maxWidth;
};

/**
 * Get responsive breakpoint
 * @example getBreakpoint() returns 'sm', 'md', 'lg', 'xl', '2xl'
 */
export const getBreakpoint = (): "sm" | "md" | "lg" | "xl" | "2xl" | "xs" => {
  const { width } = getWindowDimensions();
  if (width < 640) return "xs";
  if (width < 768) return "sm";
  if (width < 1024) return "md";
  if (width < 1280) return "lg";
  if (width < 1536) return "xl";
  return "2xl";
};
