/*
 * demo.ts
 * A quick manual playground for logger.
 *
 * Run it:
 *   pnpm build && node --experimental-strip-types examples/demo.ts
 *
 * Running directly in a terminal means stdout is a TTY, so you'll see the
 * colored level tags, the gray clickable (file:line) link, and the └── branch.
 * Pipe it to a file (node --experimental-strip-types examples/demo.ts > out.txt)
 * to confirm it degrades to clean plain text with no escape codes.
 */

import logger, { type LogFN } from "../dist/index.js"

const log: LogFN = logger

log.maxLines = 0 // 0 means no limit — show all lines

// Basic info log.
log("Server running on port 5000")

// Multiple arguments — everything is printed as-is, like console.log.
log("Auth", "user logged in", { userId: 42, role: "admin" })

// Objects and arrays keep console's native formatting.
log("Cache stats", { hits: 128, misses: 7, ratio: 0.95 })

// Warnings go to stderr with a yellow tag.
log.warn("disk usage above 80%")

// Errors go to stderr with a red tag; pass along an Error for the stack.
log.error("database connection failed", new Error("ECONNREFUSED"))

// Arrow function — location still points here, not at an internal.
const arrowFunction = (): number[] => {
  log("inside an arrow function")
  return log.tap([1, 2, 3], "arrow-fn")
}
arrowFunction()

// tap logs a value and returns it unchanged, so it drops into any expression.
const port: number = log.tap(5000, "port")
log("using port", port)
