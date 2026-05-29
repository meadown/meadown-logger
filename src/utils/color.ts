/*
 * color.ts
 * Created by Dewan Mobashirul
 * Copyright (c) 2026 dewan-meadown
 * All rights reserved
 */

/** ANSI SGR codes for the colors/styles the logger uses. */
const CODES = {
  red: 31,
  yellow: 33,
  cyan: 36,
  gray: 90, // bright black — renders as light gray
  dim: 2,
} as const

/** The named colors/styles {@link colorize} understands. */
export type Color = keyof typeof CODES

const RESET = "\x1b[0m"

/**
 * Wraps `text` in the ANSI escape codes for `color`, resetting afterwards.
 * Pure string work — deciding *whether* to colorize is {@link supportsColor}'s
 * job, kept separate so callers control it per stream.
 */
export function colorize(text: string, color: Color): string {
  return `\x1b[${CODES[color]}m${text}${RESET}`
}

/**
 * Whether to emit ANSI colors for the given stream. Driven solely by the stream
 * being an interactive terminal (`isTTY`) — no env vars, no config. When output
 * is piped or redirected, colors are skipped so escape codes never end up in
 * files or logs.
 */
export function supportsColor(streamName: "stdout" | "stderr"): boolean {
  if (typeof process === "undefined") return false
  const stream = streamName === "stdout" ? process.stdout : process.stderr
  return Boolean(stream?.isTTY)
}
