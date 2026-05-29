/*
 * write-cjs-pkg.mjs
 * Drops a `{ "type": "commonjs" }` marker into dist/cjs so Node treats the
 * CommonJS build's .js files as CJS, even though the root package is ESM.
 * Run after the CommonJS tsc pass. No external dependencies.
 */

import { writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const here = dirname(fileURLToPath(import.meta.url))
const target = join(here, "..", "dist", "cjs", "package.json")

writeFileSync(target, JSON.stringify({ type: "commonjs" }, null, 2) + "\n")
console.log(`wrote ${target}`)
