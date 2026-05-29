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
[INFO] 2026-05-30T10:00:00.000Z (server.ts:42)
Auth user logged in
```

Each line is tagged by level — `[INFO]`, `[WARN]`, or `[ERROR]` — followed by the
timestamp and the source location, with your arguments on the next line.

## Color-coded levels

The level tag is colored so you can spot what matters at a glance — `[INFO]` in
cyan, `[WARN]` in yellow, `[ERROR]` in red. The timestamp and location stay plain so
the color draws your eye straight to the level.

Colors appear automatically when you're in a terminal. When output is piped to a
file or another program, the tag prints as plain `[INFO]` text — no stray color
codes in your log files. Nothing to configure.

## Click to open the source

That `(server.ts:42)` at the end of every log isn't just text — when you're in a
terminal, it's a **clickable link** that opens the file the log came from. No more
hunting for where a message came from, and the line number is right there in the
label.

There's nothing to configure. Links show up automatically when output goes to a
terminal, and when it's piped to a file or another program they quietly drop to
plain `(server.ts:42)` text — so your log files never get cluttered with escape
codes.

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
