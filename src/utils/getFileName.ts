/*
 * getFileName.ts
 * Created by Dewan Mobashirul
 * Copyright (c) 2026 dewan-meadown
 * All rights reserved
 */

/**
 * Returns the caller's source location as `file.ext:line` by reading the call
 * stack, or `"unknown"` if it can't be determined (e.g. minified or eval code).
 */
export default function getFileName(): string {
  const stack = new Error().stack ?? ""
  const line = stack.split("\n")[3] ?? ""
  const match = line.match(/([^/\\]+\.[cm]?[jt]sx?):(\d+)/)
  return match ? match[0] : "unknown"
}
