![meadown/logger — a development-focused logger for Node.js](media/header.png)

# @meadown/logger

A **development-focused logger** for Node.js and TypeScript. Built to make your
development loop faster and your terminal actually readable.

No dependencies. No config. Import it and you're done.

## Why this exists

I kept writing the same `console.log` wrapper in every project. Every time.
Copy, paste, rename. And I still shipped it to production by accident. Unconsciously I
still spent ten minutes staring at logs trying to figure out which file they
came from.

At some point I just built the thing I always wanted.

One import. No config. No dependencies. It shows you exactly where every log
came from, and it gets out of the way when you ship.

It's not trying to be Winston or Pino. No transports, no log levels, no config files.
Just a better `console.log` for the hours you spend in development. One that
tells you where things came from and disappears when you ship.

> The full story — the problem, the research, every design decision, and
> everything that got cut — is in [`docs/STORY.md`](docs/STORY.md).

## Features

- **Zero dependencies**
- **Development-focused** — built for the dev experience, not production ops
- **Clickable source link** — every log jumps straight to the file and line it came from
- **Tap logging** — log any value or promise inline without breaking the expression
- **Color-coded levels** — `[INFO]` cyan, `[WARN]` yellow, `[ERROR]` red
- **Tree layout** — clean, scannable structure in your terminal
- **Collapsible output** — cap long dumps with `logger.maxLines`

## Install

```bash
pnpm add @meadown/logger
# or
npm install @meadown/logger
# or
yarn add @meadown/logger
```

## Quick start

```ts
import logger from "@meadown/logger"

logger("server started", { port: 3000 })
```

```text
[INFO]
├── server started { port: 3000 }
└── 05-30 04:00:00 PM - (server.ts:5)
```

Works out of the box. Set `NODE_ENV=production` when you ship and the logs
disappear — no wrappers, no cleanup, nothing to remember.

### Single shared import

Create one module in your project and re-export from there. One place to set
options, one place to change if you ever need to.

```ts
// lib/logger.ts
import logger from "@meadown/logger"

logger.maxLines = 10 // configure once, applies everywhere

export default logger
```

```ts
// anywhere else in your project
import logger from "@/lib/logger"
```

Use a direct re-export — not a wrapper function. A wrapper breaks the
`(file:line)` link on every log.

```ts
// GOOD — location stays honest
export { default as logger } from "@meadown/logger"

// BAD — every log points at this file, not the real caller
export const logger = (...args) => log(...args)
```

## API

```text
┌─────────────────┬─────────────┬──────────────────────────┬───────────────────────────┐
│     Method      │     Tag     │          Params          │          Purpose          │
├─────────────────┼─────────────┼──────────────────────────┼───────────────────────────┤
│ logger()        │ [INFO]      │ ...args: unknown[]       │ general info              │
├─────────────────┼─────────────┼──────────────────────────┼───────────────────────────┤
│ logger.warn()   │ [WARN]      │ ...args: unknown[]       │ something needs attention │
├─────────────────┼─────────────┼──────────────────────────┼───────────────────────────┤
│ logger.error()  │ [ERROR]     │ ...args: unknown[]       │ something broke           │
├─────────────────┼─────────────┼──────────────────────────┼───────────────────────────┤
│ logger.tap()    │ [TAP]       │ value: T, label?: string │ log value, returns as-is  │
├─────────────────┼─────────────┼──────────────────────────┼───────────────────────────┤
│ logger.group()  │ [name]      │ { name: string,          │ consolidate related       │
│                 │             │   type?: LogChannel,     │ items under a label       │
│                 │             │   logs: unknown[] }      │                           │
├─────────────────┼─────────────┼──────────────────────────┼───────────────────────────┤
│ logger.maxLines │ —           │ number                   │ cap output at N lines     │
└─────────────────┴─────────────┴──────────────────────────┴───────────────────────────┘
```

Every tag is self-describing. You scan the logs and immediately know what each
entry is without reading the message. That's the design principle holding the
whole API together.

### `logger()`

Your everyday log. Pass it anything — strings, objects, errors, whatever.
Works exactly like `console.log`, just prettier.

```ts
logger("server started")
logger("user logged in", { userId: 42, role: "admin" })
```

```text
[INFO]
├── user logged in { userId: 42, role: 'admin' }
└── 05-30 04:00:00 PM - (server.ts:12)
```

### `logger.tap()`

The one you reach for when you want to see what's inside something without
stopping to assign it to a variable first. Logs it and gives it straight back.

```ts
const port = logger.tap(5000, "port")
server.listen(logger.tap(port, "port"))
```

#### API response logging

Drop it into any `await` and you get timing, status, size, and the response
body — without touching your code at all.

```ts
const user = await logger.tap(
  fetch("https://api.example.com/users/1"),
  "GET /users/1",
)
// user is the real Response — your code doesn't change at all
```

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
│  ├── id:    1
│  ├── name:  Leanne Graham
│  └── email: Sincere@april.biz
│
└── 05-30 07:54:26 PM - (api.ts:12)
```

Was it successful? How long did it take? What came back? All there, without
opening DevTools.

![API response logging: tap a fetch and see timing, status, size, and body](media/tap-api-demo.png)

#### Tap any value

Not just fetch. Any value, any expression. Logged and returned as-is.

```ts
// numbers, strings, objects — logged and returned as-is
logger.tap(port, "port")
logger.tap(process.env.NODE_ENV, "env")
logger.tap(config, "loaded config")
```

```ts
// promises — flows through, timing logged when it settles
const user = await logger.tap(getUser(), "getUser")
const config = await logger.tap(loadConfig(), "loadConfig")
```

```ts
// inline — no temp variable needed
server.listen(logger.tap(port, "port"))
```

If it's a promise, timing is logged once it settles. If it resolves to a
`Response`, you also get status and size.

### `logger.group()`

Got a handful of related things to log at once? Group them. One block, one
timestamp, one place to look.

```ts
logger.group({
  name: "Server setup",
  logs: [
    `Running on port ${port}`,
    `Environment: ${env}`,
    `API: http://localhost:${port}/api`,
  ],
})
```

```text
[SERVER SETUP]
├── Running on port 5000
├── Environment: development
├── API: http://localhost:5000/api
└── 05-30 04:00:00 PM - (server.ts:23)
```

Use `type` to set the channel and tag color. Defaults to `"log"` (cyan, stdout).

```ts
logger.group({
  name: "Validation failed",
  type: "error", // red, stderr
  logs: ["email invalid", "password too short"],
})

logger.group({
  name: "Config warnings",
  type: "warn", // yellow, stderr
  logs: ["deprecated key found", "missing optional field"],
})
```

`logs` takes anything — strings, objects, arrays, errors. Each renders exactly
as `console.log` would.

### `logger.error()`

Red tag, goes to `stderr`. Pass an `Error` and you get the stack too.

```ts
logger.error("database connection failed", new Error("ECONNREFUSED"))
```

```text
[ERROR]
├── database connection failed Error: ECONNREFUSED
│       at Object.<anonymous> (server.ts:14:18)
└── 05-30 04:00:00 PM - (server.ts:14)
```

### `logger.warn()`

Yellow tag, `stderr`. For the things that aren't broken yet.

```ts
logger.warn("disk usage above 80%")
logger.warn("deprecated config key", { key: "timeout", use: "timeoutMs" })
```

```text
[WARN]
├── disk usage above 80%
└── 05-30 04:00:00 PM - (monitor.ts:8)
```

### `logger.maxLines`

Got a massive object dumping 200 lines? Set this and it cuts off after N lines
with a count of what's hidden. Set back to `0` to show everything again.

```ts
logger.maxLines = 5 // show 5 lines, then "... N more lines"
logger.maxLines = 0 // default — show everything
```

## Production

Set `NODE_ENV=production` and everything goes silent. No wrapper calls, no
grep before release, no accidental logs in prod.

| `NODE_ENV`                               | Logs?      |
| ---------------------------------------- | ---------- |
| not set, `development`, or anything else | shown      |
| `production`                             | suppressed |

## Security

Zero dependencies, no file or network access, nothing persisted.
See [SECURITY.md](https://github.com/meadown/meadown-logger/blob/main/SECURITY.md) for the full security model.

## License

Architected and developed by [Dewan Mobashirul](https://linkedin.com/in/dewan-meadown)

MIT © [meadown](https://github.com/meadown)
