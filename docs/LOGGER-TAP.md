# Implementation Plan — `logger.tap()`

> Inline "log a value and keep going" helper. Status: planned.
> Companion to [PRD.md](./PRD.md).

## Goal

Add `logger.tap(value, label?)` that **logs a value and returns it unchanged**, so
you can drop it into any expression without restructuring code:

```ts
const user = logger.tap(await getUser(id), "user")
// logs the value, `user` is exactly what getUser returned
```

The **source location must point at the caller's file**, not at any internal helper:

```text
[TAP]
├── user { id: 1, name: 'Alice' }
└── 05-30 05:30:00 AM - (user.ts:12)   ← the user's file, not tap's
```

## The one constraint that drives the whole design

`getCaller()` reads a **fixed depth** in the call stack. Every extra function frame
between the user's call and `getCaller()` shifts that location to the wrong file.

So the rule is:

> **`getCaller()` is called only in the user-facing function** (the log closure or
> `tap`), never inside a shared helper. The resolved `Caller` is then **passed down**.

```
user → logClosure → getCaller        ✅ correct depth
user → tap        → getCaller        ✅ correct depth (same depth)
user → tap → writeLog → getCaller    ❌ one frame too deep → wrong file
```

This is why the shared writer takes a `caller` argument instead of resolving it.

## Architecture

Keep the flat `utils/` layout (no new top-level folder):

```
src/
  index.ts                     # wires logger.tap onto the logger object
  utils/
    writeLog.ts                # NEW: shared render + write (caller passed in)
    createLog.ts               # refactored to delegate to writeLog
    createTap.ts               # NEW: the tap factory
    getCaller.ts  getTimeStamp.ts  color.ts  link.ts  index.ts
```

### `utils/writeLog.ts` (shared, never touches the stack)

Owns everything the current `createLog` closure does _except_ resolving the caller:
tag/timestamp/location coloring, the `├──`/`└──` tree, message rendering, collapse,
and the final `console[channel](...)` call.

```ts
export function writeLog(opts: {
  channel: "log" | "warn" | "error"
  tag: string // "[INFO]" | "[WARN]" | "[ERROR]" | "[TAP]"
  args: unknown[]
  caller: Caller // resolved by the caller — NOT here
}): void
```

It reuses the existing `renderMessage()` (`util.formatWithOptions`) for the message —
**do not** introduce `JSON.stringify`. `formatWithOptions` already handles circular
refs (`[Circular]`), Errors, functions, symbols, `Map`/`Set`, and colors, and keeps
tap output identical to normal log output.

### `utils/createLog.ts` (refactored)

```ts
export default function createLog(channel, tag) {
  return (...args: unknown[]): void => {
    if (!isLogAllowed()) return
    const caller = getCaller() // depth-correct
    writeLog({ channel, tag, args, caller })
  }
}
```

### `utils/createTap.ts` (new)

```ts
export default function createTap(): <T>(value: T, label?: string) => T {
  return <T>(value: T, label?: string): T => {
    if (isLogAllowed()) {
      const caller = getCaller() // depth-correct (same depth as a log)
      writeLog({
        channel: "log",
        tag: "[TAP]",
        args: label === undefined ? [value] : [label, value],
        caller,
      })
    }
    return value // always, even in production
  }
}
```

## API

```ts
export interface LogFN {
  (...args: unknown[]): void
  error(...args: unknown[]): void
  warn(...args: unknown[]): void
  tap<T>(value: T, label?: string): T
  maxLines: number
}
```

Wire it in `src/index.ts`:

```ts
import createTap from "./utils/createTap.js"

const logger = Object.assign(createLog("log", "[INFO]"), {
  error: createLog("error", "[ERROR]"),
  warn: createLog("warn", "[WARN]"),
  tap: createTap(),
})
// (maxLines stays a live getter/setter via Object.defineProperty)
```

## Output format decision

Reuse the existing single-`├──`-branch layout (label and value go through
`formatWithOptions` together), so tap output is consistent with everything else:

```text
[TAP]
├── user { id: 1, name: 'Alice' }
└── 05-30 05:30:00 AM - (user.ts:12)
```

Putting `label` and `value` on **separate** `├──` branches would require teaching the
writer to render each arg as its own branch — deferred as an optional enhancement,
not part of v1.

## Tests (`test/tap.test.mjs`)

- returns the **exact same value** (identity, incl. objects/arrays by reference)
- logs the label and the value when a label is given
- works **without** a label
- **silent in production** but still returns the value
- caller location points at the **calling file** (the test file)
- a **circular** object does not crash (relies on `formatWithOptions`)
- `[TAP]` tag is present

## Out of scope (v1)

- Two-branch (label / value) layout.
- A separate `formatValue` module / `JSON.stringify` path.
- Any new config surface (no env vars; consistent with the project's rules).
