/*
 * utils.test.mjs
 * Tests for the timestamp and caller utilities.
 */

import test from "node:test"
import assert from "node:assert/strict"

import getTimeStamp from "../dist/utils/getTimeStamp.js"
import getFileName from "../dist/utils/getFileName.js"

test("getTimeStamp returns a valid ISO-8601 string", () => {
  const stamp = getTimeStamp()
  assert.equal(typeof stamp, "string")
  // Parses back to a real date, and round-trips to the same ISO string.
  assert.equal(new Date(stamp).toISOString(), stamp)
})

test("getTimeStamp reflects the current time", () => {
  const before = Date.now()
  const stamp = getTimeStamp()
  const after = Date.now()
  const t = new Date(stamp).getTime()
  assert.ok(t >= before && t <= after, `${stamp} not within [${before}, ${after}]`)
})

test("getFileName returns a string", () => {
  const name = getFileName()
  assert.equal(typeof name, "string")
})

test("getFileName returns either a file:line location or 'unknown'", () => {
  const name = getFileName()
  // Either it matched a stack frame (file.ext:line) or it fell back to "unknown".
  assert.ok(
    name === "unknown" || /[^/\\]+\.[jt]sx?:\d+/.test(name),
    `unexpected caller format: ${name}`,
  )
})
