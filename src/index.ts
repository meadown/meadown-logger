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
   * Logs `value` and returns it unchanged — drop it into any expression
   * without adding an extra variable or line.
   *
   * Tap detects what you pass and handles it accordingly:
   *
   * **Sync value** — logged immediately, returned as-is:
   * ```ts
   * const port = logger.tap(3000, "port")
   * const user = logger.tap(getUser(), "user")
   * ```
   *
   * **Promise** — returned immediately; once it settles, timing and the
   * resolved value are logged in the background. Void promises log elapsed
   * time only:
   * ```ts
   * const res  = await logger.tap(fetch(url), "GET /users")  // status + ms
   * const data = await logger.tap(loadConfig(), "config")    // value + ms
   * await logger.tap(client.set(key, val), "SET")            // ms only
   * ```
   *
   * **Function** — returns a wrapper with the same signature. Every time it
   * is called, its arguments are logged, then the original runs and its
   * return value is passed through:
   * ```ts
   * client.on("error", logger.tap((err) => {
   *   this.isConnected = false
   * }, "Redis error:"))
   *
   * const adults = users.filter(logger.tap((u) => u.age >= 18, "filter"))
   * ```
   *
   * **Invalid — EventEmitter** — passing the return value of `.on()` is a
   * common mistake. `.on()` returns the emitter itself, not the callback.
   * Tap detects this and logs a warning pointing you to the correct usage:
   * ```ts
   * // ✗ taps the emitter — logs a [WARN] and returns the emitter unchanged
   * logger.tap(emitter.on("error", handler), "error")
   *
   * // ✓ taps the callback — wrap the function, not the .on() call
   * emitter.on("error", logger.tap(handler, "error"))
   * ```
   *
   * @param value  Any value, promise, or function — returned as-is.
   * @param label  Optional label shown before the value in the log line.
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
