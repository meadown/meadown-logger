/*
 * index.ts
 * Created by Dewan Mobashirul
 * Copyright (c) 2026 meadown
 * All rights reserved
 */

import { isLogAllowed } from "../../config/index.js"
import getCaller from "../../domain/caller/getCaller.js"
import { writeLog } from "../../domain/write/writeLog.js"

export default function logError(...args: unknown[]): void {
  if (!isLogAllowed()) return
  const caller = getCaller()
  writeLog({ channel: "error", tag: "[ERROR]", args, caller })
}
