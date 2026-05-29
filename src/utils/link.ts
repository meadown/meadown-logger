/*
 * link.ts
 * Created by Dewan Mobashirul
 * Copyright (c) 2026 dewan-meadown
 * All rights reserved
 */

import { pathToFileURL } from "node:url"

/**
 * Builds a `file://` URL with a trailing `:line` so terminals can jump to the
 * exact line. Paths already in `file://` form are used as-is.
 */
export function fileUrl(file: string, line: number): string {
  const base = file.startsWith("file://") ? file : pathToFileURL(file).href
  return `${base}:${line}`
}

/**
 * Wraps `text` in an OSC-8 terminal hyperlink pointing at `url`. Terminals that
 * support OSC-8 render `text` as a clickable link; others simply show `text`.
 */
export function hyperlink(text: string, url: string): string {
  const OSC = "\x1b]8;;"
  const BEL = "\x07"
  return `${OSC}${url}${BEL}${text}${OSC}${BEL}`
}

/**
 * Conservative detection of OSC-8 hyperlink support for the given stream.
 * Honors `FORCE_HYPERLINK` (set to a falsy value to force off), requires a TTY,
 * and otherwise allow-lists terminals known to support hyperlinks. Unknown
 * terminals get plain text so output is never garbled.
 */
export function supportsHyperlinks(streamName: "stdout" | "stderr"): boolean {
  if (typeof process === "undefined") return false
  const env = process.env

  const force = env.FORCE_HYPERLINK
  if (force !== undefined && force !== "")
    return force !== "0" && force.toLowerCase() !== "false"

  const stream = streamName === "stdout" ? process.stdout : process.stderr
  if (!stream || !stream.isTTY) return false
  if (env.TERM === "dumb") return false
  if (env.CI !== undefined && env.CI !== "") return false

  const program = env.TERM_PROGRAM
  if (
    program === "vscode" ||
    program === "iTerm.app" ||
    program === "Hyper" ||
    program === "WezTerm"
  )
    return true
  if (env.WT_SESSION) return true // Windows Terminal
  if (env.KITTY_WINDOW_ID) return true
  if (env.VTE_VERSION !== undefined && Number(env.VTE_VERSION) >= 5000)
    return true // GNOME, etc.

  return false
}
