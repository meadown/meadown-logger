/*
 * tapAsync.ts
 * Created by Dewan Mobashirul
 * Copyright (c) 2026 dewan-meadown
 * All rights reserved
 *
 * The async side of `tap`: times a promise and logs a rich response block when
 * it resolves to a `Response` — status color, slow-request highlighting, size,
 * and the actual body — all fire-and-forget so the caller never waits.
 */

import { performance } from "node:perf_hooks"
import { formatWithOptions } from "node:util"

import { writeLog } from "../core/writeLog/index.js"
import { colorize, type Color } from "../colors/color.js"
import { isTTY } from "../terminal/isTTY.js"
import { type Caller } from "../caller/getCaller.js"

type ResponseLike = {
  status: number
  statusText?: unknown
  headers?: { get?: (name: string) => string | null }
  clone: () => ResponseLike
  text: () => Promise<string>
}

/** Whether `value` is thenable (a promise we can await + time). */
export function isThenable(value: unknown): value is PromiseLike<unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { then?: unknown }).then === "function"
  )
}

/** Whether the resolved value is a fetch `Response` we can read. */
function isResponse(value: unknown): value is ResponseLike {
  const v = value as Partial<ResponseLike> | null
  return (
    typeof v?.status === "number" &&
    typeof v.clone === "function" &&
    typeof v.text === "function"
  )
}

/** `65ms` (green) · `1.2s` (yellow) · `5.8s` (red). */
function formatDuration(ms: number, useColor: boolean): string {
  const text = ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${ms}ms`
  if (!useColor) return text
  if (ms >= 2000) return colorize(text, "red")
  if (ms >= 500) return colorize(text, "yellow")
  return colorize(text, "green")
}

/** `848 B` / `1.84 KB` / `2.10 MB`. */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

/**
 * Status badge color:
 * 2xx → green · 3xx → cyan · 4xx → yellow · 5xx → red
 */
function statusColor(status: number): Color {
  if (status >= 500) return "red"
  if (status >= 400) return "yellow"
  if (status >= 300) return "cyan"
  return "green"
}

function formatStatus(res: ResponseLike, useColor: boolean): string {
  const text =
    typeof res.statusText === "string" && res.statusText
      ? `${res.status} ${res.statusText}`
      : `${res.status}`
  return useColor ? colorize(text, statusColor(res.status)) : text
}

/**
 * Reads a (cloned) response body and returns both the parsed value and the
 * actual byte size. Size is calculated from the body text — not `Content-Length`,
 * which is absent on compressed responses — so size is always shown.
 */
async function readBody(
  res: ResponseLike,
): Promise<{ data: unknown; size: string }> {
  try {
    const text = await res.text()
    const bytes = new TextEncoder().encode(text).length
    const size = formatBytes(bytes)
    if (text === "") return { data: undefined, size }
    try {
      return { data: JSON.parse(text), size }
    } catch {
      return { data: text, size }
    }
  } catch {
    return { data: undefined, size: "unknown" }
  }
}

/**
 * Renders the nested tree block the user asked for:
 *
 *   GET /users/1
 *   │
 *   │  response:
 *   │  ├── time:   65ms
 *   │  ├── status: 200 OK
 *   │  └── size:   848 B
 *   │
 *   │  body:
 *   │  ├── id:    1
 *   │  └── name:  Leanne Graham
 */
function buildBlock(
  label: string | undefined,
  ms: number,
  res: ResponseLike,
  body: { data: unknown; size: string },
  useColor: boolean,
): unknown[] {
  const paint = (s: string, c: Parameters<typeof colorize>[1]): string =>
    useColor ? colorize(s, c) : s
  const pipe = paint("│", "gray")
  const branch = paint("├──", "gray")
  const last = paint("└──", "gray")
  const indent = `${pipe}  `

  const timeLine = `${indent}${branch} time:   ${formatDuration(ms, useColor)}`
  const statusLine = `${indent}${branch} status: ${formatStatus(res, useColor)}`
  const sizeLine = `${indent}${last} size:   ${body.size}`
  const responseLines = [`${pipe}`, `${indent}response:`, timeLine, statusLine, sizeLine]

  const head = label === undefined ? "" : `${label}\n`

  if (body.data === undefined) {
    return [`${head}${responseLines.join("\n")}`]
  }

  // Render the body using util.formatWithOptions so objects/arrays look like
  // console.log output — colors, proper nesting, no JSON.stringify quirkiness.
  const bodyText = formatWithOptions({ colors: useColor }, body.data)
  const bodyLines = bodyText.split("\n")
  const lastIdx = bodyLines.length - 1
  const bodyBlock = bodyLines
    .map((line, i) => `${indent}${i === lastIdx ? last : branch} ${line}`)
    .join("\n")

  const full = [...responseLines, `${pipe}`, `${indent}body:`, bodyBlock].join("\n")
  return [`${head}${full}`]
}

/**
 * The async tap. Fire-and-forget: returns `promise` immediately (unchanged),
 * and logs a rich block once it resolves. For a `Response`, reads the body from
 * a clone so the caller's original stays consumable. A rejection logs an error
 * to stderr. `caller` MUST be resolved by `tap` (the user-facing function) so
 * the logged location points at the user's file.
 */
export function tapAsync(
  promise: PromiseLike<unknown>,
  label: string | undefined,
  caller: Caller,
): void {
  const useColor = isTTY("stdout")
  const start = performance.now()
  void promise.then(
    (resolved) => {
      const ms = Math.round(performance.now() - start)

      if (isResponse(resolved)) {
        let clone: ResponseLike | null = null
        try { clone = resolved.clone() } catch { clone = null }

        if (clone === null) {
          writeLog({
            channel: "log", tag: "[TAP]",
            args: buildBlock(label, ms, resolved, { data: undefined, size: "unknown" }, useColor),
            caller,
          })
          return
        }

        const cl = resolved.headers?.get?.("content-length")
        const tooLarge = cl != null && cl !== "" && Number(cl) > 512 * 1024
        if (tooLarge) {
          writeLog({
            channel: "log", tag: "[TAP]",
            args: buildBlock(label, ms, resolved, { data: "(body too large to display)", size: formatBytes(Number(cl)) }, useColor),
            caller,
          })
          return
        }

        void readBody(clone).then((body) => {
          writeLog({ channel: "log", tag: "[TAP]", args: buildBlock(label, ms, resolved, body, useColor), caller })
        })
        return
      }

      // Non-Response promise — plain value with elapsed time.
      const elapsed = formatDuration(ms, useColor)
      writeLog({
        channel: "log", tag: "[TAP]",
        args: label === undefined ? [elapsed, resolved] : [`${label} ${elapsed}`, resolved],
        caller,
      })
    },
    (err) => {
      const ms = Math.round(performance.now() - start)
      const elapsed = formatDuration(ms, useColor)
      writeLog({
        channel: "error", tag: "[ERROR]",
        args: [label === undefined ? `rejected after ${elapsed}` : `${label} rejected after ${elapsed}`, err],
        caller,
      })
    },
  )
}
