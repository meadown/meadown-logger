/*
 * writeGroup.ts
 * Created by Dewan Mobashirul
 * Copyright (c) 2026 meadown
 * All rights reserved
 */

import { type LogChannel, TAG_COLOR } from "../constants.js"
import { type Caller } from "../caller/getCaller.js"
import { renderMessage, buildContext } from "../core/writeLog/helpers/index.js"

export function writeGroup(opts: {
  name: string
  channel: LogChannel
  logs: unknown[]
  caller: Caller
}): void {
  const { name, channel, logs, caller } = opts
  const {
    useColor,
    paint,
    timeStamp,
    locOut,
    connector,
    connectorEnd,
    separator,
  } = buildContext(channel, caller)

  const tagOut = paint(`[${name.toUpperCase()}]`, TAG_COLOR[channel])
  const itemLines = logs
    .map((item) => `\n${connector} ${renderMessage([item], useColor)}`)
    .join("")

  const meta = `\n${connectorEnd} ${timeStamp} ${separator} ${locOut}`
  console[channel](`\n${tagOut} ${itemLines}${meta}`)
}
