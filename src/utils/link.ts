/*
 * link.ts
 * Created by Dewan Mobashirul
 * Copyright (c) 2026 dewan-meadown
 * All rights reserved
 */

import { pathToFileURL } from "node:url"

/**
 * Builds a valid `file://` URL for a path so terminals can open it on click.
 * Paths already in `file://` form are used as-is. We intentionally do NOT append
 * `:line` — that isn't a valid URI and breaks file openers (e.g. GNOME/`gio`,
 * which would look for a file literally named `foo.ts:42`). The line number
 * stays visible in the link's display text instead.
 */
export function fileUrl(file: string): string {
  return file.startsWith("file://") ? file : pathToFileURL(file).href
}

/**
 * Wraps `text` in an OSC-8 terminal hyperlink pointing at `url`. Terminals that
 * support OSC-8 render `text` as a clickable link; others ignore the escape and
 * simply show `text`.
 */
export function hyperlink(text: string, url: string): string {
  const OSC = "\x1b]8;;"
  const BEL = "\x07"
  return `${OSC}${url}${BEL}${text}${OSC}${BEL}`
}

/**
 * Whether to emit OSC-8 hyperlinks for the given stream. Driven solely by the
 * stream being an interactive terminal (`isTTY`) — no env vars, no config. When
 * output is piped or redirected, links are skipped so escapes never end up in
 * files or logs. Terminals that don't understand OSC-8 just show the plain text.
 */
export function supportsHyperlinks(streamName: "stdout" | "stderr"): boolean {
  if (typeof process === "undefined") return false
  const stream = streamName === "stdout" ? process.stdout : process.stderr
  return Boolean(stream?.isTTY)
}
