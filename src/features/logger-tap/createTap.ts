/*
 * createTap.ts
 * Created by Dewan Mobashirul
 * Copyright (c) 2026 meadown
 * All rights reserved
 */

import { isLogAllowed } from "../../config/index.js"
import getCaller from "../../domain/caller/getCaller.js"
import { writeLog } from "../../domain/write/writeLog.js"
import { isThenable, tapAsync } from "./tapAsync/index.js"

/** Type of `logger.tap` — use this to annotate variables or parameters that accept it. */
export interface Tap {
  <T>(value: T, label?: string): T
}

export default function tap<T>(value: T, label?: string): T {
  if (!isLogAllowed()) return value
  const caller = getCaller()
  if (isThenable(value)) {
    tapAsync(value, label, caller)
  } else {
    writeLog({
      channel: "log",
      tag: "[TAP]",
      args: label === undefined ? [value] : [label, value],
      caller,
    })
  }
  return value
}
