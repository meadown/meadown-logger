/*
 * createSpy.ts
 * Internal module — used by logger-tap to handle the function branch.
 * Not exposed on the public logger API.
 */

import { isLogAllowed } from "../../config/index.js"
import getCaller from "../../domain/caller/getCaller.js"
import { writeLog } from "../../domain/write/writeLog.js"
import { type Caller } from "../../domain/caller/getCaller.js"

/**
 * Internal: wraps `fn` using a caller already resolved by the caller's
 * parent (e.g. `tap`). Keeps the logged location pointing at the user's
 * file, not at this module.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function wrapFn<T extends (...args: any[]) => any>(
  fn: T,
  label: string | undefined,
  caller: Caller,
): T {
  return ((...args: Parameters<T>): ReturnType<T> => {
    writeLog({
      channel: "log",
      tag: "[TAP]",
      args: label === undefined ? [...args] : [label, ...args],
      caller,
    })
    return fn(...args) as ReturnType<T>
  }) as unknown as T
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function spy<T extends (...args: any[]) => any>(
  fn: T,
  label?: string,
): T {
  if (!isLogAllowed()) return fn
  return wrapFn(fn, label, getCaller())
}
