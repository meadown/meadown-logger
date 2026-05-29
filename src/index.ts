/*
 * index.ts
 * Created by Dewan Mobashirul
 * Copyright (c) 2026 dewan-meadown
 * All rights reserved
 */

import { getFileName, getTimeStamp } from "./utils/index.js"
import { isLogAllowed } from "./config.js"

/** The logger: a callable for info logs, plus `.error` and `.warn` variants. */
export interface LogFN {
  (...args: unknown[]): void
  error(...args: unknown[]): void
  warn(...args: unknown[]): void
}

/**
 * Builds a log function bound to a console channel and tag. The returned closure
 * is what the caller invokes directly, so {@link getFileName} still resolves the
 * caller's own frame (no extra stack frame is inserted). `console[channel]` is
 * looked up at call time, so reassigning `console.log` (e.g. in tests) is
 * respected. Logs only outside production — see {@link isLogAllowed}.
 */
function createLog(
  channel: "log" | "error" | "warn",
  tag: string,
): (...args: unknown[]) => void {
  return (...args: unknown[]): void => {
    if (isLogAllowed())
      console[channel](tag, getTimeStamp(), `(${getFileName()})`, ...args)
  }
}

/**
 * Logs to the console, but only outside production. Each line is prefixed with
 * an `[INFO]` tag, an ISO timestamp, and the file and line it was called from;
 * all arguments are then printed as-is. `.error` and `.warn` behave the same
 * with their own tags and console channels.
 * @example
 * customLog("Auth", "user logged in")
 * // [INFO] 2026-05-30T10:00:00.000Z (server.ts:42) Auth user logged in
 */
const customLog: LogFN = Object.assign(createLog("log", "[INFO]"), {
  error: createLog("error", "[ERROR]"),
  warn: createLog("warn", "[WARN]"),
})

export default customLog
