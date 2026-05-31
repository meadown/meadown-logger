/*
 * demo.mjs
 * A quick manual playground for logger.
 *
 * Run it:
 *   pnpm demo-mjs
 *   pnpm build && node examples/mjs/demo.mjs
 *
 * Running directly in a terminal means stdout is a TTY, so you'll see the
 * colored level tags, the gray clickable (file:line) link, and the └── branch.
 * Pipe it to a file (node examples/mjs/demo.mjs > out.txt) to confirm it degrades
 * to clean plain text with no escape codes.
 */

import logger from "../../dist/index.js"

logger.maxLines = 0 // 0 means no limit — show all lines

// Basic info log.
logger("Server running on port 5000")

// Multiple arguments — everything is printed as-is, like console.log.
logger("Auth", "user logged in", { userId: 42, role: "admin" })

// Objects and arrays keep console's native formatting.
logger("Cache stats", { hits: 128, misses: 7, ratio: 0.95 })

// Warnings go to stderr with a yellow tag.
logger.warn("disk usage above 80%")

// Errors go to stderr with a red tag; pass along an Error for the stack.
logger.error("database connection failed", new Error("ECONNREFUSED"))

// Arrow function — location still points here, not at an internal.
const arrowFunction = () => {
  logger("inside an arrow function")
  return logger.tap([1, 2, 3], "arrow-fn")
}
arrowFunction()

// tap logs a value and returns it, so it drops into any expression.
const port = logger.tap(5000, "port") // logs it, `port` is still 5000
logger("using port", port)
