/*
 * createLog.ts
 * Created by Dewan Mobashirul
 * Copyright (c) 2026 dewan-meadown
 * All rights reserved
 */

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

    // On a real terminal: color the level tag and the `└──` connector (same
    // color), and dim the location to gray. The timestamp stays plain.
    const useColor = supportsColor(streamName)
    const color = TAG_COLOR[channel]
    const tagOut = useColor ? colorize(tag, color) : tag
    const locOut = useColor ? colorize(`(${location})`, "gray") : `(${location})`
    const connector = useColor ? colorize("└──", color) : "└──"

    // `\n` + connector puts the message on its own line under a tree branch;
    // console's separator space sits between the connector and the message.
    console[channel](tagOut, getTimeStamp(), locOut, `\n${connector}`, ...args, `\n`)
  }
}
