# Dev Journal: @meadown/logger

> A complete record of the design and development conversation: what was asked,
> what was suggested, what was decided, and why. Ordered chronologically from
> the first question to the current state.

---

## 1. Starting point: the utility split

**Asked:** Split `caller()` and `getTimeStamp()` out of `index.ts` into a utils
folder.

**Done:** Created `src/utils/getFileName.ts` and `src/utils/getTimeStamp.ts`,
wired up a barrel export.

**Why it mattered:** Index was doing too much. Splitting gave each concern its
own file and made the utilities independently testable.

---

## 2. Consumer configuration: `isLogAllowed` and `isDebugAllowed`

**Asked:** Let the consumer optionally override `isLogAllowed` and
`isDebugAllowed` at install time but make it optional.

**Suggested:** A `configure()` function with optional fields, falling back to
env-based defaults when omitted. Added a `LoggerOptions` interface.

**Decided:** Built it. Then added a `mode` type (`"development" | "production" |
"both"`) instead of raw booleans — more readable at the call site.

**Then decided:** Remove `customLogConfig` entirely. The zero-config identity
is more valuable than a config surface. `NODE_ENV` is the only knob consumers
need.

**Lesson:** Configuration APIs have a cost. Every option added is one more thing
to explain, document, and support. When in doubt, remove it.

---

## 3. Named exports: `{ customLog, customLogConfig }`

**Asked:** Export the logger as `{ customLog, customLogConfig }` (named
destructuring), not just a default.

**Done:** Both named and default exports added.

**Later:** `customLogConfig` removed. `customLog` renamed to `logger` as the
primary API name. Both named and default exports kept so `import logger` and
`import { logger }` both work.

---

## 4. Debug removal

**Asked:** Remove the debug feature entirely for this version.

**Done:** Dropped `.debug()`, `isDebugAllowed`, and `DEBUG` env var check.

**Why:** Scope discipline. Version 1 should do one thing well, not four things
adequately.

---

## 5. NODE_ENV and the .env problem

**Asked:** Should there be a `NODE_ENV` in the user's `.env`?

**Discussion:** `.env` files do not automatically set `process.env.NODE_ENV`.
Something has to load them first (dotenv, `node --env-file`, frameworks).
Considered three options:

- Keep `NODE_ENV` and document it.
- Add an explicit `env` override (`customLogConfig({ env: "production" })`).
- Drop `NODE_ENV` entirely.

**Prototyped:** The `env` override. Then reverted — felt messy and premature.

**Decided:** Option A. Read `NODE_ENV` directly. No config surface. Document
the `.env` caveat. Recorded in `docs/DECISIONS.md`.

**Rule established:** `NODE_ENV` is the only consumer-facing env var. No other
env knobs, no `FORCE_HYPERLINK`, no `LOG_EDITOR`. Features must work zero-config
with only `process.env.NODE_ENV`.

---

## 6. Fixing the `as LogFN` cast

**Asked:** Why does the code do `const log = customLog as LogFN`?

**Explanation:** The cast bridged the gap between the inferred type of the
function-plus-properties pattern and the named `LogFN` interface. When the
interface was updated to match the implementation exactly, the cast became
redundant — eslint flagged it.

**Fix:** Refactored to `Object.assign((...args) => {…}, { error, warn })` typed
as `LogFN` from declaration — enforced, not asserted.

---

## 7. CJS + ESM dual build

**Problem hit:** Consumer `educare-backend` was CJS and couldn't `require()`
the ESM-only package. Error: "Cannot find module."

**Decided:** Add a dual build. ESM stays as `dist/`, CJS goes to `dist/cjs/`
with a `{ "type": "commonjs" }` marker file written by a post-build script.

**How:** Second `tsc` pass with `tsconfig.cjs.json` (`module: commonjs`,
`moduleResolution: node10`, `ignoreDeprecations: "6.0"`). The `exports` map
has per-format `import`/`require` conditions with their own `types` pointers.

**Also fixed:** Named export was missing. Consumer code used
`import { logger }` (named) which was `undefined` because only the default was
exported. Added `export { logger }`.

---

## 8. Timestamp format evolution

**Started with:** ISO 8601 (`2026-05-30T10:00:00.000Z`).

**Changed to:** Local time with AM/PM and timezone (`05/30/2026, 04:00:00 PM GMT+6`).

**Problem:** MM/DD/YYYY is ambiguous, doesn't sort, and the year + timezone
clutters every line.

**Final decision:** `05-30 04:00:00 PM`. ISO date order (`MM-DD`), 12-hour
time, no year, no timezone. Short, unambiguous, readable.

**Why drop the year and timezone:** If you're looking at logs live you know what
day it is. The timezone is always your own.

---

## 9. Color system

**Asked:** Add color-coded level tags.

**Designed:** Raw ANSI escape codes, no `chalk`, no external package. Separate
`colorize(text, color)` function for applying color, `isTTY(streamName)` for
deciding whether to apply it. Kept separate so the decision and the action are
decoupled.

**Colors chosen:**

- `[INFO]` cyan
- `[WARN]` yellow
- `[ERROR]` red
- Timestamp + location: teal / dim teal
- Branch glyphs: gray

**Asked:** Add `teal` and `dimTeal` as named colors.

**Done:** Added as 256-color ANSI codes (`38;5;30` and `38;5;23`).

**Asked:** Color only the tag, not the full line.

**Done:** Timestamp and location are separate arguments; `colorize` applies only
to the tag and branch connector.

---

## 10. Tree layout

**Asked:** Output format should be like:

```
[INFO] 2026-05-29T22:05:59 (server.ts:24)
  Environment: development
```

**Iterated through:** Various `\n` combinations, leading/trailing blank lines,
`├──` / `└──` branch connectors.

**Problem hit:** The `console.log("")` added to create a blank line above each
entry always wrote to `stdout`, even for `error`/`warn` which write to
`stderr`. The timestamp and message landed on different streams. Broke tests.

**Fix:** Fold the blank line into the same `console[channel]` call as a leading
`\n` argument.

**Final layout:**

```
[INFO]
├── message here
└── 05-30 04:00:00 PM - (server.ts:42)
```

**Observation:** `├──` in non-TTY (piped) output was showing as `└──` because
the plain-mode fallback used the wrong constant. Fixed.

---

## 11. Clickable source links (F1)

**Asked:** Implement the headline feature. `(server.ts:42)` should be a
clickable link in the terminal.

**Technology:** OSC-8 hyperlinks (`\x1b]8;;URL\x07text\x1b]8;;\x07`). Pure
terminal escape sequences, no dependencies.

**Problem hit:** First used `file:///path/to/file:42` (`:line` appended to the
URL). This broke GNOME Terminal/`gio` — it tried to open a file literally named
`server.ts:42`. Error dialog appeared.

**Fix:** Use a valid `file://` URL (no `:line` suffix). The line number stays
visible in the link's display text.

**VS Code deep-link attempt:** Tried `vscode://file/path:line:1` when
`TERM_PROGRAM === "vscode"`. Implemented, then removed — it required reading an
env var, which violated the zero-env rule.

**Rule reinforced:** Only `NODE_ENV`. Terminal detection reads `isTTY` (a
runtime signal set by the terminal, not the user). Any feature that requires
the user to set an env var gets removed.

**Regex fix:** The caller regex `\.[jt]sx?` missed `.mjs`/`.cjs`/`.mts`/`.cts`.
Fixed to `\.[cm]?[jt]sx?`. Test confirmed `logger.test.mjs:42` now resolves.

---

## 12. `logger.tap`: the headline feature

**Motivation:** Writing:

```ts
const user = await getUser(id)
console.log("user:", user)
return user
```

Two lines every time. Wanted one.

**API design discussion: should tap be sync only or handle promises?**

First proposal: sync `tap` + separate `tapAsync`. Decided against splitting
the public API. The consumer shouldn't choose. One `tap` that internally
routes: sync value logs inline, promise uses the async path.

**The critical constraint: caller location.**

`getCaller()` reads a fixed stack depth. Any extra function frame between the
user's call and `getCaller()` points the location at the wrong file. The rule:

> `getCaller()` is always called in the user-facing function and **passed down**
> to any shared helper. Never resolved inside the helper.

So `writeLog({ …, caller })` takes the caller as an argument. `tapAsync` also
takes the caller as an argument — resolved by `tap` before the async hop, so
the location points at the user's code even across `await`.

**Internal structure:**

```
tap/
  createTap.ts   the public `tap`; resolves caller; routes to tapAsync or sync writeLog
  tapAsync.ts    the async path; timing, status, body, rejection logging
```

**Verified:** Location is correct from every call context: top-level, regular
function, arrow, class method, static method, async/await, callback.

---

## 13. API response logging: `tap(fetch(...))`

**Realised:** `tap` on a fetch promise resolves to a `Response`, not the data.
To show what actually came back, the body needs to be read.

**Constraint:** The caller's `Response` must stay consumable. If `tap` reads
the body, the consumer can't call `res.json()` anymore.

**Solution:** `res.clone()` in the background. Read the clone, leave the
original untouched. Verified: consumer got the real data after `tap`.

**What gets logged:**

```text
response: {
  status: 200 OK
  time: 44ms
  size: 509 B
}
data: { id: 1, name: 'Leanne Graham', … }
```

**Size problem:** `Content-Length` is absent on compressed responses
(`Content-Encoding: br` or `gzip`, most production APIs). Relying on the
header meant size never showed for real-world endpoints.

**Fix:** Compute size from `new TextEncoder().encode(text).length` on the body
text already read from the clone. Size is now always shown regardless of
compression.

**Rejection logging:** Initially nothing happened on rejected promises. Fixed to log
`[TAP] label rejected after 42ms TypeError: fetch failed …` to `stderr`.

**Large body protection:** Body reading gated at 512 KB (`Content-Length` check
before cloning). Large responses show `"(body too large to display)"` instead
of buffering the whole thing.

---

## 14. Folder restructure

**Asked:** Distinguish files by feature/type with separate folders.

**Designed:**

```
src/
  core/         createLog, writeLog (the pipeline)
  tap/          createTap, tapAsync
  colors/       colorize, Color type
  decorations/  OSC-8 clickable links
  caller/       getCaller (stack -> file:line)
  time/         getTimeStamp
  terminal/     isTTY (single source of truth)
  constants.ts  all layout values in one place
```

**DRY applied:** `supportsColor` and `supportsHyperlinks` were byte-for-byte
identical. Both removed. One `terminal/isTTY.ts` serves both.

**Constants centralised:** `TAG_COLOR`, `BRANCH`, `BRANCH_END`, `SEPARATOR`,
`MESSAGE_INDENT`, `DEFAULT_MAX_LINES`, `LogChannel` all moved to
`src/constants.ts`. No magic literals scattered across `writeLog.ts`.

**Barrel removed:** `utils/index.ts` barrel was re-exporting symbols only
`src/index.ts` used. Dropped it. `index.ts` now imports directly from each
feature folder.

---

## 15. Security work

**Asked:** Make the package credible to security reviewers.

**`SECURITY.md` added** covering:

- Zero runtime dependencies (no supply-chain surface).
- No I/O, no network, no dynamic execution, nothing persisted.
- Trust boundary: log arguments are output, not sanitized (same as `console.log`).
- `tap` specifically: does not store, forward, or hijack tokens/sessions. Returns
  the exact value by reference. The only "exposure" is text printed to your
  terminal.
- Private vulnerability reporting to `inbox.meadown@gmail.com`.

**Audit findings resolved:**

- Source maps (`22 .map` files) were shipping in the tarball. Removed by
  setting `sourceMap: false` in `tsconfig.json`.
- `MESSAGE_INDENT` was 3 spaces but `├── ` is 4 columns wide. Off by one.
  Fixed in `constants.ts`.
- Plain-mode tree used `└──` for the message branch instead of `├──`. Fixed.

---

## 16. Positioning decision

**Original framing:** "Shuts up in production."

**Problem with that framing:** It defines the package by what it doesn't do
in production, which implicitly closes the door on a future production-grade
logger. It also undersells the development experience, which is the real value.

**New framing:** "Development-focused logger."

The production handling is a consequence of being development-focused, not the
identity. A production logger with transports, persistence, and log levels is a
separate product. This one is for the part of your day when you're moving fast
and need to know what your code is doing right now.

**Changed everywhere:** README, MARKETING.md, `package.json` description.

---

## 17. Key rules that held throughout

These came up repeatedly and shaped every decision:

1. **Zero runtime dependencies.** Every feature implemented with Node built-ins.
2. **`NODE_ENV` is the only consumer-facing env var.** No `FORCE_HYPERLINK`,
   no `LOG_EDITOR`, no `DEBUG`. Features must work zero-config.
3. **`getCaller()` is always called in the user-facing function.** Never inside
   a helper. The resolved `Caller` is passed down.
4. **Commit only when asked.** Never auto-commit, never push without explicit
   instruction. Review before committing.
5. **Remove rather than add.** Each iteration cut something: `customLogConfig`,
   env var knobs, the `utils/` barrel, source maps, duplicate `isTTY`
   functions, the `debug` feature.

---

## 18. What was cut and why

| Cut                                    | Reason                                             |
| -------------------------------------- | -------------------------------------------------- |
| `customLogConfig` / `mode` API         | Zero-config identity more valuable                 |
| `isDebugAllowed` / `.debug()`          | Out of v1 scope                                    |
| `FORCE_HYPERLINK` env var              | Violates zero-env rule                             |
| `LOG_EDITOR` / `vscode://` deep link   | Violates zero-env rule                             |
| Click-to-expand collapse               | Terminals can't do it, not a browser               |
| Temp file for collapsed content        | Writes to disk, privacy risk, complexity           |
| `supportsColor` / `supportsHyperlinks` | Duplicate of `isTTY`                               |
| `utils/index.ts` barrel                | Only used by one file; removed for directness      |
| Source maps in tarball                 | Point at unpublished `src/`; dead weight           |
| `tapAsync` as a public API             | Consumer shouldn't choose; `tap` routes internally |
