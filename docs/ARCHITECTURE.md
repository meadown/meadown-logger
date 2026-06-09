# Architecture

Zero-dependency TypeScript package for Node.js. One file in, one logger out.

---

## How the source is laid out

```text
src/
  types/       shared type definitions — LogChannel
  const/       constant values only — BRANCH, SEPARATOR, MESSAGE_INDENT …
  config/      isLogAllowed — the production guard
  domain/      shared infrastructure, knows nothing about features
    caller/    getCaller — resolves file:line from the call stack
               stripBundlerUrl — strips bundler-synthetic URLs (webpack verified; others handled but unverified)
    colors/    colorize, Color type
    decorations/ OSC-8 clickable terminal links
    terminal/  isTTY — single source of truth for TTY detection
    time/      getTimeStamp
    write/     writeLog, buildContext, renderMessage, formatLocation, helpers
  features/    one folder per user-facing method
    logger/          [INFO] log function
    logger-error/    [ERROR] log function
    logger-warn/     [WARN] log function
    logger-tap/      pass-through logger — value, promise, and function paths
    logger-spy/      internal — wraps a function and logs each call's args;
                     not on the public API, used only by logger-tap
    logger-group/    grouped multi-item output block
    logger-max-lines/ collapse control — getVisibleLines / setVisibleLines
  index.ts     wires features into the public logger object
```

---

## The dependency rules

Think of the layers as a one-way street. Everything flows inward — features
know about domain, domain knows about types and constants, nothing flows back.

```text
types/    →  nothing
const/    →  nothing
config/   →  nothing
domain/   →  types, const, config
features/ →  domain only — never from another feature
index.ts  →  features only — never from domain directly
```

If a feature needs something from another feature, that thing belongs in domain.
If domain needs something from a feature, the abstraction is in the wrong place.

These aren't preferences — breaking them silently couples things that must
change independently.

**The `logger-spy` exception.** `logger-tap` imports `wrapFn` from
`logger-spy` — the one place a feature reaches into another. `logger-spy`
isn't a user-facing method (it's not wired onto the logger object); it exists
only to give the function branch of `tap` its own file instead of bloating
`createTap`. Treat it as an extension of `logger-tap`, not a peer feature —
it must never be imported from anywhere else.

---

## Two things you must not break

**The caller location rule.**

Every log line shows the file and line it came from. That works because
`getCaller()` reads a fixed position in the call stack:

```text
frame 0  Error (inside getCaller)
frame 1  getCaller
frame 2  the user-facing function  ← getCaller is called here
frame 3  user's call site          ← location shown in the log
```

`getCaller()` must be called in the user-facing function and passed down as
an argument to any helper. If you call it inside a helper instead, every log
line will point at the wrong file. There's no error — it just silently lies.

**The `isLogAllowed()` rule.**

The production guard lives in `writeLog` and `writeGroup` — the two functions
that actually call `console`. Features call those functions unconditionally.
They don't check `isLogAllowed` themselves.

One exception: `tapAsync` checks at its own entry point, before it does any
expensive work (`isTTY`, `performance.now`, cloning, body reading). For async
paths that do heavy work before reaching the write function, guard before
the pre-work — not inside the write function.

---

## Build

```sh
pnpm run build
```

Two TypeScript passes: `tsconfig.json` emits ESM to `dist/`, `tsconfig.cjs.json`
emits CommonJS to `dist/cjs/`. A small post-build script drops
`{ "type": "commonjs" }` into `dist/cjs/` so Node loads it correctly.

Consumers get both:

```json
"import":  "./dist/index.js"
"require": "./dist/cjs/index.js"
"types":   "./dist/index.d.ts"
```

---

## Imports

Relative paths, explicit `.js` extensions everywhere:

```ts
import { writeLog } from "../../domain/write/writeLog.js"
```

No path aliases, no `baseUrl`. The `.js` extension is required for Node ESM
resolution even though the source files are `.ts`.

---

## Tests

```sh
pnpm test
```

Type-checks first, then runs `test/**/*.test.mjs` with Node's built-in runner.

---

Architected and developed by [Dewan Mobashirul](https://linkedin.com/in/dewan-meadown)

MIT © [meadown](https://github.com/meadown)
