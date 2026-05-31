# Roadmap: @meadown/logger

> Where the package is, where it's going, and why.
> This is a living document. Priorities shift based on what developers actually find useful.

---

## What it is

A development logger. Not a production ops tool, just a logger that makes your
terminal useful while you're writing code. Zero dependencies, one import, and
it tells you exactly where every log came from.

The north star: **a developer should be able to drop this into any project and
immediately get more useful output than `console.log`, without reading docs or
writing config.**

---

## What's shipped

The core experience is done:

- **Zero dependencies.** Nothing installs with it, ever.
- **Clickable source links.** Every log line is a clickable link that opens
  the source file. The line number is always visible in the label.
- **Color-coded levels.** `[INFO]` deep cyan, `[WARN]` yellow, `[ERROR]` red.
  Degrades gracefully to plain text when piped.
- **Tree layout.** Clean, scannable output with a consistent structure.
- **`logger.tap()`** Drop it into any expression, log the value, get it back
  unchanged. Works on plain values and on fetch promises.
- **API response logging.** Tap a fetch and see timing, status, size, and the
  actual response body. Without opening DevTools.
- **`maxLines`.** Cap long output so a 100-item array doesn't bury your terminal.
- **Dual ESM + CJS.** Works with `import` and `require` without config.

---

## The killer demo

This is the feature that makes people share screenshots:

```ts
const user = await logger.tap(
  fetch("https://api.example.com/users/1"),
  "GET /users/1",
)
```

Output in your terminal:

```text
[TAP]
├── GET /users/1
│
│  response:
│  ├── time:   65ms
│  ├── status: 200 OK
│  └── size:   848 B
│
│  body:
│  ├── id:     1
│  ├── name:   Leanne Graham
│  └── email:  Sincere@april.biz
│
└── ◷ 07:54:26 PM - (api.ts:12)
```

One line of code. You can immediately see: was it successful? How long did it
take? What came back? Without touching DevTools.

---

## Phase 1: shipped ✅

### Pretty status badges

Status codes are colored by outcome:

```text
200 OK           green
201 Created      green
304              cyan
404 Not Found    yellow
500 Server Error red
```

### Slow request highlighting

Time is colored automatically:

```text
65ms    green   (fast)
1.2s    yellow  (slow)
5.8s    red     (very slow)
```

No threshold to configure.

---

## Phase 2: deeper response detail

Once Phase 1 is solid and shipped, the next layer:

- **Request size.** How big was what you sent? (Requires wrapping the fetch,
  not just tapping the response.)
- **Expanded body display.** Key-by-key layout for JSON objects, cleaner than
  the current inspect output.
- **Response header inspection.** Surface content-type, cache-control, and
  other useful headers.

---

## Phase 3: network timing breakdown

The full browser-network-panel experience:

```text
Prepare         10ms
DNS Lookup      56ms
TCP Handshake    9ms
SSL Handshake   90ms
Waiting (TTFB)  2.7s
Download         3ms
```

This requires intercepting at the Node HTTP client level, not just reading
the `Response` object. The plan is an opt-in `logger.tapFetch(() => fetch(...))`
wrapper that hooks into undici's diagnostic channels for the per-phase timings.

This is technically impressive but won't drive adoption the way Phase 1 will.
A glowing red `5.8s` and a colored `500 Server Error` badge are what
developers share. The timing breakdown is for when they want to dig deeper.

---

## What this logger is not

This is a **development** logger. It's not:

- A production logging system with transports and log rotation.
- A structured logger that outputs JSON for ingestion by Datadog/Loki.
- A logger with configurable levels, filters, or sampling.

Those are legitimate tools for different jobs. A production logger built on
this foundation is a future direction, different product, different constraints.

This one is for the hours you spend in the terminal, moving fast, needing to
know what your code is doing right now.

---

## What gets cut

Every time something was added that felt like config, it was removed. The zero-config
identity is non-negotiable. If a feature requires the developer to set an env var
or write a config file, it doesn't ship.
