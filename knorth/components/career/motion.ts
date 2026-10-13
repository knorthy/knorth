// Shared motion values for the career sections — keep the three sections feeling like one system.
import type { Transition } from "framer-motion";

/** Strong ease-out for entrances */
export const EASE_OUT = [0.23, 1, 0.32, 1] as const;

export const ENTER_DURATION = 0.35; // s — small items (chips, cards)
export const ENTER_DURATION_LG = 0.45; // s — timeline entries

export const STAGGER_ITEM = 0.04; // s — between skill chips
export const STAGGER_GROUP = 0.12; // s — between skill categories
export const STAGGER_CARD = 0.06; // s — between certification cards

/** Trigger when ~25% of the element is visible, once per page load */
export const VIEWPORT = { once: true, amount: 0.25 } as const;

export const enter = (duration = ENTER_DURATION): Transition => ({ duration, ease: EASE_OUT });
