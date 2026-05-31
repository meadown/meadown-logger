/*
 * writeLog.ts
 * Created by Dewan Mobashirul
 * Copyright (c) 2026 dewan-meadown
 * All rights reserved
 */

import { formatWithOptions } from "node:util"

import {
  type LogChannel,
  TAG_COLOR,
  BRANCH,
  BRANCH_END,
  SEPARATOR,
  MESSAGE_INDENT,
  DEFAULT_MAX_LINES,
} from "../constants.js"
import { type Caller } from "../caller/getCaller.js"
import getTimeStamp from "../time/getTimeStamp.js"
import { fileUrl, hyperlink } from "../decorations/link.js"
import { colorize, type Color } from "../colors/color.js"
import { isTTY } from "../terminal/isTTY.js"

/** Max message lines to show before collapsing the rest; 0 (default) shows all. */
let visibleLines = DEFAULT_MAX_LINES

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
 * output stays left-aligned under the branch, and collapses very long output.
 */
function renderMessage(args: unknown[], useColor: boolean): string {
  const text = formatWithOptions({ colors: useColor }, ...args)
  return collapse(
    text.replace(/\n/g, `\n${colorize(MESSAGE_INDENT, "gray")}`),
    useColor,
  )
}

/**
 * Renders a caller as a `(file:line)` location — a clickable OSC-8 link on a
 * supporting terminal, plain text otherwise. Pure (no stack access).
 */
function formatLocation(caller: Caller, interactive: boolean): string {
  if (caller.file !== null && caller.line !== null && interactive)
    return hyperlink(caller.label, fileUrl(caller.file))
  return caller.label
}

/**
 * Renders and writes one log entry. The `caller` is resolved by the *caller* of
 * this function (the log closure or `tap`) and passed in, so this helper never
 * touches the stack — keeping {@link getCaller}'s frame depth correct no matter
 * which user-facing function delegates here.
 */
export function writeLog(opts: {
  channel: LogChannel
  tag: string
  args: unknown[]
  caller: Caller
}): void {
  const { channel, tag, args, caller } = opts
  const streamName = channel === "log" ? "stdout" : "stderr"

  // One terminal check drives both color and clickable links — `isTTY` is the
  // single source of truth (DRY). Off when output is piped/redirected.
  const useColor = isTTY(streamName)
  const paint = (s: string, c: Color): string =>
    useColor ? colorize(s, c) : s
  const location = formatLocation(caller, useColor)

  const tagOut = paint(tag, TAG_COLOR[channel])
  const timeStamp = paint(getTimeStamp(), "teal")
  const locOut = paint(`(${location})`, "dimTeal")
  const connector = paint(BRANCH, "gray")
  const connectorBottom = paint(BRANCH_END, "gray")
  const separator = paint(SEPARATOR, "gray")

  // Layout: the tag, the message hanging off a `├──` branch, then the timestamp
  // and location on a `└──` branch below. Leading `\n` spaces entries apart.
  const message = renderMessage(args, useColor)
  const meta = `\n${connectorBottom} ${timeStamp} ${separator} ${locOut}`
  console[channel](`\n${tagOut}`, `\n${connector}`, message, meta)
}
