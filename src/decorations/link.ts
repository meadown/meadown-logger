/*
 * link.ts
 * Created by Dewan Mobashirul
 * Copyright (c) 2026 dewan-meadown
 * All rights reserved
 */

import { pathToFileURL } from "node:url"

/**
 * Builds a `file://` URL for a path so terminals can open it on click.
 * When `line` is provided, appends `:line` so supporting terminals (VS Code,
 * iTerm2, WezTerm) jump straight to that line.
 */
export function fileUrl(file: string, line?: number): string {
  const base = file.startsWith("file://") ? file : pathToFileURL(file).href
  return line != null ? `${base}:${line}` : base
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
