/*
 * buildContext.ts
 * Created by Dewan Mobashirul
 * Copyright (c) 2026 meadown
 * All rights reserved
 */

import {
  type LogChannel,
  BRANCH,
  BRANCH_END,
  SEPARATOR,
} from "../../../constants.js"
import { type Caller } from "../../../caller/getCaller.js"
import { colorize, type Color } from "../../../colors/color.js"
import { isTTY } from "../../../terminal/isTTY.js"
import getTimeStamp from "../../../time/getTimeStamp.js"
import { formatLocation } from "./formatLocation.js"

export interface RenderContext {
  useColor: boolean
  paint: (s: string, c: Color) => string
  timeStamp: string
  locOut: string
  connector: string
  connectorEnd: string
  separator: string
}

/** Builds the shared paint/layout values used by both writeLog and writeGroup. */
export function buildContext(
  channel: LogChannel,
  caller: Caller,
): RenderContext {
  const streamName = channel === "log" ? "stdout" : "stderr"
  const useColor = isTTY(streamName)
  const paint = (s: string, c: Color): string => (useColor ? colorize(s, c) : s)
  const location = formatLocation(caller, useColor)

  return {
    useColor,
    paint,
    timeStamp: paint(getTimeStamp(), "teal"),
    locOut: paint(`(${location})`, "dimTeal"),
    connector: paint(BRANCH, "gray"),
    connectorEnd: paint(BRANCH_END, "gray"),
    separator: paint(SEPARATOR, "gray"),
  }
}
