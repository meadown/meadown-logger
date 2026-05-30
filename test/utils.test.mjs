/*
 * utils.test.mjs
 * Tests for the timestamp and caller utilities.
 */

import test from "node:test"
import assert from "node:assert/strict"

import getTimeStamp from "../dist/utils/getTimeStamp.js"
import getCaller from "../dist/utils/getCaller.js"
import { fileUrl, hyperlink, supportsHyperlinks } from "../dist/utils/link.js"
import { colorize, supportsColor } from "../dist/utils/color.js"

test("getTimeStamp returns a short MM-DD 12-hour timestamp", () => {
  const stamp = getTimeStamp(new Date("2026-05-30T10:00:00.000Z"))
  // e.g. "05-30 04:00:00 PM" — no year, no timezone.
  assert.match(stamp, /^\d{2}-\d{2} \d{2}:\d{2}:\d{2} (?:AM|PM)$/)
})

test("getTimeStamp accepts a specific Date for deterministic formatting", () => {
  const date = new Date("2026-05-30T10:00:00.000Z")
  assert.equal(getTimeStamp(date), getTimeStamp(date))
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

test("colorize wraps text in ANSI color codes and resets", () => {
  assert.equal(colorize("hi", "red"), "\x1b[31mhi\x1b[0m")
  assert.equal(colorize("hi", "yellow"), "\x1b[33mhi\x1b[0m")
  assert.equal(colorize("hi", "cyan"), "\x1b[36mhi\x1b[0m")
  assert.equal(colorize("hi", "gray"), "\x1b[90mhi\x1b[0m")
  assert.equal(colorize("hi", "teal"), "\x1b[38;5;30mhi\x1b[0m")
  assert.equal(colorize("hi", "dimTeal"), "\x1b[38;5;23mhi\x1b[0m")
})

test("supportsColor follows the stream's TTY status (no env vars)", () => {
  const prev = process.stdout.isTTY
  try {
    process.stdout.isTTY = true
    assert.equal(supportsColor("stdout"), true)
    process.stdout.isTTY = false
    assert.equal(supportsColor("stdout"), false)
  } finally {
    process.stdout.isTTY = prev
  }
})
