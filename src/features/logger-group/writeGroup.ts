/*
 * writeGroup.ts
 * Created by Dewan Mobashirul
 * Copyright (c) 2026 meadown
 * All rights reserved
 */

import {
  renderMessage,
  buildContext,
  TAG_COLOR,
} from "../../domain/write/helpers/index.js"
import { type LogChannel } from "../../types/index.js"
import { type Caller } from "../../domain/caller/getCaller.js"

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
