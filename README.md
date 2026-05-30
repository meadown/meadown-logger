# @meadown/logger

I kept writing `console.log` everywhere, then squinting at my terminal trying to
remember _which file_ a message came from — and worse, forgetting to pull those logs
out before shipping. So I made this.

It's basically `console.log` with the rough edges sanded off: every message gets a
**color-coded** level tag, a timestamp, and the file and line it came from — as a
**clickable link** you can open straight from your terminal. And it stays quiet in
production, so you can leave your logs where they are and not worry about them.

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
[INFO]
├── Auth user logged in
└── 05-30 04:00:00 PM - (server.ts:42)
```

Each entry is a little tree: the level tag — `[INFO]`, `[WARN]`, or `[ERROR]` — on
top, your message hanging off a `├──` branch, and a short local timestamp
(month-day, 12-hour time) plus the source location on the `└──` branch below.
Entries are spaced apart by a blank line so they're easy to scan in a busy terminal.

### One thing if you re-export it

A lot of projects like to funnel everything through their own `lib/logger` file.
That's totally fine here — just pass the logger straight through instead of wrapping
it in a new function. The file and line are read from the call stack, so an extra
wrapper makes every log blame _that_ file instead of wherever you actually logged.

```ts
// GOOD: pass it through — the (file:line) stays honest
export { default as customLog } from "@meadown/logger"

// BAD: now every log points at this file, not the real caller
export const customLog = (...args) => log(...args)
```

## Color-coded levels

The level tag is colored so you can spot what matters at a glance — `[INFO]` in
cyan, `[WARN]` in yellow, `[ERROR]` in red. The timestamp and source location are
tinted teal, and the tree branches sit in a quiet gray, so the colored level tag is
what your eye lands on first.

Colors appear automatically when you're in a terminal. When output is piped to a
file or another program, everything prints as plain text — no stray color codes in
your log files. Nothing to configure.

## Click to open the source

That `(server.ts:42)` at the end of every log isn't just text — when you are in a
terminal, it's a **clickable link** that opens the file the log came from. No more
hunting for where a message came from, and the line number is right there in the
label.

There's nothing to configure. Links show up automatically when output goes to a
terminal, and when it's piped to a file or another program they quietly drop to
plain `(server.ts:42)` text — so your log files never get cluttered with escape
codes.

## Trimming long messages

By default you see everything you log, however long. But if a big object or a
chatty multi-line message is drowning out your terminal, you can cap how many
lines each message shows:

```ts
import customLog from "@meadown/logger"

customLog.maxLines = 5 // show the first 5 lines, then "... N more lines"
customLog.maxLines = 0 // back to the default — show everything
```

It only trims the _message_, never the tag, timestamp, or location, and the setting
applies to `customLog`, `.error`, and `.warn` alike.

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

MIT © meadown
