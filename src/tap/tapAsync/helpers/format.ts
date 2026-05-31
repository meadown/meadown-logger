/*
 * format.ts
 * Created by Dewan Mobashirul
 * Copyright (c) 2026 meadown
 * All rights reserved
 */

import { colorize } from "../../../colors/color.js"

/** `65ms` (green) · `1.2s` (yellow) · `5.8s` (red). */
export function formatDuration(ms: number, useColor: boolean): string {
  const text = ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${ms}ms`
  if (!useColor) return text
  if (ms >= 2000) return colorize(text, "red")
  if (ms >= 500) return colorize(text, "yellow")
  return colorize(text, "green")
}

/** `848 B` / `1.84 KB` / `2.10 MB`. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}
