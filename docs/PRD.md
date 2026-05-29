# PRD — @meadown/logger

> A lightweight, **zero-dependency** logger for Node.js & TypeScript.
> Status: draft · Owner: Dewan Meadown · Last updated: 2026-05-30

---

## 1. Summary

`@meadown/logger` is a drop-in replacement for `console.log` that knows **where**
a log came from and **when** to stay quiet. It ships with no external packages —
only Node.js built-ins and raw ANSI escape codes.

This document defines the next set of features and the developer pain points each
one removes. The guiding principle: **do a few things flawlessly, add nothing that
requires a dependency.**

### Non-negotiable constraints

- **Zero runtime dependencies.** No `chalk`, no `debug`, no `winston`. Everything
  is built from `node:*` built-ins and ANSI/OSC escape sequences.
- **Zero config to start.** A single import must work with sensible defaults.
- **TypeScript-first.** Full types shipped; no `@types` package needed.
- **Stays quiet in production by default.** Logging is opt-in for prod.

---

## 2. Current state (baseline)

| Capability                                                            | Status     |
| --------------------------------------------------------------------- | ---------- |
| `customLog(...)` info logging                                         | ✅ shipped |
| `customLog.error` / `customLog.warn`                                  | ✅ shipped |
| Auto file + line capture (`caller()`)                                 | ✅ shipped |
| ISO timestamp on every line                                           | ✅ shipped |
| Env-aware on/off via `mode` (`development` \| `production` \| `both`) | ✅ shipped |
| `customLogConfig({ mode })` runtime config                            | ✅ shipped |

**Public API today**

```ts
import { customLog, customLogConfig } from "@meadown/logger"

customLog("Auth", "user logged in") // [INFO] 2026-... user logged in (server.ts:42)
customLog.error("request failed", err)
customLog.warn("deprecated call")
customLogConfig({ mode: "both" })
```

---

## 3. Pain points we are solving

| #   | Pain point                                                                               | Who feels it          | Today's reality                                           | Our fix                              |
| --- | ---------------------------------------------------------------------------------------- | --------------------- | --------------------------------------------------------- | ------------------------------------ |
| P1  | "Which file logged this?" — scrolling to find the source of a `console.log`              | Every dev, daily      | We already print `file:line` as **plain text**            | **F1 — Clickable source links**      |
| P2  | Logging a value forces you to break an expression onto its own line, run, then delete it | Every dev, daily      | `const x = expr` → `console.log(expr)` → `const x = expr` | **F2 — `.tap()` inline logging**     |
| P3  | Logs are silenced in prod, so when prod breaks there's **no context** around the error   | Teams running in prod | Silent logger = blind debugging on incidents              | **F3 — Error breadcrumbs**           |
| P4  | Hard to scan a noisy console; all lines look the same                                    | Every dev             | Mono-color `console.*` output                             | **F4 — Colored, aligned dev output** |

---

## 4. Features

### F1 — Clickable jump-to-source ⭐ headline feature

**Problem (P1).** We already capture `file:line`, but it prints as dead text. The
dev still has to manually open the file and scroll.

**Solution.** Emit the source location as a terminal **hyperlink** using the OSC-8
escape sequence, pointing at `file://<absolute-path>:<line>`. Supported terminals
(VS Code, iTerm2, WezTerm, Kitty) render it as a clickable link that jumps straight
to the line. Unsupported terminals fall back to plain text automatically.

**Behavior.**

- Default ON when output is a TTY that advertises hyperlink support; otherwise plain text.
- `getFileName` must return the **absolute path + line**, not just the basename, so the link resolves.
- Zero deps: a single helper wrapping the label in `\x1b]8;;URL\x07 … \x1b]8;;\x07`.

**Success metric.** Clicking a logged location opens the exact line in the editor.

**Out of scope.** Editor-specific URI schemes (`vscode://`) — `file://` is universal enough for v1.

---

### F2 — `.tap()` inline value logging

**Problem (P2).** To log an intermediate value you must restructure code, then undo it.

**Solution.** `customLog.tap(value, label?)` logs the value **and returns it**, so it
drops into any expression without changing control flow.

```ts
const total = customLog.tap(cart.reduce(sum, 0), "total") // logs + returns the number
return customLog.tap(await fetchUser(id), "user") // log mid-pipeline
```

**Behavior.**

- Returns the exact value passed in (generic `<T>(value: T) => T`), preserving type.
- Obeys the same `mode` gate as `customLog`; in a silenced env it's a pure pass-through (no output, no cost beyond the call).
- Optional `label` prefixes the line for context.

**Success metric.** A value can be logged without moving it to its own statement.

---

### F3 — Error breadcrumbs

**Problem (P3).** "Silent in prod" means incidents have no surrounding context.

**Solution.** Keep the last _N_ log lines in a small in-memory **ring buffer**,
recorded even when output is suppressed. When `customLog.error(...)` fires, dump the
buffered breadcrumbs alongside the error so the incident comes with its lead-up.

```ts
customLogConfig({ breadcrumbs: 20 }) // 0 = disabled (default)

customLog("Auth", "token refreshed") // stored silently in prod
customLog("Cart", "checkout started") // stored silently in prod
customLog.error("payment failed", err) // prints the error + the 20 lines before it
```

**Behavior.**

- Off by default (`breadcrumbs: 0`) to keep the zero-config path allocation-free.
- Fixed-size buffer (no unbounded memory growth); oldest entry evicted on overflow.
- Each breadcrumb stores level, timestamp, caller, and args — no serialization until dumped.
- Dump format clearly delimits "breadcrumbs leading to this error".

**Success metric.** A prod error log includes the preceding context that explains it.

**Open question.** Should `.warn` also flush, or only `.error`? Default: `.error` only.

---

### F4 — Colored, aligned dev output

**Problem (P4).** All console lines look the same; hard to scan at a glance.

**Solution.** In a TTY dev environment, colorize the level tag and dim the
timestamp/source using **raw ANSI codes** (no `chalk`). Auto-disable colors when:
output is not a TTY, `NO_COLOR` is set, or `mode` resolves to production with JSON.

**Behavior.**

- `[INFO]` cyan, `[WARN]` yellow, `[ERROR]` red; timestamp + source dimmed.
- Honors the `NO_COLOR` convention.
- Pure passthrough of ANSI when supported; strips to plain text otherwise.

**Success metric.** Levels are visually distinguishable; no garbled escape codes in files/pipes.

---

## 5. Proposed API after this milestone

```ts
import { customLog, customLogConfig } from "@meadown/logger"

// existing
customLog("Auth", "user logged in")
customLog.error("request failed", err)
customLog.warn("deprecated call")

// new
const total = customLog.tap(compute(), "total") // F2

customLogConfig({
  mode: "development", // existing
  breadcrumbs: 20, // F3 — ring buffer size, 0 = off
  links: true, // F1 — clickable source, "auto" by default
  color: "auto", // F4 — "auto" | true | false
})
```

All new config fields are **optional**; omitting them preserves current behavior.

---

## 6. Milestones

| Milestone | Scope               | Why this order                                                        |
| --------- | ------------------- | --------------------------------------------------------------------- |
| **M1**    | F1 clickable source | Smallest change (caller already has the data), biggest headline value |
| **M2**    | F4 colored output   | Makes the dev experience feel polished; pairs with F1                 |
| **M3**    | F2 `.tap()`         | Cheap, high-delight, shareable                                        |
| **M4**    | F3 breadcrumbs      | The "production-grade" feature; largest design surface                |

---

## 7. Definition of done (per feature)

- Zero new runtime dependencies (verified: `dependencies` block stays empty).
- Graceful fallback when terminal capabilities are absent (TTY / hyperlink / color).
- Full TypeScript types; `tsc --noEmit` clean.
- Unit tests covering the on/off gate and the fallback paths.
- README updated with a usage snippet (and a screenshot/GIF for F1 + F4).

---

## 8. Explicitly out of scope (for now)

- Log transports (files, HTTP, syslog) — would pull the project toward winston territory.
- Async/worker logging — not needed at current scale.
- Log levels with numeric thresholds — revisit after F1–F4 land if users ask.
- Any feature requiring an external package.
