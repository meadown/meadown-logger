/*
 * visibleLines.ts
 * Created by Dewan Mobashirul
 * Copyright (c) 2026 meadown
 * All rights reserved
 */

import { DEFAULT_MAX_LINES } from "../../../constants.js"

/** Max message lines to show before collapsing the rest; 0 (default) shows all. */
export let visibleLines = DEFAULT_MAX_LINES

/** How many lines a long message shows before collapsing (0 = all). */
export function getVisibleLines(): number {
  return visibleLines
}

/** Set how many lines a long message shows before collapsing (0 = all). */
export function setVisibleLines(value: number): void {
  visibleLines = Number.isFinite(value) && value > 0 ? Math.floor(value) : 0
}
