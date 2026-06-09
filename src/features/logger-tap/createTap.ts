/*
 * createTap.ts
 * Created by Dewan Mobashirul
 * Copyright (c) 2026 meadown
 * All rights reserved
 */

import { wrapFn } from "../logger-spy/index.js"
import { isLogAllowed } from "../../config/index.js"
import getCaller from "../../domain/caller/getCaller.js"
import { writeLog } from "../../domain/write/writeLog.js"
import { isThenable, tapAsync } from "./tapAsync/index.js"

/**
 * Type of `logger.tap` — use this to annotate variables or parameters that
 * accept it.
 */
export interface Tap {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  <T extends (...args: any[]) => any>(fn: T, label?: string): T
  <T>(promise: Promise<T>, label?: string): Promise<T>
  <T>(value: T, label?: string): T
}

/** Detects an EventEmitter-like object — the most common tap misuse pattern. */
function isEventEmitter(value: unknown): boolean {
  if (value === null || typeof value !== "object") return false
  const v = value as Record<string, unknown>
  return (
    typeof v["on"] === "function" &&
    typeof v["emit"] === "function" &&
    typeof v["removeListener"] === "function"
  )
}

export default function tap<T>(value: T, label?: string): T {
  if (!isLogAllowed()) return value
  const caller = getCaller()

  if (isEventEmitter(value)) {
    writeLog({
      channel: "warn",
      tag: "[WARN]",
      args: [
        "logger.tap received an EventEmitter — this logs the emitter object, not the event args.",
        "To log what an event fires, wrap the callback instead:",
        '  emitter.on("event", logger.tap(handler, label))',
      ],
      caller,
    })
    return value
  }

  if (typeof value === "function") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return wrapFn(value as (...args: any[]) => any, label, caller) as T
  }

  if (isThenable(value)) {
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
