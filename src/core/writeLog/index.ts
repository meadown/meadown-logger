/*
 * index.ts
 * Created by Dewan Mobashirul
 * Copyright (c) 2026 dewan-meadown
 * All rights reserved
 */

import {
  type LogChannel,
  TAG_COLOR,
  BRANCH,
  BRANCH_END,
  SEPARATOR,
} from "../../constants.js"
import { type Caller } from "../../caller/getCaller.js"
import getTimeStamp from "../../time/getTimeStamp.js"
import { colorize, type Color } from "../../colors/color.js"
import { isTTY } from "../../terminal/isTTY.js"
import { renderMessage } from "./renderMessage.js"
import { formatLocation } from "./formatLocation.js"

export { getVisibleLines, setVisibleLines } from "./visibleLines.js"

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
