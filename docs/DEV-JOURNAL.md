# Dev Journal: @meadown/logger

Decisions that left no artifact — what was tried and removed, what failed and
why, and the rules that shape every feature. Written for future maintainers who
need to understand the constraints before changing anything.

**Who was involved:** Dewan Mobashirul (author and architect) directed every
decision. Claude (Anthropic's AI coding assistant, via Claude Code) implemented
and proposed. From entry 6 onward the conversation between Dewan and Claude
is the primary subject.

---

## 1. Zero-config — why there is no configure()

A `configure()` function was built early. It let consumers override
`isLogAllowed` and pass a `mode` type (`"development" | "production" | "both"`).
It was removed before release.

The zero-config identity is more valuable than the config surface. Every option
added is one more thing to explain, document, and support. `NODE_ENV` is the
only knob consumers need — it's already set by their runtime, their framework,
or their deploy pipeline. No init call, no options object.

**Rule:** `NODE_ENV` is the only consumer-facing env var. No `FORCE_HYPERLINK`,
no `LOG_EDITOR`, no `DEBUG`. If a feature requires the user to set an env var,
it gets removed.

---

## 2. Caller location — the constraint that shapes everything

`getCaller()` reads a fixed stack depth to resolve `file:line`. The depth is:

```
frame 0  Error (inside getCaller)
frame 1  getCaller
frame 2  the user-facing function
frame 3  the user's call site  ✓
```

Any extra function frame between the user's call and `getCaller()` shifts the
depth and points the location at the wrong file.

**Rule:** `getCaller()` is always called in the user-facing function and passed
down as an argument to any shared helper. Never resolved inside a helper.

This is why `writeLog({ …, caller })` takes caller as an argument. Why
`tapAsync(promise, label, caller)` takes caller as an argument. And why every
feature function (`log`, `logError`, `logWarn`, `tap`, `group`) calls
`getCaller()` as its first line before delegating anything.

Breaking this rule silently points every log line at the wrong file with no
error to catch it.

---

## 3. Clickable links — what doesn't work and why

The terminal link format is OSC-8: `\x1b]8;;URL\x07text\x1b]8;;\x07`.

**`:line` in the URL does not work.** It was tried twice and reverted twice:

- First attempt: `file:///path/to/file:42`. GNOME Terminal / `gio` treated
  `:42` as part of the filename and tried to open a file literally named
  `server.ts:42`. Error dialog appeared.
- Second attempt (v1.8.9): appended `:line` as an optional parameter to
  `fileUrl()`. Released, then reverted. Line navigation either broke openers
  that don't expect the suffix or didn't trigger the jump as intended.

**The line number stays in the display text only.** The URL is a plain
`file://` path with no suffix. This is the correct and final format — do not
attempt `:line` again.

VS Code deep-linking via `vscode://file/path:line:1` when
`TERM_PROGRAM === "vscode"` was also attempted. Removed — it required reading
an env var, which violates rule 1.

---

## 4. `tap` — design decisions

**One `tap`, not two.** The first proposal was a sync `tap` + a separate public
`tapAsync`. Rejected: the consumer shouldn't choose the path. One `tap` routes
internally — sync values log immediately, Promises go through the async path.

**Response cloning.** `tap` on a fetch call resolves to a `Response`, not the
data. To log the body, the body must be read — but reading it consumes it. The
caller's `Response` must stay usable. Fix: `res.clone()` in the background,
read the clone, leave the original untouched.

**Size calculation.** `Content-Length` is absent on compressed responses
(most production APIs use Brotli or gzip). Relying on the header meant size
never showed for real-world endpoints. Fix: `new TextEncoder().encode(text).length`
on the body text already read from the clone. Always available,
compression-independent.

**512 KB body limit.** Body reading is gated before cloning. Large responses
show `"(body too large to display)"` instead of buffering the whole thing.

**`isLogAllowed` in tapAsync.** Once `isLogAllowed` lived only in `writeLog`,
a production leak appeared: `tapAsync` ran `isTTY()`, `performance.now()`,
`clone()`, and `readBody()` before ever reaching `writeLog`. All that work
fired uselessly in production. Fix: `isLogAllowed()` at the top of `tapAsync`
before any expensive computation.

Rule: for async paths that do expensive work before the write function, guard
before the pre-work, not inside the write function.

**Function tap — one dispatcher, not a separate method.** Early sketches
considered a public `logger.spy(fn, label)`. Rejected for the same reason
`tapAsync` stayed internal: the consumer shouldn't have to pick the right
method for the value they're holding. `tap` already branches on promise vs.
plain value; branching on function is one more case in the same dispatcher.
The wrapping itself lives in `logger-spy/createSpy.ts` — kept out of
`createTap` so the dispatcher stays a dispatcher, not a grab-bag. (This is
the one place a feature imports another feature — see Architecture →
dependency rules.)

**EventEmitter detection.** `logger.tap(emitter.on("error", handler), "...")`
is an easy slip — `.on()` returns the emitter, not the handler, so the tap
would log the emitter object once and never see an event fire. Rather than
ship that silent confusion, `tap` duck-types EventEmitter (`on`/`emit`/
`removeListener` all present and callable), logs a `[WARN]` that points at
the fix, and returns the emitter unchanged so the caller's code keeps running.

**Void promises log elapsed time only.** `client.set()`, `del()`, and similar
resolve to `undefined`. Logging `"SET 2ms" undefined` is noise, not signal —
`hasValue = resolved !== undefined` drops the value from the log args
entirely when there's nothing worth showing.

---

## 5. `logger.group` — four API rounds before landing

The API went through four rounds before settling.

**Round 1:** `logger.group("Server setup", item1, item2, ...)` — rest args.
Rejected: the title isn't clearly separated from the items.

**Round 2:** `logger.group({ title: "Server setup" }, ...items)` — opts object
first. Built and shipped. Then removed: `isGroupOpts` detection was fragile.
Any plain object accidentally matched. Simplified to `(title: string, ...items)`.

**Round 3:** `logger.group("Server setup", ...items)` — plain string title.
Clean, but raised the question of whether tap and group could share logic.
Conclusion: group is for display consolidation, tap is for pass-through logging.
Different purposes, they do not merge.

**Round 4:** `logger.group({ name, type?, logs })` — the final form.
`type` started as `GroupType = "info" | "warn" | "error"` with a `CHANNEL` map
translating `"info"` to `"log"`. Removed immediately: `GroupType` was just
`LogChannel` with one value renamed. The alias, the map, and the ternary were
all deleted. `type` is `LogChannel` directly — `"log" | "warn" | "error"`.

---

## 6. Architecture — layers and dependency rules

The source is organized into three layers with strict dependency rules:

```text
src/
  types/     shared type definitions (LogChannel)
  const/     zero-dependency constants (BRANCH, SEPARATOR …)
  config/    zero-dependency isLogAllowed
  domain/    shared infrastructure — no feature knowledge
  features/  one folder per user-facing method
  index.ts   imports only from features
```

**Rules:**

- `const/` and `config/` have zero imports from anywhere inside `src/`
- `domain/` imports only from `const/`, `config/`, and `types/`
- `features/` imports from `domain/` only — never from another feature
- `src/index.ts` imports only from `features/`


**Why these rules matter:** breaking them silently couples things that should
change independently. A feature importing from another feature means two features
must be updated together. Domain importing from a feature means the shared
infrastructure knows about specific product decisions.

**`isLogAllowed` ownership.** The guard lives in `writeLog` and `writeGroup` —
the functions that talk to `console`. Features call the write functions
unconditionally. The write layer decides whether to proceed.

**`createLog` does not belong in domain.** A factory that accepts `"log"` and
`"[INFO]"` as parameters carries feature-specific knowledge, even if it doesn't
hardcode the values. Each feature calls `writeLog` directly with its own channel
and tag. No shared factory, no parameters to pass down.

**`TAG_COLOR` belongs in `domain/write`, not `const/`.** It imports `Color`
from `domain/colors`. Putting it in `const/` created a `const→domain` dependency,
breaking the layer rule. Moved to `domain/write/helpers/buildContext.ts`.

---

## 7. Bundler URL stripping — keeping `file:line` honest in frameworks

When the logger is used inside a bundler-compiled environment (Next.js, Angular
CLI, Vue CLI, Turbopack), Node.js stack frames contain synthetic URLs that the
bundler injects — not the real source paths. Before this fix, the `(file:line)`
label in log output showed these raw bundler strings: `webpack-internal:///(rsc)/./src/app/page.tsx:42:5`.

**The fix:** `getCaller` delegates path recognition to a separate module,
`stripBundlerUrl`. It detects known bundler schemes, extracts the clean
relative path (e.g. `src/app/page.tsx`), and sets `file: null` so no broken
OSC-8 hyperlink is emitted — the label still shows `page.tsx:42` correctly.
Completely synthetic frames (e.g. `[turbopack-node]/dev/noop.ts`) return
`"unknown"` so they never leak a meaningless label.

**Separation of concerns.** The stripping logic sits in its own file rather
than inside `getCaller`. `getCaller` is stable stack-frame parsing. The
bundler patterns are volatile configuration — new frameworks, new schemes. The
rule: add a branch to `stripBundlerUrl.ts`; never touch `getCaller.ts` for it.

**Covered environments:**

| Scheme | Produced by |
| --- | --- |
| `webpack-internal:///[qualifier/]./…` | webpack, Next.js (webpack mode), Angular CLI, Vue CLI |
| `[project]/…` | Turbopack (Next.js `--turbo`) |
| `[anything-else]/…` | filtered as bundler-internal, shown as `unknown` |

Vite SSR and plain Node.js emit real `file://` paths — no stripping needed,
they flow through unchanged.

**`file: null` instead of a resolved absolute path.** The relative path inside
a bundler URL (`src/app/page.tsx`) has no recoverable absolute location — the
project root isn't available to the logger. Setting `file: null` disables the
OSC-8 link for these frames rather than pointing at a wrong path. The label
still shows the useful `basename:line` form.

---

## 8. What was cut and why

| Cut                                    | Reason                                             |
| -------------------------------------- | -------------------------------------------------- |
| `customLogConfig` / `mode` API         | Zero-config identity more valuable                 |
| `isDebugAllowed` / `.debug()`          | Out of v1 scope                                    |
| `FORCE_HYPERLINK` env var              | Violates zero-env rule                             |
| `LOG_EDITOR` / `vscode://` deep link   | Violates zero-env rule                             |
| Click-to-expand collapse               | Terminals can't do it                              |
| Temp file for collapsed content        | Writes to disk, privacy risk, complexity           |
| `supportsColor` / `supportsHyperlinks` | Duplicate of `isTTY`                               |
| `utils/index.ts` barrel                | Only used by one file                              |
| Source maps in tarball                 | Point at unpublished `src/`; dead weight           |
| `tapAsync` as a public API             | Consumer shouldn't choose; `tap` routes internally |
| `GroupType` alias                      | Renamed `LogChannel` with no added meaning         |
| `createLog` factory in domain          | Domain should not carry feature-specific params    |
| `:line` in `file://` URLs              | Breaks file openers; tried twice, reverted twice   |

---

Architected and developed by [Dewan Mobashirul](https://linkedin.com/in/dewan-meadown)

MIT © [meadown](https://github.com/meadown)
