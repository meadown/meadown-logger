/*
 * writeLog.ts
 * Created by Dewan Mobashirul
 * Copyright (c) 2026 meadown
 * All rights reserved
 */

import { type LogChannel, TAG_COLOR } from "../../constants.js"
import { type Caller } from "../../caller/getCaller.js"
import { renderMessage, buildContext } from "./helpers/index.js"

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
  const {
    useColor,
    paint,
    timeStamp,
    locOut,
    connector,
    connectorEnd,
    separator,
  } = buildContext(channel, caller)

  const tagOut = paint(tag, TAG_COLOR[channel])
  const message = renderMessage(args, useColor)
  const meta = `\n${connectorEnd} ${timeStamp} ${separator} ${locOut}`
  console[channel](`\n${tagOut} \n${connector} ${message}${meta}`)
}
