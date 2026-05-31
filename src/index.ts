/*
 * index.ts
 * Created by Dewan Mobashirul
 * Copyright (c) 2026 meadown
 * All rights reserved
 */

import {
  getVisibleLines,
  setVisibleLines,
} from "./features/logger-max-lines/index.js"
import logInfo from "./features/logger/index.js"
import logWarn from "./features/logger-warn/index.js"
import logError from "./features/logger-error/index.js"
import tap, { type Tap } from "./features/logger-tap/index.js"
import group, { type Group } from "./features/logger-group/index.js"

/** Type of the logger — use this to annotate variables or parameters that accept it. */
export interface Logger {
  /** Log at info level — `stdout`, cyan `[INFO]` tag. */
  (...args: unknown[]): void
  /** Log at error level — `stderr`, red `[ERROR]` tag. */
  error(...args: unknown[]): void
  /** Log at warn level — `stderr`, yellow `[WARN]` tag. */
  warn(...args: unknown[]): void
  /**
   * Logs `value` with an optional `label` and gives it straight back unchanged
   * — so you can drop it into any expression without adding an extra line.
   *
   * **Sync value** — logged immediately, returned as-is:
   * ```ts
   * const port = logger.tap(3000, "port")       // logs it, port is still 3000
   * const user = logger.tap(getUser(), "user")  // logs the user object, returns it
   * ```
   *
   * **Promise** — the same promise comes back; timing and HTTP status are logged
   * in the background once it settles, without blocking your code:
   * ```ts
   * const res  = await logger.tap(fetch(url), "GET /users")  // logs status + ms
   * const data = await logger.tap(loadConfig(), "config")    // logs value + ms
   * ```
   *
   * @param value  Any value or promise — always returned as-is.
   * @param label  Optional label shown next to the value in the log line.
   */
  tap: Tap
  /**
   * Log multiple related items as one block under a shared name and single
   * timestamp. Each item in `logs` renders on its own `├──` branch — any value
   * is accepted (string, object, function, Promise, …).
   *
   * `type` sets the channel and tag color: `"info"` (default), `"warn"`, `"error"`.
   *
   * @example
   * ```ts
   * logger.group({ name: "Server setup", logs: [`port: ${port}`, `env: ${env}`] })
   * logger.group({ name: "Validation failed", type: "error", logs: ["email invalid"] })
   * ```
   */
  group: Group
  /**
   * How many lines to show before the rest collapses into a
   * `… N more lines` summary. `0` (default) shows everything.
   *
   * @example
   * logger.maxLines = 5
   */
  maxLines: number
}

/**
 * A logger built for development — colored tags, a local timestamp, and a
 * clickable `(file:line)` link on every line so you always know where a
 * message came from. Works like `console.log`: pass anything and it prints.
 *
 * Logs only when `NODE_ENV !== "production"`.
 *
 * @example
 * ```ts
 * logger("server started", { port: 3000 })
 * logger.error("db failed", new Error("ECONNREFUSED"))
 * logger.warn("disk above 80%")
 * ```
 *
 * @example Tap — keep the value flowing, log it on the side
 * ```ts
 * const user = logger.tap(await getUser(id), "user")
 * const res  = await logger.tap(fetch(url), "GET /users")
 * ```
 */
const logger = Object.assign(logInfo, {
  error: logError,
  warn: logWarn,
  tap,
  group,
}) as Logger

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
