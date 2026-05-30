/*
 * color.ts
 * Created by Dewan Mobashirul
 * Copyright (c) 2026 dewan-meadown
 * All rights reserved
 */

/** ANSI SGR codes for the colors/styles the logger uses. */
const CODES = {
  red: "38;2;239;68;68", // truecolor #ef4444
  yellow: 33,
  green: 32,
  cyan: "38;5;37", // 256-color deep cyan (#00afaf)
  gray: 90, // bright black — renders as light gray
  teal: "38;5;30", // 256-color teal (#008787)
  dimTeal: "38;5;23", // 256-color darker teal (#005f5f)
  bold: 1,
} as const

/** The named colors/styles {@link colorize} understands. */
export type Color = keyof typeof CODES

const RESET = "\x1b[0m"

/**
 * Wraps `text` in the ANSI escape codes for `color`, resetting afterwards.
 * Pure string work — deciding *whether* to colorize is the caller's job (see
 * `isTTY`), kept separate so it can be checked once per entry.
 */
export function colorize(text: string, color: Color): string {
  return `\x1b[${CODES[color]}m${text}${RESET}`
}
