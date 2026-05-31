/*
 * buildBlock.ts
 * Created by Dewan Mobashirul
 * Copyright (c) 2026 meadown
 * All rights reserved
 */

import { formatWithOptions } from "node:util"

import { formatDuration } from "./format.js"
import { colorize } from "../../../../domain/colors/color.js"
import { type ResponseLike, formatStatus } from "./response.js"

/**
 * Renders the nested tree block:
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
export function buildBlock(
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
  const responseLines = [
    `${pipe}`,
    `${indent}response:`,
    timeLine,
    statusLine,
    sizeLine,
  ]

  const head = label === undefined ? "" : `${label}\n`

  if (body.data === undefined) {
    return [`${head}${responseLines.join("\n")}`]
  }

  const bodyText = formatWithOptions({ colors: useColor }, body.data)
  const bodyLines = bodyText.split("\n")
  const lastIdx = bodyLines.length - 1
  const bodyBlock = bodyLines
    .map((line, i) => `${indent}${i === lastIdx ? last : branch} ${line}`)
    .join("\n")

  const full = [...responseLines, `${pipe}`, `${indent}body:`, bodyBlock].join(
    "\n",
  )
  return [`${head}${full}`]
}
