/*
 * createGroup.ts
 * Created by Dewan Mobashirul
 * Copyright (c) 2026 meadown
 * All rights reserved
 */

import { isLogAllowed } from "../../config/index.js"
import getCaller from "../../domain/caller/getCaller.js"
import { type LogChannel } from "../../types/index.js"
import { writeGroup } from "./writeGroup.js"

export interface GroupOptions {
  name: string
  type?: LogChannel
  logs: unknown[]
}

/** Type of `logger.group` — use this to annotate variables or parameters that accept it. */
export interface Group {
  (opts: GroupOptions): void
}

export default function group({
  name,
  type = "log",
  logs,
}: GroupOptions): void {
  if (!isLogAllowed()) return
  const caller = getCaller()
  writeGroup({ name, channel: type, logs, caller })
}
