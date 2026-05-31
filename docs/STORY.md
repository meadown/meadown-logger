# The Story: Why @meadown/logger Exists

---

## The problem

Every project I started, I wrote the same function.

```ts
function customLog(...args) {
  if (process.env.NODE_ENV !== "production") {
    console.log("[LOG]", ...args)
  }
}
```

`Copy`  ->  `Paste`  ->  `Rename`. Every single project.

And it never really worked. I'd ship and realize my logs were still running in
production because I forgot to wrap something, or used `console.log` directly
out of habit, or added a new file and didn't import my helper. Before every
release I'd grep the codebase for stray logs. It was embarrassing. It was manual.
It was exactly the kind of problem software is supposed to solve.

The other thing that drove me crazy: debugging late at night, terminal full of
output, something clearly wrong, but no idea which file it came from. Which
line? I'd scan every log call in the project hunting the one that produced it.
Ten minutes gone. Every time.

Three problems. Same root cause. No good solution.

---

## What I looked at first

I didn't want to build something that already existed, so I looked.

Winston was powerful but completely wrong for what I needed. Config files,
transports, log levels. I didn't need logging infrastructure. I needed a
smarter `console.log`.

Pino is fast and great for production systems, but structured JSON output is
the opposite of useful when you're just trying to figure out what your code is
doing in a terminal.

Debug was closer: namespaced, env-var controlled. But no automatic production
handling, no source location, no colors.

Consola had pretty output but still needed config and still didn't tell me
where a log came from.

None of them solved the thing I actually cared about: log freely in development,
forget about it in production, and always know exactly where the log came from.

That last part kept nagging at me. Browser devtools show you the file and line
next to every `console.log`. Your terminal doesn't. That gap is real, and nobody
was filling it simply.

---

## How I designed it

I started with four things I wasn't willing to compromise on:

1. **One import.** Not a factory, not a config file. `import logger from` and go.
2. **Automatic production handling.** Read `NODE_ENV`. If it's `production`, do nothing. I never want to think about this again.
3. **Always show where the log came from.** File and line, every time, automatically.
4. **Zero dependencies.** I was tired of packages that pulled in fifty others.

The hardest part was the source location. Reading the call stack is fragile.
Every extra function frame shifts the depth and points at the wrong file. Getting
it right meant a constraint that shaped the whole architecture: the stack is
always read in the user-facing function and passed down. Never resolved inside a
helper. That one rule is why the location is correct no matter how you call it:
regular function, arrow function, async, class method, callback.

The `tap` idea came later, from a specific frustration:

```ts
const user = await getUser(id)
console.log("user:", user)
return user
```

Two lines every time. I wanted one. `tap` came from that: log it, give it back,
don't restructure anything. And when I realised I could `tap` a `fetch` promise
and automatically get timing, HTTP status, response size, and the actual body
back, that became the feature I was most excited about.

---

## Building it

I started simple: a function that reads `NODE_ENV`, logs with a timestamp, and
parses the call stack for the source location.

Then came the visual structure: color-coded level tags, the tree layout, the
clickable OSC-8 link so you can jump straight to the exact line in the file. Each piece came
from a specific frustration with plain `console.log`.

The internal structure is feature-based, each concern in its own folder:

```
src/
  core/          the log pipeline
  tap/           logger.tap + async timing logic
  colors/        ANSI color palette
  decorations/   clickable source links
  caller/        stack -> file:line
  time/          short local timestamp
  terminal/      single isTTY check
  constants.ts   all layout values in one place
```

Zero runtime dependencies. Everything is Node built-ins: `node:util` for
formatting, `node:perf_hooks` for timing, `node:url` for safe file URLs.

The `tap` async path was the trickiest part. It had to be fire-and-forget
(return the original promise immediately, never block the caller), clone the
response body so the original stays readable, and still log everything once the
promise settles. All without adding a stack frame that would break the source
location. It took a few iterations to get right.

---

## What shipped

It works with both `import` and `require` without any consumer config. Full
TypeScript types are included, no `@types` package needed. There are 29 tests
covering the async tap path, production handling, circular objects, and source
location accuracy across every call context. I also wrote a SECURITY.md because
I wanted a package I could point a security reviewer at without embarrassment.

It's 17 kB on npm. Nothing writes to disk. Nothing opens a network connection.
No install effects of any kind.

---

## What changed along the way

Building anything means being wrong about things first. Here's what got cut or
corrected:

**A configuration API.** I built `customLogConfig({ mode, env })`. Then removed
it. Zero-config means zero config. `NODE_ENV` is the only knob a consumer needs.

**Env var feature flags.** Tried `FORCE_HYPERLINK` and `LOG_EDITOR` to make
clickable links smarter. Removed both. Every feature has to work without the
user setting anything.

**Click-to-expand collapse.** Wanted browser-DevTools-style collapsible logs.
Terminals don't support that. Dropped the idea, kept `maxLines` as a simple
opt-in cap instead.

**Source maps in the tarball.** The first published builds shipped 22 `.map`
files pointing at unpublished source. Caught in an audit. Removed.

**Two duplicate isTTY functions.** `supportsColor` and `supportsHyperlinks`
were byte-for-byte identical. Consolidated into one.

The package today is smaller and simpler than every earlier version. Most
iterations removed something rather than added it.

---

## The promise

This package does one thing well: it makes development logging as useful as it
can be, with zero friction and zero dependencies.

It's not trying to compete with Winston or Pino. Those tools solve a real
problem, just not the one I had. I didn't need transports or structured JSON
or log level configuration. I needed something that felt like `console.log`,
worked instantly, and got out of the way in production. That's a narrower job,
and doing it well meant not adding everything else. A production-grade logger
built on this foundation is a possible future direction, but it would be a
different tool with different tradeoffs. This one knows what it is.

---

## A note on how this was built

The ideas, decisions, and direction are mine. The pain point is real. I actually
wrote that wrapper in every project.

I used AI (Claude) as a development partner throughout the build. It wrote code,
caught bugs, ran audits, and pushed back when a design was wrong. Every
significant decision about what to cut, how to position it, when to say no to a
feature was mine. The AI didn't invent the product. It helped me build it
faster and think through tradeoffs more carefully than I would have alone.

The craft is in the decisions, not the keystrokes.

---

## What this project actually demonstrates

A logger sounds small. What went into building it isn't.

I parsed call stacks to extract file and line numbers at the right frame depth.
I implemented OSC-8 terminal hyperlinks so logs become clickable. I built an
async `tap` that captures the call site synchronously before an `await` because
if you do it after, the location points at the wrong file. I cloned `Response`
objects so the caller's body stays readable while we log ours in the background.
I used `node:perf_hooks` for monotonic timing, `TextEncoder` for byte-accurate
response sizes, and `node:util`'s `formatWithOptions` so objects render exactly
like `console.log`, colors and all.

None of that is gluing libraries together. It's understanding the platform and
making deliberate choices.

Beyond the code: I wrote a PRD, defined a roadmap with explicit phases and
tradeoffs, designed the terminal output as a UX problem not just an engineering
one, published with dual ESM/CJS output and signed provenance, wrote a security
policy, and documented every significant decision that got made or reversed.

---

## The strongest way to describe this project

I found a pain point I kept hitting, wrote a PRD, and built a solution from
scratch. The implementation touched Node.js internals: call-stack introspection,
terminal escape sequences, async response cloning, the Fetch API. I designed
the terminal output as a UX problem, not just an engineering one. I published
it with dual ESM/CJS output and signed provenance, wrote the documentation, and
iterated on it based on real usage. I used AI to move faster and think through
tradeoffs more carefully, but every product and architectural decision was mine.

**What I gained from building this:**

| Experience           | How I applied it                                                                    |
| -------------------- | ----------------------------------------------------------------------------------- |
| Product thinking     | Wrote a PRD, defined a phased roadmap, made explicit tradeoffs                      |
| API design           | Designed `logger.tap(fetch(...))` one line, transparent, zero friction              |
| Node.js platform     | Stack introspection, OSC-8 terminal escapes, Fetch cloning, perf_hooks, TextEncoder |
| TypeScript           | Typed from scratch, dual ESM/CJS output, full type exports, no `@types` needed      |
| Developer experience | Terminal UI, color system, tree layout, clickable source links, readable timestamps |
| Shipping             | Published to npm, semantic versioning, automated releases, signed provenance        |
| CI/CD                | GitHub Actions pipeline: automated test, build, release, and npm publish on tag     |
| Documentation        | README, SECURITY.md, ROADMAP.md, STORY.md all written and public                    |
| Testing              | 29 tests async paths, location accuracy, circular objects, edge cases               |
| Security             | Zero deps, no disk/network access, trust boundary documented, advisory process      |
| AI fluency           | Used Claude as an implementation partner, owned all product and technical decisions |

---

Architected and developed by [Dewan Mobashirul](https://linkedin.com/in/dewan-meadown)

MIT © [meadown](https://github.com/meadown)
