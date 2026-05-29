/*
 * index.ts
 * Created by Dewan Mobashirul
 * Copyright (c) 2026 dewan-meadown
 * All rights reserved
 */

import { createLog } from "./utils/index.js"

/** The logger: a callable for info logs, plus `.error` and `.warn` variants. */
export interface LogFN {
  (...args: unknown[]): void
  error(...args: unknown[]): void
  warn(...args: unknown[]): void
}

/**
 * Logs to the console, but only outside production. Each line is prefixed with
 * a level tag, a local AM/PM timestamp with timezone, and a clickable link to
 * the file it was called from; all arguments are then printed as-is.
 * @example
 * customLog("Auth", "user logged in")
 * // [INFO] 2026-05-30 04:00:00 PM GMT+6 (server.ts:42) Auth user logged in
 */
const customLog: LogFN = Object.assign(createLog("log", "[INFO]"), {
  error: createLog("error", "[ERROR]"),
  warn: createLog("warn", "[WARN]"),
})

export { customLog }
export default customLog
