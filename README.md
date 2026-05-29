# @meadown/logger

I kept writing `console.log` everywhere, then squinting at my terminal trying to
remember _which file_ a message came from — and worse, forgetting to pull those logs
out before shipping. So I made this.

It's basically `console.log` with the rough edges sanded off: every message gets a
label, a timestamp, and the file and line it came from. And it stays quiet in
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
customLog("Auth", "user logged in") // first word can be a label, if you want one

customLog.warn("This is deprecated")
customLog.error("Something went wrong")
```

You'll see something like:

```text
[INFO]  2026-05-30T10:00:00.000Z (server.ts:42) Auth user logged in
[WARN]  2026-05-30T10:00:00.000Z (server.ts:51) This is deprecated
[ERROR] 2026-05-30T10:00:00.000Z (server.ts:60) Something went wrong
```

That `(server.ts:42)` bit is the part I missed most with plain `console.log` —
no more hunting for where a message came from.

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
