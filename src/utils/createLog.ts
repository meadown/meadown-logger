/*
 * createLog.ts
 * Created by Dewan Mobashirul
 * Copyright (c) 2026 dewan-meadown
 * All rights reserved
 */

import { formatWithOptions } from "node:util"

import getCaller, { type Caller } from "./getCaller.js"
import getTimeStamp from "./getTimeStamp.js"
import { fileUrl, hyperlink, supportsHyperlinks } from "./link.js"
import { colorize, supportsColor, type Color } from "./color.js"
import { isLogAllowed } from "../config.js"

/** The console channels the logger writes to. */
export type LogChannel = "log" | "error" | "warn"

/** The tag color for each channel: info → cyan, warn → yellow, error → red. */
const TAG_COLOR: Record<LogChannel, Color> = {
  log: "cyan",
  warn: "yellow",
  error: "red",
}

/** Visible width of the `└── ` branch; message lines left-align under it. */
const MESSAGE_INDENT = "   "

/** Max message lines to show before collapsing the rest; 0 (default) shows all. */
let visibleLines = 0

/** How many lines a long message shows before collapsing (0 = all). */
export function getVisibleLines(): number {
  return visibleLines
}

/** Set how many lines a long message shows before collapsing (0 = all). */
export function setVisibleLines(value: number): void {
  visibleLines = Number.isFinite(value) && value > 0 ? Math.floor(value) : 0
}

/**
 * Collapses a long multi-line message to {@link visibleLines} lines, replacing
 * the rest with a dimmed `… N more lines` summary. When `visibleLines` is 0
 * (the default) nothing is collapsed — the full message is shown.
 */
function collapse(text: string, useColor: boolean): string {
  if (visibleLines < 1) return text
  const lines = text.split("\n")
  if (lines.length <= visibleLines) return text
  const hidden = lines.length - visibleLines
  const summary = `${MESSAGE_INDENT}... ${hidden} more line${hidden === 1 ? "" : "s"}`
  const visible = lines.slice(0, visibleLines)
  visible.push(useColor ? colorize(summary, "gray") : summary)
  return visible.join("\n")
}

/**
 * Renders the args into a single message string exactly as console would —
 * objects/errors via util.inspect, `%s`/`%d` format specifiers, and colors when
 * on a terminal — then hang-indents every continuation line so multi-line
 * output (multi-line strings, pretty-printed objects, error stacks) all stays
 * left-aligned under the `└── ` branch, and collapses very long output.
 */
function renderMessage(args: unknown[], useColor: boolean): string {
  const text = formatWithOptions({ colors: useColor }, ...args)
  return collapse(text.replace(/\n/g, `\n${MESSAGE_INDENT}`), useColor)
}

/**
 * Renders a caller as a `(file:line)` location. When the terminal supports
 * OSC-8 hyperlinks, the location is a clickable link to the source file while
 * the line stays visible in the label; otherwise it's plain text. Pure (no
 * stack access), so it can be called from a helper without disturbing
 * {@link getCaller}'s frame depth.
 */
function formatLocation(
  caller: Caller,
  streamName: "stdout" | "stderr",
): string {
  if (
    caller.file !== null &&
    caller.line !== null &&
    supportsHyperlinks(streamName)
  )
    return hyperlink(caller.label, fileUrl(caller.file))
  return caller.label
}

/**
 * Builds a log function bound to a console channel and tag. The returned closure
 * is what the caller invokes directly, so {@link getCaller} still resolves the
 * caller's own frame (no extra stack frame is inserted). `console[channel]` is
 * looked up at call time, so reassigning `console.log` (e.g. in tests) is
 * respected. Logs only outside production — see {@link isLogAllowed}.
 */
export default function createLog(
  channel: LogChannel,
  tag: string,
): (...args: unknown[]) => void {
  const streamName = channel === "log" ? "stdout" : "stderr"
  return (...args: unknown[]): void => {
    if (!isLogAllowed()) return
    const caller = getCaller()
    const location = formatLocation(caller, streamName)

    // Colors (terminal only): tag by level, timestamp teal, location dim teal,
    // branch and separator gray.
    const useColor = supportsColor(streamName)
    const tagOut = useColor ? colorize(tag, TAG_COLOR[channel]) : tag
    const timeStamp = useColor
      ? colorize(getTimeStamp(), "teal")
      : getTimeStamp()
    const locOut = useColor
      ? colorize(`(${location})`, "dimTeal")
      : `(${location})`
    const connector = useColor ? colorize("├──", "gray") : "└──"
    const connectorBottom = useColor ? colorize("└──", "gray") : "└──"
    const separator = useColor ? colorize("-", "gray") : "-"

    // Layout: the tag, the message hanging off a `├──` branch, then the
    // timestamp and location on a `└──` branch below.
    const message = renderMessage(args, useColor)
    const meta = `\n${connectorBottom} ${timeStamp} ${separator} ${locOut}`

    // Leading `\n` puts a blank line above each entry — in the same call and on
    // the right stream (a separate `console.log` would always hit stdout).
    console[channel](`\n${tagOut}`, `\n${connector}`, message, meta)
  }
}
