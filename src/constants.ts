/*
 * constants.ts
 * Created by Dewan Mobashirul
 * Copyright (c) 2026 dewan-meadown
 * All rights reserved
 *
 * Single home for the logger's layout/behavior constants, so the values that
 * shape an entry live in one place instead of as magic literals across modules.
 */

import { type Color } from "./colors/color.js"

/** The console channels the logger writes to. */
export type LogChannel = "log" | "error" | "warn"

/** The tag color per channel: info/tap → cyan, warn → yellow, error → red. */
export const TAG_COLOR: Record<LogChannel, Color> = {
  log: "cyan",
  warn: "yellow",
  error: "red",
}

/** Glyphs that draw each entry's little tree. */
export const BRANCH = "├──" // the message branch
export const BRANCH_END = "└──" // the last (metadata) branch
export const SEPARATOR = "-" // between the timestamp and the location

/** Hang-indent for message continuation lines, so they align under the message
 * text (the `├── ` branch is 4 columns wide). */
export const MESSAGE_INDENT = "|\t"

/** Default for the collapse setting: 0 = show every line. */
export const DEFAULT_MAX_LINES = 0
