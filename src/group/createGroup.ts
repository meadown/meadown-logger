/*
 * createGroup.ts
 * Created by Dewan Mobashirul
 * Copyright (c) 2026 meadown
 * All rights reserved
 */

import { isLogAllowed } from "../config.js"
import getCaller from "../caller/getCaller.js"
import { type LogChannel } from "../constants.js"
import { writeGroup } from "./writeGroup.js"

export type GroupType = "info" | "warn" | "error"

export interface GroupOptions {
  name: string
  type?: GroupType
  logs: unknown[]
}

/** Type of `logger.group` — use this to annotate variables or parameters that accept it. */
export interface Group {
  (opts: GroupOptions): void
}

/**
 * Builds `group` — renders multiple items as one log block under a shared name
 * and a single timestamp footer. Each item gets its own `├──` branch.
 *
 * The returned closure is what the caller invokes directly, so {@link getCaller}
 * resolves the caller's own frame. Silent in production.
 */
export default function createGroup(): Group {
  return ({ name, type = "info", logs }: GroupOptions): void => {
    if (!isLogAllowed()) return
    const caller = getCaller()
    const channel: LogChannel = type === "info" ? "log" : type
    writeGroup({ name, channel, logs, caller })
  }
}
