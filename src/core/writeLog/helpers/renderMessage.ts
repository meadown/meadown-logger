/*
 * renderMessage.ts
 * Created by Dewan Mobashirul
 * Copyright (c) 2026 dewan-meadown
 * All rights reserved
 */

import { formatWithOptions } from "node:util"

import { visibleLines } from "./visibleLines.js"
import { colorize } from "../../../colors/color.js"
import { MESSAGE_INDENT } from "../../../constants.js"

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
export function renderMessage(args: unknown[], useColor: boolean): string {
  const text = formatWithOptions({ colors: useColor }, ...args)
  const indent = useColor ? colorize(MESSAGE_INDENT, "gray") : MESSAGE_INDENT
  return collapse(
    text.replace(/\n/g, `\n${indent}`),
    useColor,
  )
}
