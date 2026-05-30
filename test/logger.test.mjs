/*
 * logger.test.mjs
 * Tests for the customLog logger and its env-based gating.
 */

import test from "node:test"
import assert from "node:assert/strict"

import customLog from "../dist/index.js"
import { isLogAllowed } from "../dist/config.js"
import { withEnv, capture } from "./helpers.mjs"

test("isLogAllowed is true outside production", () => {
  withEnv("development", () => assert.equal(isLogAllowed(), true))
  withEnv("test", () => assert.equal(isLogAllowed(), true))
  withEnv(undefined, () => assert.equal(isLogAllowed(), true))
})

test("isLogAllowed is false in production", () => {
  withEnv("production", () => assert.equal(isLogAllowed(), false))
})

test("customLog exposes a callable plus .error and .warn", () => {
  assert.equal(typeof customLog, "function")
  assert.equal(typeof customLog.error, "function")
  assert.equal(typeof customLog.warn, "function")
})

test("customLog writes to console.log with an [INFO] tag in development", () => {
  const calls = withEnv("development", () =>
    capture("log", () => customLog("Auth", "user logged in")),
  )
  assert.equal(calls.length, 1)
  // Assert on the whole rendered line so the layout can change freely.
  const line = calls[0].join(" ")
  assert.ok(line.includes("[INFO]"))
  assert.ok(line.includes("Auth"))
  assert.ok(line.includes("user logged in"))
})

test("customLog.error writes to console.error with an [ERROR] tag", () => {
  const calls = withEnv("development", () =>
    capture("error", () => customLog.error("request failed")),
  )
  assert.equal(calls.length, 1)
  const line = calls[0].join(" ")
  assert.ok(line.includes("[ERROR]"))
  assert.ok(line.includes("request failed"))
})

test("customLog.warn writes to console.warn with a [WARN] tag", () => {
  const calls = withEnv("development", () =>
    capture("warn", () => customLog.warn("deprecated call")),
  )
  assert.equal(calls.length, 1)
  const line = calls[0].join(" ")
  assert.ok(line.includes("[WARN]"))
  assert.ok(line.includes("deprecated call"))
})

test("every line includes a short MM-DD 12-hour timestamp", () => {
  const calls = withEnv("development", () =>
    capture("log", () => customLog("hello")),
  )
  const line = calls[0].join(" ")
  assert.match(line, /\d{2}-\d{2} \d{2}:\d{2}:\d{2} (?:AM|PM)/)
})

test("nothing is logged in production", () => {
  const logs = withEnv("production", () => capture("log", () => customLog("x")))
  const errors = withEnv("production", () =>
    capture("error", () => customLog.error("x")),
  )
  const warns = withEnv("production", () =>
    capture("warn", () => customLog.warn("x")),
  )
  assert.equal(logs.length, 0)
  assert.equal(errors.length, 0)
  assert.equal(warns.length, 0)
})

test("the console method is resolved at call time (reassignment is honored)", () => {
  // Guards against capturing console.log by value at import time, which would
  // bypass any later reassignment (e.g. test spies or log interceptors).
  const original = console.log
  const seen = []
  console.log = (...args) => seen.push(args)
  try {
    withEnv("development", () => customLog("late-bound"))
  } finally {
    console.log = original
  }
  assert.equal(seen.length, 1)
  assert.ok(seen[0].includes("late-bound"))
})

test("the caller location points back at the calling file", () => {
  const calls = withEnv("development", () =>
    capture("log", () => customLog("where am I")),
  )
  const line = calls[0].join(" ")
  assert.match(line, /logger\.test\.mjs:\d+/)
})

test("by default (maxLines = 0) a long message is shown in full", () => {
  const long = Array.from({ length: 20 }, (_, i) => `line ${i + 1}`).join("\n")
  const line = withEnv("development", () =>
    capture("log", () => customLog(long)),
  )[0].join(" ")
  assert.ok(line.includes("line 1") && line.includes("line 20"), "shows all lines")
  assert.doesNotMatch(line, /more lines/, "does not collapse")
})

test("setting customLog.maxLines collapses long messages", () => {
  const long = Array.from({ length: 20 }, (_, i) => `line ${i + 1}`).join("\n")
  const prev = customLog.maxLines
  customLog.maxLines = 3
  try {
    const line = withEnv("development", () =>
      capture("log", () => customLog(long)),
    )[0].join(" ")
    assert.ok(line.includes("line 1"), "keeps the first lines")
    assert.match(line, /\.\.\. 17 more lines/, "summarizes the rest")
    assert.ok(!line.includes("line 20"), "drops the tail")
  } finally {
    customLog.maxLines = prev
  }
})

test("maxLines is shared across info, error, and warn", () => {
  customLog.maxLines = 4
  try {
    assert.equal(customLog.maxLines, 4)
    // A negative/invalid value resets to 0 (show all).
    customLog.maxLines = -1
    assert.equal(customLog.maxLines, 0)
  } finally {
    customLog.maxLines = 0
  }
})

test("the location is a clickable OSC-8 link on a TTY", () => {
  const prev = process.stdout.isTTY
  process.stdout.isTTY = true // pretend stdout is an interactive terminal
  try {
    const calls = withEnv("development", () =>
      capture("log", () => customLog("link me")),
    )
    const line = calls[0].join(" ")
    assert.ok(line.includes("\x1b]8;;"), "should contain an OSC-8 sequence")
    assert.ok(line.includes("file://"), "should contain a file:// URL")
    assert.match(line, /logger\.test\.mjs:\d+/)
  } finally {
    process.stdout.isTTY = prev
  }
})

test("the level tag is colored on a TTY, plain when not", () => {
  // Not a TTY (test runner): no ANSI escape codes at all.
  const plain = withEnv("development", () =>
    capture("log", () => customLog("x")),
  )
  const plainLine = plain[0].join(" ")
  assert.ok(plainLine.includes("[INFO]"))
  assert.ok(!plainLine.includes("\x1b["), "no color codes when not a TTY")

  // On a TTY: the level tag is wrapped in its color (info cyan, error red).
  const prev = process.stdout.isTTY
  const prevErr = process.stderr.isTTY
  process.stdout.isTTY = true
  process.stderr.isTTY = true
  try {
    const infoLine = withEnv("development", () =>
      capture("log", () => customLog("x")),
    )[0].join(" ")
    assert.ok(infoLine.includes("\x1b[36m[INFO]\x1b[0m"), "info tag should be cyan")

    const errLine = withEnv("development", () =>
      capture("error", () => customLog.error("x")),
    )[0].join(" ")
    assert.ok(errLine.includes("\x1b[31m[ERROR]\x1b[0m"), "error tag should be red")
  } finally {
    process.stdout.isTTY = prev
    process.stderr.isTTY = prevErr
  }
})
