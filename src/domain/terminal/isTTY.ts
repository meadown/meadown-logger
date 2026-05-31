/*
 * isTTY.ts
 * Created by Dewan Mobashirul
 * Copyright (c) 2026 meadown
 * All rights reserved
 */

/**
 * Whether the given stream is an interactive terminal — the single source of
 * truth for "should we emit terminal escapes (colors, clickable links)?". No env
 * vars, no config. When output is piped or redirected this is `false`, so escape
 * codes never end up in files or logs.
 */
export function isTTY(streamName: "stdout" | "stderr"): boolean {
  if (typeof process === "undefined") return false
  const stream = streamName === "stdout" ? process.stdout : process.stderr
  return Boolean(stream?.isTTY)
}
