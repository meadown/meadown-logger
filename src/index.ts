/*
 * index.ts
 * Created by Dewan Mobashirul
 * Copyright (c) 2026 dewan-meadown
 * All rights reserved
 */

import { createLog, getVisibleLines, setVisibleLines } from "./utils/index.js"

/** The logger: a callable for info logs, plus `.error` and `.warn` variants. */
export interface LogFN {
  (...args: unknown[]): void
  error(...args: unknown[]): void
  warn(...args: unknown[]): void
  /**
   * How many lines of a multi-line message to show before collapsing the rest
   * into a `… N more lines` summary. `0` (the default) shows everything.
   */
  maxLines: number
}

/**
 * Logs to the console, but only outside production. Each line is prefixed with
 * a level tag, a short local timestamp, and a clickable link to the file it was
 * called from; all arguments are then printed as-is.
 * @example
 * logger("Auth", "user logged in")
 * // [INFO] 05-30 04:00:00 PM (server.ts:42) Auth user logged in
 * @example
 * logger.maxLines = 5 // long messages collapse to 5 lines; 0 = show all
 */
const logger = Object.assign(createLog("log", "[INFO]"), {
  error: createLog("error", "[ERROR]"),
  warn: createLog("warn", "[WARN]"),
}) as LogFN

// `maxLines` is a live getter/setter backed by the shared collapse setting, so
// setting it once affects info, error, and warn alike.
Object.defineProperty(logger, "maxLines", {
  get: getVisibleLines,
  set: setVisibleLines,
  enumerable: true,
  configurable: true,
})

const customLog = logger

export { customLog, logger }
export default logger
