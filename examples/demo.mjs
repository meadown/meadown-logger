/*
 * demo.mjs
 * A quick manual playground for customLog.
 *
 * Run it:
 *   pnpm build && node examples/demo.mjs
 *
 * Running directly in a terminal means stdout is a TTY, so you'll see the
 * colored level tags, the gray clickable (file:line) link, and the └── branch.
 * Pipe it to a file (node examples/demo.mjs > out.txt) to confirm it degrades
 * to clean plain text with no escape codes.
 */

import customLog from "../dist/index.js"

customLog.maxLines = 0 // O means no limit, all lines will consoled

// Basic info log.
customLog("Server running on port 5000")

// Multiple arguments — everything is printed as-is, like console.log.
customLog("Auth", "user logged in", { userId: 42, role: "admin" })

// Objects and arrays keep console's native formatting.
customLog("Cache stats", { hits: 128, misses: 7, ratio: 0.95 })

// Warnings go to stderr with a yellow tag.
customLog.warn("disk usage above 80%")

// Errors go to stderr with a red tag; pass along an Error for the stack.
customLog.error("database connection failed", new Error("ECONNREFUSED"))
