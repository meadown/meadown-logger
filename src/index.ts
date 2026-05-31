/*
 * index.ts
 * Created by Dewan Mobashirul
 * Copyright (c) 2026 dewan-meadown
 * All rights reserved
 */

import createLog from "./core/createLog.js"
import createTap from "./tap/createTap.js"
import { getVisibleLines, setVisibleLines } from "./core/writeLog/index.js"

/** The logger: a callable for info logs, plus `.error`, `.warn`, and `.tap`. */
export interface LogFN {
  (...args: unknown[]): void
  error(...args: unknown[]): void
  warn(...args: unknown[]): void
  /**
   * Logs `value` (optionally tagged with `label`) and returns it **unchanged**,
   * so it drops into any expression: `const u = logger.tap(getUser(), "user")`.
   * Pass a **promise** (e.g. a `fetch`) and you get the same promise back while
   * its elapsed time — and the HTTP status if it's a `Response` — is logged in
   * the background. Silent in production; the value always flows through.
   */
  tap<T>(value: T, label?: string): T
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
  tap: createTap(),
}) as LogFN

// `maxLines` is a live getter/setter backed by the shared collapse setting, so
// setting it once affects info, error, and warn alike.
Object.defineProperty(logger, "maxLines", {
  get: getVisibleLines,
  set: setVisibleLines,
  enumerable: true,
  configurable: true,
})

export { logger }
export default logger
