/*
 * utils.test.mjs
 * Tests for the timestamp and caller utilities.
 */

import test from "node:test"
import assert from "node:assert/strict"

import getTimeStamp from "../dist/utils/getTimeStamp.js"
import getCaller from "../dist/utils/getCaller.js"
import { fileUrl, hyperlink, supportsHyperlinks } from "../dist/utils/link.js"

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
  assert.ok(
    t >= before && t <= after,
    `${stamp} not within [${before}, ${after}]`,
  )
})

test("getCaller returns a structured caller", () => {
  const caller = getCaller()
  assert.equal(typeof caller.label, "string")
  // Either a resolved location (label + file + line) or the unknown fallback.
  if (caller.label === "unknown") {
    assert.equal(caller.file, null)
    assert.equal(caller.line, null)
  } else {
    assert.match(caller.label, /[^/\\]+\.[cm]?[jt]sx?:\d+/)
    assert.equal(typeof caller.file, "string")
    assert.equal(typeof caller.line, "number")
  }
})

test("hyperlink wraps text in an OSC-8 escape sequence", () => {
  const out = hyperlink("server.ts:42", "file:///app/server.ts:42")
  assert.equal(
    out,
    "\x1b]8;;file:///app/server.ts:42\x07server.ts:42\x1b]8;;\x07",
  )
})

test("fileUrl builds a valid file:// URL (no line suffix), passing through URLs", () => {
  // No `:line` suffix — that breaks file openers like GNOME's gio.
  assert.equal(fileUrl("/app/server.ts"), "file:///app/server.ts")
  assert.equal(fileUrl("file:///app/server.ts"), "file:///app/server.ts")
})

test("supportsHyperlinks follows the stream's TTY status (no env vars)", () => {
  const prev = process.stdout.isTTY
  try {
    process.stdout.isTTY = true
    assert.equal(supportsHyperlinks("stdout"), true)
    process.stdout.isTTY = false
    assert.equal(supportsHyperlinks("stdout"), false)
  } finally {
    process.stdout.isTTY = prev
  }
})
