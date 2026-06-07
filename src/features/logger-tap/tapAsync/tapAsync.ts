/*
 * tapAsync.ts
 * Created by Dewan Mobashirul
 * Copyright (c) 2026 meadown
 * All rights reserved
 */

import {
  formatDuration,
  formatBytes,
  isResponse,
  readBody,
  buildBlock,
} from "./helpers/index.js"
import { isTTY } from "../../../domain/terminal/isTTY.js"
import { writeLog } from "../../../domain/write/index.js"
import { type Caller } from "../../../domain/caller/getCaller.js"
import { isLogAllowed } from "../../../config/index.js"

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
  if (!isLogAllowed()) return
  const useColor = isTTY("stdout")
  // Global `performance` (not `node:perf_hooks`) — Node >= 16 and browsers both
  // expose it, and bundlers that pull this file into a client chunk can't
  // externalize `node:perf_hooks`.
  const start = performance.now()
  void promise.then(
    (resolved) => {
      const ms = Math.round(performance.now() - start)

      if (isResponse(resolved)) {
        let clone: typeof resolved | null = null
        try {
          clone = resolved.clone()
        } catch {
          clone = null
        }

        if (clone === null) {
          writeLog({
            channel: "log",
            tag: "[TAP]",
            args: buildBlock(
              label,
              ms,
              resolved,
              { data: undefined, size: "unknown" },
              useColor,
            ),
            caller,
          })
          return
        }

        const cl = resolved.headers?.get?.("content-length")
        const tooLarge = cl != null && cl !== "" && Number(cl) > 512 * 1024
        if (tooLarge) {
          writeLog({
            channel: "log",
            tag: "[TAP]",
            args: buildBlock(
              label,
              ms,
              resolved,
              {
                data: "(body too large to display)",
                size: formatBytes(Number(cl)),
              },
              useColor,
            ),
            caller,
          })
          return
        }

        void readBody(clone).then((body) => {
          writeLog({
            channel: "log",
            tag: "[TAP]",
            args: buildBlock(label, ms, resolved, body, useColor),
            caller,
          })
        })
        return
      }

      // Non-Response promise — plain value with elapsed time.
      const elapsed = formatDuration(ms, useColor)
      writeLog({
        channel: "log",
        tag: "[TAP]",
        args:
          label === undefined
            ? [elapsed, resolved]
            : [`${label} ${elapsed}`, resolved],
        caller,
      })
    },
    (err) => {
      const ms = Math.round(performance.now() - start)
      const elapsed = formatDuration(ms, useColor)
      writeLog({
        channel: "error",
        tag: "[ERROR]",
        args: [
          label === undefined
            ? `rejected after ${elapsed}`
            : `${label} rejected after ${elapsed}`,
          err,
        ],
        caller,
      })
    },
  )
}
