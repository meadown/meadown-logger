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
