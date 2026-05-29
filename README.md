# @meadown/logger

I kept writing `console.log` everywhere, then squinting at my terminal trying to
remember _which file_ a message came from — and worse, forgetting to pull those logs
out before shipping. So I made this.

It's basically `console.log` with the rough edges sanded off: every message gets a
level tag, a timestamp, and a **clickable link** to the exact file and line it came
from. And it stays quiet in production, so you can leave your logs where they are and
not worry about them.

No dependencies. No config. Import it and you're done.

## Install

```bash
npm install @meadown/logger
```

## Using it

```ts
import customLog from "@meadown/logger"

customLog("Hello world")
customLog("Auth", "user logged in") // every argument is printed as-is, like console.log

customLog.warn("This is deprecated")
customLog.error("Something went wrong")
```

You'll see something like:

```text
[INFO] 2026-05-30T10:00:00.000Z (server.ts:42)
Auth user logged in
```

Each line is tagged by level — `[INFO]`, `[WARN]`, or `[ERROR]` — followed by the
timestamp and the source location, with your arguments on the next line.

## Click to jump to the source

That `(server.ts:42)` at the end of every log isn't just text — in terminals that
support it, it's a **clickable link** that opens the exact line that wrote the log.
No more hunting for where a message came from.

It works out of the box in editors and terminals like VS Code, iTerm2, WezTerm,
Kitty, and Windows Terminal. Anywhere else, it quietly falls back to plain
`(server.ts:42)` text — nothing to configure, never any garbled output.

If your terminal supports links but isn't auto-detected, you can force them on:

```bash
FORCE_HYPERLINK=1 node app.js
```

## What about production?

Here's the nice part: you don't have to do anything. Logs show up while you're
developing and go silent in production. The only thing that flips the switch is your
`NODE_ENV`:

| `NODE_ENV`                               | Logs?  |
| ---------------------------------------- | ------ |
| not set, `development`, or anything else | shown  |
| `production`                             | silent |

So leave your logs in the code. Once you ship with `NODE_ENV=production`, they just
quietly step aside.

## License

MIT © Dewan Mobashirul
