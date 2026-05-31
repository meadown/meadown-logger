/*
 * createTap.ts
 * Created by Dewan Mobashirul
 * Copyright (c) 2026 meadown
 * All rights reserved
 */

import { isLogAllowed } from "../config.js"
import getCaller from "../caller/getCaller.js"
import { writeLog } from "../core/writeLog/index.js"
import { isThenable, tapAsync } from "./tapAsync/index.js"

/** Logs a value and returns it unchanged. Promises route to the timed path. */
export interface Tap {
  <T>(value: T, label?: string): T
}

/**
 * Builds `tap` — logs a value and returns it **unchanged**, so it drops into any
 * expression (`const u = logger.tap(getUser(), "user")`). The consumer always
 * gets back exactly what they passed; the only effect is a clean log.
 *
 * - A plain value is logged synchronously and returned.
 * - A **promise** is returned as-is (same object, never awaited or wrapped), and
 *   its elapsed time — plus the HTTP status if it resolves to a `Response` — is
 *   logged in the background (fire-and-forget, non-blocking).
 *
 * The returned closure is what the caller invokes directly, so {@link getCaller}
 * resolves the caller's own frame. Silent in production; the value still flows.
 */
export default function createTap(): Tap {
  const tap = (value: unknown, label?: string): unknown => {
    if (!isLogAllowed()) return value
    const caller = getCaller()
    if (isThenable(value)) {
      // value is a promise → hand off to the async tap (caller passed in so the
      // location stays on the user's file, not on this helper).
      tapAsync(value, label, caller)
    } else {
      writeLog({
        channel: "log",
        tag: "[TAP]",
        args: label === undefined ? [value] : [label, value],
        caller,
      })
    }
    return value
  }
  return tap as Tap
}
