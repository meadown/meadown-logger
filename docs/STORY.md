# The Story — Why @meadown/logger Exists

---

## Problem

Every project I started, I wrote the same function.

```ts
function customLog(...args) {
  if (process.env.NODE_ENV !== "production") {
    console.log("[LOG]", ...args)
  }
}
```

Copy. Paste. Rename. Repeat. Every single project.

And it never worked the way I wanted. I'd ship code and realise my logs were
still running in production — because I forgot to wrap them, or I used
`console.log` directly by accident, or I added a new file and didn't import my
helper. I'd grep through the codebase before every release looking for stray
`console.log` calls. It was embarrassing and it was manual and it was exactly
the kind of problem software should solve.

The other thing that drove me crazy: I'd be debugging late at night, terminal
full of logs, and I'd see something wrong — but I had no idea _where_ it came
from. Which file? Which line? I'd scan every log call in the codebase, hunting
the one that produced that output. Ten minutes wasted every time.

**The problems:**

- Writing the same custom log wrapper in every project.
- Forgetting to strip logs before production.
- No idea which file a log message came from.

---

## Research

I looked at what existed.

`winston` — powerful, but heavyweight. Config files, transports, log levels to
tune. I didn't need a logging infrastructure. I needed a smarter `console.log`.

`pino` — fast, great for production. Structured JSON output. But that's the
opposite of what I wanted for development. JSON logs are unreadable when you're
just trying to debug.

`debug` — namespaced, env-var controlled. Closer, but still no automatic
production silencing, no source location, no colors.

`consola` — pretty output, nice. But still needed config. Still didn't tell
me where the log came from.

None of them solved my actual problem: I want to log freely during development,
and I want it to just work in production without me thinking about it. And I
want to know, always, exactly where that log came from.

The source location thing kept coming back to me. Browser devtools show you
the file and line next to every `console.log`. Your terminal doesn't. That's
a real gap, and nobody was filling it simply.

---

## Design

I knew what I wanted:

1. **One import.** Not a factory, not a config file. `import logger from` and
   go.
2. **Automatic production silence.** Read `NODE_ENV`. If it's `production`,
   do nothing. I never want to think about this again.
3. **Always know where the log came from.** Show the file and line, every time,
   automatically. Make it clickable so I can jump there instantly.
4. **Zero dependencies.** I was tired of packages that dragged in fifty other
   packages. This should be pure Node.

The hardest design question was the source location. Reading the call stack is
fragile — you have to hit the right frame depth, and every wrapper function
adds a frame and breaks it. I spent time getting this right: the stack is always
read in the user-facing function, never inside a shared helper. That constraint
shaped the whole internal architecture.

The `tap` idea came later. I kept writing:

```ts
const user = await getUser(id)
console.log("user:", user) // log it
return user // then return it
```

Two lines every time. I wanted one. `tap` came from that frustration — log it
and give it back, inline, without restructuring the code. When I realised I
could `tap` a `fetch` promise and get timing, status, size, and the actual body
back automatically — that became the feature I was most excited about.

---

## Build

I started with the simplest thing: a function that reads `NODE_ENV`, logs with
a timestamp, and parses the call stack for the source location.

Then I added the visual structure — the color-coded level tags, the tree layout,
the clickable OSC-8 link so the location is actually navigable. Each piece
came from a specific frustration with plain `console.log`.

The internal architecture is feature-based:

```
src/
  core/      — the log pipeline
  tap/       — logger.tap + the async timing logic
  colors/    — ANSI color palette
  decorations/ — clickable OSC-8 source links
  caller/    — stack → (file:line)
  time/      — short local timestamp
  terminal/  — single isTTY check
  constants.ts — all layout values in one place
```

Zero runtime dependencies. Everything is Node built-ins: `node:util` for
formatting, `node:perf_hooks` for timing, `node:url` for building safe file
URLs.

The `tap` async path was the trickiest build. A fire-and-forget background
logger that clones the response body so the caller's `Response` stays
consumable — all without adding a frame to the call stack that would break
the source location. Getting that right took several iterations.

---

## Ship

The package ships with:

- **ESM and CJS** — works with `import` and `require`, no consumer config.
- **Full TypeScript types** — no `@types` package needed.
- **`SECURITY.md`** — because I wanted the package to be something I could
  point a security reviewer at without embarrassment.
- **A real test suite** — 29 tests covering every path including async tap,
  production silence, circular objects, and source location accuracy.

It's 17 kB on npm. No install side effects. Nothing writes to disk. Nothing
opens a network connection (the package itself — not your app).

---

## Feedback

The questions that shaped the final design:

- _"What if I re-export it through my own lib/logger?"_ — discovered that any
  wrapper function breaks the source location. Documented the right way to do
  it. Became a prominent README note.
- _"Does `tap` on a promise block my code?"_ — fire-and-forget was the right
  answer. Return the original promise immediately, log in the background.
- _"What about production?"_ — it was framed as "shuts up in production" early
  on. That framing was wrong. Reframed as "development-focused by default."
  A production-grade logger is a different product.
- _"Does size show even when the server compresses the response?"_ — `Content-Length`
  is absent on compressed responses. Fixed by computing size from the body text
  we already read, not the header.

---

## Iteration

Things that got cut, changed, or corrected along the way:

- **`customLogConfig`** — a configuration API. Removed. The zero-config
  identity is more valuable than a config surface.
- **`FORCE_HYPERLINK` / `LOG_EDITOR` env vars** — attempts to make the
  clickable link smarter. Removed. `NODE_ENV` is the only env var a consumer
  should need to know about.
- **Collapse with click-to-expand** — wanted browser-DevTools-style collapsible
  logs. Terminals can't do that. Dropped the idea, kept `maxLines` as a simple
  opt-in cap.
- **`tap` + `tapAsync` split** — debated separating them. Kept one `tap` that
  internally routes promises to the async path. The consumer never chooses.
- **Source maps shipped in the tarball** — the first builds shipped 22 `.map`
  files pointing at unpublished source. Caught in audit. Removed.
- **`supportsColor` + `supportsHyperlinks`** — two identical functions checking
  `stream.isTTY`. Consolidated into one `terminal/isTTY.ts`.

The package today is smaller and simpler than every early version. Each
iteration removed something rather than adding it.

---

## The version 1 promise

This package does one thing well: it makes development logging as useful as it
can be with zero friction and zero dependencies.

If you reach for a production logger with transports, structured output, and
log levels — that's a different tool for a different job. This one is for the
part of your day when you're in the terminal, moving fast, and you need to know
what your code is doing right now.
