/*
 * config.ts
 * Created by Dewan Mobashirul
 * Copyright (c) 2026 meadown
 * All rights reserved
 */

/**
 * Logging is enabled in every environment except production, read directly
 * from `process.env.NODE_ENV`. No configuration — set `NODE_ENV=production`
 * in your runtime to silence logs.
 */
export function isLogAllowed(): boolean {
  // Guard `process` so the logger doesn't throw in non-Node runtimes (browser,
  // edge) where it may be undefined; default to logging when it's absent.
  return typeof process === "undefined" || process.env.NODE_ENV !== "production"
}
