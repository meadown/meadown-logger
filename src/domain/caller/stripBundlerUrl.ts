/*
 * stripBundlerUrl.ts
 * Created by Dewan Mobashirul
 * Copyright (c) 2026 meadown
 * All rights reserved
 */

/**
 * Result when the raw path is a known bundler-synthetic URL:
 * `display` is the clean relative source path to show in the label.
 * `file` is always `null` — the absolute path is not recoverable.
 */
export type BundlerPath = { display: string; file: null }

/**
 * Strips bundler-synthetic URL schemes and returns a clean relative path, or
 * `"unknown"` for synthetic frames that are definitively not user source (e.g.
 * bundler internals), or `null` when the path looks like a regular file path
 * that needs no stripping.
 *
 * Add a new branch here when a new bundler or framework introduces its own
 * synthetic URL scheme in Node.js stack frames.
 *
 * Covered environments:
 *   - webpack / Next.js (webpack mode) / Angular CLI / Vue CLI
 *   - Turbopack (Next.js --turbo)
 */
export function stripBundlerUrl(raw: string): BundlerPath | "unknown" | null {
  // webpack-internal:///<optional-(qualifier)/>./relative/path
  // Produced by: webpack, Next.js (webpack), Angular CLI, Vue CLI
  const wpMatch = raw.match(/^webpack-internal:\/\/\/(?:\([^)]*\)\/)?\.\/(.+)$/)
  if (wpMatch !== null) return { display: wpMatch[1] ?? raw, file: null }

  // [project]/relative/path
  // Produced by: Turbopack (Next.js --turbo)
  const turboMatch = raw.match(/^\[project\]\/(.+)$/)
  if (turboMatch !== null) return { display: turboMatch[1] ?? raw, file: null }

  // Any other [bracket] scheme is a bundler-internal synthetic frame, not user source.
  // Examples: [turbopack-node]/dev/noop.ts, [externals]/...
  if (raw.startsWith("[")) return "unknown"

  return null
}
