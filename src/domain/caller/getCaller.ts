/*
 * getCaller.ts
 * Created by Dewan Mobashirul
 * Copyright (c) 2026 meadown
 * All rights reserved
 */

/** A resolved call site. `file`/`line` are `null` when they can't be determined. */
export interface Caller {
  /** Short display location, e.g. `server.ts:42`, or `"unknown"`. */
  label: string
  /** Absolute path (or `file://` URL) of the calling file, or `null`. */
  file: string | null
  /** 1-based line number, or `null`. */
  line: number | null
}

const UNKNOWN: Caller = { label: "unknown", file: null, line: null }

/** Matches a source file by extension: `.js/.jsx/.ts/.tsx` and `.cjs/.mjs/.cts/.mts`. */
const SOURCE_FILE = /\.[cm]?[jt]sx?$/

/**
 * Reads the call stack and returns the caller's location — both a short display
 * label (`file:line`) and the absolute path/line needed to build a clickable
 * link. Returns {@link UNKNOWN} when the frame isn't a resolvable source file
 * (e.g. minified, eval, or native code).
 */
export default function getCaller(): Caller {
  const stack = new Error().stack ?? ""
  const frame = stack.split("\n")[3] ?? ""

  // V8 frames look like `at fn (/path/file.js:10:5)` or `at /path/file.js:10:5`
  // (and `file://…` for ESM). Prefer the parenthesised location when present.
  const parens = frame.match(/\(([^)]+)\)\s*$/)
  const inner = (
    parens?.[1] ?? frame.replace(/^\s*at\s+(?:async\s+)?/, "")
  ).trim()

  // Split off the trailing `:line:column`, keeping the (possibly colon-bearing)
  // path intact (e.g. Windows `C:\…` or `file://…`).
  const match = inner.match(/^(.*):(\d+):\d+$/)
  if (match === null) return UNKNOWN
  const file = match[1] ?? ""
  const line = Number(match[2])
  const base = file.split(/[/\\]/).pop() ?? ""
  if (!SOURCE_FILE.test(base)) return UNKNOWN

  return { label: `${base}:${line}`, file, line }
}
