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
  const args = calls[0]
  assert.equal(args[0], "[INFO]")
  // Forwards the user's arguments.
  assert.ok(args.includes("Auth"))
  assert.ok(args.includes("user logged in"))
})

test("customLog.error writes to console.error with an [ERROR] tag", () => {
  const calls = withEnv("development", () =>
    capture("error", () => customLog.error("request failed")),
  )
  assert.equal(calls.length, 1)
  assert.equal(calls[0][0], "[ERROR]")
  assert.ok(calls[0].includes("request failed"))
})

test("customLog.warn writes to console.warn with a [WARN] tag", () => {
  const calls = withEnv("development", () =>
    capture("warn", () => customLog.warn("deprecated call")),
  )
  assert.equal(calls.length, 1)
  assert.equal(calls[0][0], "[WARN]")
  assert.ok(calls[0].includes("deprecated call"))
})

test("every line includes a local AM/PM timestamp argument", () => {
  const calls = withEnv("development", () =>
    capture("log", () => customLog("hello")),
  )
  const stamp = calls[0][1]
  assert.match(stamp, /\b(?:AM|PM)\b/)
  assert.match(stamp, /\b(?:GMT|UTC|[A-Z]{2,5})/)
  assert.doesNotMatch(stamp, /^\d{4}-\d{2}-\d{2}T/)
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
  // The 3rd argument is the `(file:line)` location.
  const location = calls[0][2]
  assert.match(location, /logger\.test\.mjs:\d+/)
})

test("the location is a clickable OSC-8 link on a TTY", () => {
  const prev = process.stdout.isTTY
  process.stdout.isTTY = true // pretend stdout is an interactive terminal
  try {
    const calls = withEnv("development", () =>
      capture("log", () => customLog("link me")),
    )
    const location = calls[0][2]
    assert.ok(location.includes("\x1b]8;;"), "should contain an OSC-8 sequence")
    assert.ok(location.includes("file://"), "should contain a file:// URL")
    assert.match(location, /logger\.test\.mjs:\d+/)
  } finally {
    process.stdout.isTTY = prev
  }
})

test("the level tag is colored on a TTY, plain when not", () => {
  // Plain (test runner stdout is not a TTY): tag is exactly the level tag.
  const plain = withEnv("development", () =>
    capture("log", () => customLog("x")),
  )
  assert.equal(plain[0][0], "[INFO]")

  // On a TTY: only the tag is colored (info cyan, error red); the timestamp
  // and location stay plain.
  const prev = process.stdout.isTTY
  const prevErr = process.stderr.isTTY
  process.stdout.isTTY = true
  process.stderr.isTTY = true
  try {
    const info = withEnv("development", () => capture("log", () => customLog("x")))
    assert.equal(info[0][0], "\x1b[36m[INFO]\x1b[0m") // cyan tag
    assert.match(info[0][1], /\b(?:AM|PM)\b/) // plain timestamp
    assert.ok(info[0][2].startsWith("\x1b[90m"), "location should be gray") // gray location
    assert.ok(info[0][3].includes("\x1b[36m└──"), "connector should match tag color")

    const err = withEnv("development", () =>
      capture("error", () => customLog.error("x")),
    )
    assert.equal(err[0][0], "\x1b[31m[ERROR]\x1b[0m") // red tag
  } finally {
    process.stdout.isTTY = prev
    process.stderr.isTTY = prevErr
  }
})
