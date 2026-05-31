/*
 * response.ts
 * Created by Dewan Mobashirul
 * Copyright (c) 2026 meadown
 * All rights reserved
 */

import { formatBytes } from "./format.js"
import { colorize, type Color } from "../../../../domain/colors/color.js"

export type ResponseLike = {
  status: number
  statusText?: unknown
  headers?: { get?: (name: string) => string | null }
  clone: () => ResponseLike
  text: () => Promise<string>
}

/** Whether the resolved value is a fetch `Response` we can read. */
export function isResponse(value: unknown): value is ResponseLike {
  const v = value as Partial<ResponseLike> | null
  return (
    typeof v?.status === "number" &&
    typeof v.clone === "function" &&
    typeof v.text === "function"
  )
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

export function formatStatus(res: ResponseLike, useColor: boolean): string {
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
export async function readBody(
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
