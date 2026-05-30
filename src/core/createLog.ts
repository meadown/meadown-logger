/*
 * createLog.ts
 * Created by Dewan Mobashirul
 * Copyright (c) 2026 dewan-meadown
 * All rights reserved
 */

import getCaller from "../caller/getCaller.js"
import { writeLog } from "./writeLog.js"
import { type LogChannel } from "../constants.js"
import { isLogAllowed } from "../config.js"

/**
 * Builds a log function bound to a console channel and tag. The returned closure
 * is what the caller invokes directly, so {@link getCaller} resolves the caller's
 * own frame; the resolved caller is then handed to {@link writeLog}, which never
 * touches the stack. Logs only outside production — see {@link isLogAllowed}.
 */
export default function createLog(
  channel: LogChannel,
  tag: string,
): (...args: unknown[]) => void {
  return (...args: unknown[]): void => {
    if (!isLogAllowed()) return
    const caller = getCaller()
    writeLog({ channel, tag, args, caller })
  }
}
