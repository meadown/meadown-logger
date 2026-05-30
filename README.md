![meadown/logger — a development-focused logger for Node.js](media/header.png)

# @meadown/logger

A **development-focused logger** for Node.js and TypeScript — built to make your
development loop faster and your terminal actually readable.

No dependencies. No config. Import it and you're done.

## Why this exists

I kept writing the same `console.log` wrapper in every project. Every time.
Copy, paste, rename. And I still shipped it to production by accident. And I
still spent ten minutes staring at logs trying to figure out which file they
came from.

At some point I just built the thing I always wanted.

One import. No config. No dependencies. It shows you exactly where every log
came from, and it gets out of the way when you ship.

> The full story — the problem, the research, every design decision, and
> everything that got cut — is in [`docs/STORY.md`](docs/STORY.md).

## Features

- **Zero dependencies**
- **Development-focused** — built for the dev experience, not production ops
- **Clickable source link** — every log is a clickable link to the exact file it came from
- **API response logging** — `tap` a fetch and get timing, status, size, and body automatically
- **Color-coded levels** — `[INFO]` cyan, `[WARN]` yellow, `[ERROR]` red
- **Tree layout output** — clean, scannable structure in your terminal
- **Collapsible messages** — cap long output with `logger.maxLines`

## Install

```bash
pnpm add @meadown/logger
# or
npm install @meadown/logger
# or
yarn add @meadown/logger
```

## Using it

```ts
import logger from "@meadown/logger"

logger("Hello world")
logger("Auth", "user logged in")

logger.warn("This is deprecated")
logger.error("Something went wrong")
```

```text
[INFO]
├── Auth user logged in
└── 05-30 04:00:00 PM - (server.ts:42)
```

## API response logging

Drop `tap` into any `await` chain — you get timing, status, size, and the
actual response body. The promise flows through untouched. One line of code.

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

You can immediately see: was it successful? How long did it take? What came
back? Without opening DevTools.

![API response logging — tap a fetch and see timing, status, size, and body](media/tap-api-demo.png)

Works with plain values too — logs it, returns it, nothing changes:

```ts
const port = logger.tap(5000, "port") // port is still 5000
const user = logger.tap(await getUser(), "user") // same as without tap
```

## Clickable source link

That `(server.ts:42)` is a **clickable link** — open it and you land on the exact
line that wrote the log. Works in VS Code, iTerm2, WezTerm, Kitty, and Windows
Terminal. Degrades to plain text everywhere else.

## Color-coded levels

`[INFO]` cyan · `[WARN]` yellow · `[ERROR]` red. Timestamp and location tinted teal.
Auto-disabled when output is piped — no escape codes in your log files.

## Tree layout output

```text
[INFO]
├── Auth user logged in
└── 05-30 04:00:00 PM - (server.ts:42)
```

Level tag, message, timestamp, and location — all in a clean tree. Easy to scan,
even in a busy terminal.

## Collapsible messages

```ts
logger.maxLines = 5 // show 5 lines, then "... N more lines"
logger.maxLines = 0 // default — show everything
```

### One thing if you re-export it

```ts
// GOOD — location stays honest
export { default as logger } from "@meadown/logger"

// BAD — every log points at this file, not the real caller
export const logger = (...args) => log(...args)
```

## NODE_ENV

This logger reads `NODE_ENV` to decide when to log. By default it logs everywhere
except `production`. This is a deliberate dev-focused default — a production-grade
logger with transport, persistence, and log levels is a separate concern and a
future direction.

| `NODE_ENV`                               | Logs?  |
| ---------------------------------------- | ------ |
| not set, `development`, or anything else | shown  |
| `production`                             | silent |

## Security

Zero dependencies, no file or network access, nothing persisted.
See [SECURITY.md](https://github.com/meadown/meadown-logger/blob/main/SECURITY.md)
for the full security model.

## License

MIT © meadown
