/*
 * spy.test.mjs
 * Tests for the function branch of logger.tap — wraps a function and logs
 * its arguments on each call. spy is an internal module; these tests go
 * through logger.tap, which is the user-facing entry point.
 */

import test from "node:test"
import assert from "node:assert/strict"
import { EventEmitter } from "node:events"

import logger from "../dist/index.js"
import { withEnv, capture } from "./helpers.mjs"

test("tap wraps a function and returns one with the same shape", () => {
  withEnv("development", () =>
    capture("log", () => {
      const wrapped = logger.tap((x, y) => x + y, "add")
      assert.equal(typeof wrapped, "function")
      assert.equal(wrapped(2, 3), 5)
    }),
  )
})

test("tap on a function logs args with [TAP] tag and label when called", () => {
  const calls = withEnv("development", () =>
    capture("log", () => {
      const wrapped = logger.tap((err) => {}, "Redis error:")
      wrapped(new Error("ECONNRESET"))
    }),
  )
  const line = calls[0].join(" ")
  assert.ok(line.includes("[TAP]"))
  assert.ok(line.includes("Redis error:"))
  assert.ok(line.includes("ECONNRESET"))
})

test("tap on a function logs args without a label", () => {
  const calls = withEnv("development", () =>
    capture("log", () => {
      const wrapped = logger.tap((x) => x)
      wrapped("hello")
    }),
  )
  const line = calls[0].join(" ")
  assert.ok(line.includes("[TAP]"))
  assert.ok(line.includes("hello"))
})

test("tap on a function logs on every call, not just the first", () => {
  const calls = withEnv("development", () =>
    capture("log", () => {
      const wrapped = logger.tap((x) => x, "val")
      wrapped(1)
      wrapped(2)
      wrapped(3)
    }),
  )
  assert.equal(calls.length, 3)
})

test("tap on a function is silent in production but still calls the original", () => {
  let callCount = 0
  const calls = withEnv("production", () =>
    capture("log", () => {
      const wrapped = logger.tap(() => { callCount++ }, "lbl")
      wrapped()
    }),
  )
  assert.equal(calls.length, 0)
  assert.equal(callCount, 1)
})

test("tap on an EventEmitter logs a [WARN] and returns the emitter unchanged", () => {
  const emitter = new EventEmitter()
  let returned
  const calls = withEnv("development", () =>
    capture("warn", () => {
      returned = logger.tap(emitter, "Connection closed")
    }),
  )
  assert.equal(returned, emitter)
  const line = calls[0].join(" ")
  assert.ok(line.includes("[WARN]"))
  assert.ok(line.includes("EventEmitter"))
})
