/*
 * tap.test.mjs
 * Tests for logger.tap — logs a value and returns it unchanged.
 */

import test from "node:test"
import assert from "node:assert/strict"

import logger from "../dist/index.js"
import { withEnv, capture } from "./helpers.mjs"

async function captureAsync(method, fn) {
  const original = console[method]
  const calls = []
  console[method] = (...args) => {
    calls.push(args)
  }
  try {
    await fn()
    await new Promise((resolve) => setImmediate(resolve))
    await new Promise((resolve) => setImmediate(resolve))
  } finally {
    console[method] = original
  }
  return calls
}

test("tap returns the exact same value (by reference)", () => {
  const obj = { id: 1 }
  const arr = [1, 2, 3]
  withEnv("development", () =>
    capture("log", () => {
      assert.equal(logger.tap(obj, "obj"), obj) // same reference
      assert.equal(logger.tap(arr), arr)
      assert.equal(logger.tap("hello"), "hello")
      assert.equal(logger.tap(42), 42)
    }),
  )
})

test("tap logs the value with a [TAP] tag and the label", () => {
  const line = withEnv("development", () =>
    capture("log", () => logger.tap({ id: 1, name: "Alice" }, "user")),
  )[0].join(" ")
  assert.ok(line.includes("[TAP]"))
  assert.ok(line.includes("user")) // the label
  assert.ok(line.includes("id") && line.includes("Alice")) // the value
})

test("tap works without a label", () => {
  const line = withEnv("development", () =>
    capture("log", () => logger.tap("solo value")),
  )[0].join(" ")
  assert.ok(line.includes("[TAP]"))
  assert.ok(line.includes("solo value"))
})

test("tap is silent in production but still returns the value", () => {
  let returned
  const calls = withEnv("production", () =>
    capture("log", () => {
      returned = logger.tap("payload", "lbl")
    }),
  )
  assert.equal(calls.length, 0) // nothing logged
  assert.equal(returned, "payload") // value still returned
})

test("tap's caller location points back at the calling file", () => {
  const line = withEnv("development", () =>
    capture("log", () => logger.tap("where", "here")),
  )[0].join(" ")
  assert.match(line, /tap\.test\.mjs:\d+/)
})

test("tap does not crash on a circular object", () => {
  const circular = {}
  circular.self = circular
  let returned
  assert.doesNotThrow(() => {
    withEnv("development", () =>
      capture("log", () => {
        returned = logger.tap(circular, "circular")
      }),
    )
  })
  assert.equal(returned, circular) // still returns it
})

test("tap logs a POST API response sample", async () => {
  const body = { id: 3, name: "Charlie" }
  const payload = JSON.stringify(body)
  const responsePromise = Promise.resolve(
    new Response(payload, {
      status: 201,
      statusText: "Created",
      headers: {
        "content-length": String(payload.length),
        "content-type": "application/json",
      },
    }),
  )

  const calls = await withEnv("development", () =>
    captureAsync("log", async () => {
      const tapped = logger.tap(responsePromise, "POST /users")
      assert.equal(tapped, responsePromise)
      await tapped
    }),
  )

  assert.equal(calls.length, 1)
  const line = calls[0].join(" ")
  assert.ok(line.includes("[TAP]"))
  assert.ok(line.includes("POST /users"))
  assert.ok(line.includes("response:"))
  assert.ok(line.includes("time:"))
  assert.ok(line.includes("status: 201 Created"))
  assert.ok(line.includes("size:"))
  assert.ok(line.includes("body:"))
  assert.ok(line.includes("Charlie"))
})
