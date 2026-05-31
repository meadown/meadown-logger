/*
 * constants.ts
 * Created by Dewan Mobashirul
 * Copyright (c) 2026 meadown
 * All rights reserved
 *
 * Single home for the logger's layout/behavior constants, so the values that
 * shape an entry live in one place instead of as magic literals across modules.
 */

/** Glyphs that draw each entry's little tree. */
export const BRANCH = "├──" // the message branch
export const BRANCH_END = "└──" // the last (metadata) branch
export const SEPARATOR = "-" // between the timestamp and the location

/** Hang-indent for message continuation lines, so they align under the message
 * text (the `├── ` branch is 4 columns wide). */
export const MESSAGE_INDENT = "│   "

/** Default for the collapse setting: 0 = show every line. */
export const DEFAULT_MAX_LINES = 0
