# Marketing & Positioning — @meadown/logger

> How we make this package stand out, get recommended, and earn retention.
> Status: working notes · Owner: Dewan Meadown · Last updated: 2026-05-30
> Companion to [PRD.md](./PRD.md).

---

## 1. The one-line pitch

> **The logger that links every line back to the exact source — click and you're there.**

Everything else is a supporting act. One hook, one sentence, repeated everywhere
(npm description, GitHub tagline, README H1, social posts).

**What we are NOT:** "a logger with 4 features." Feature lists don't travel; a single
unmistakable hook does.

---

## 2. Honest feature assessment

The four planned features are necessary, but they do not carry equal marketing weight.
Be clear-eyed about which is loud and which is table stakes.

| Feature                          | Role            | Loudness                 | Why                                                                                                                                                            |
| -------------------------------- | --------------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **F1 — Clickable source links**  | **Headline** ⭐ | 🔊🔊🔊 Loud / unique     | Almost no logger does clickable jump-to-source out of the box. Demoable in a GIF, novel, builds on what we already capture. This is the package's identity.    |
| **F2 — `.tap()` inline logging** | Delight         | 🔊 Shareable, not unique | Known pattern (RxJS `tap`, Ramda, Ruby `tap`). Good for a tweet, won't make anyone switch. Supporting act.                                                     |
| **F3 — Error breadcrumbs**       | Retention       | 🔊 Sticky, not loud      | Earns _keeping_ the package after an incident, not _discovering_ it. Reads as "Sentry-but-local."                                                              |
| **F4 — Colored output**          | Table stakes    | · Not a differentiator   | Every logger has it (`consola`, `signale`, `pino-pretty`). Its absence would look unfinished; its presence wins nothing. Never pitch as a reason to choose us. |

```
Loud / unique:      F1  ████████████
Delightful:         F2  ██████
Sticky (retention): F3  █████
Table stakes:       F4  ██
```

**Verdict:** the four features make the package _credible and polished_. Only **F1**
makes it _loud_. F1 carries the attention; F2–F4 make us look complete.

---

## 3. The crowded shelf (be honest about it)

Logging is a saturated space: `pino`, `winston`, `consola`, `debug`, `signale`,
`loglevel`. "Viral" almost never happens for loggers. They spread by being **quietly
excellent at one thing** and showing up in tutorials, boilerplates, and recommendations.

Realistic goal: **useful + memorable enough to get recommended** — not literal virality.

Our wedge against the incumbents:

- **Zero dependencies** — a real, statable advantage over winston.
- **Zero config** — works on the first import; no setup ceremony.
- **The F1 hook** — the thing none of them lead with.

---

## 4. Positioning: reframe everything around F1

Do **not** market a feature list. Market the hook, then let the rest be "and it also…":

> **@meadown/logger** — `console.log`, but it tells you exactly where it came from
> (click to jump to the line) and shuts up in production.
>
> Zero dependencies. Zero config. TypeScript-first.
> _Also:_ inline `.tap()` logging, error breadcrumbs, colored output.

F2–F4 are listed once, briefly, as "also." They are never the headline.

---

## 5. The package page is the whole funnel

Most people decide in ~10 seconds on the npm/GitHub page. Priorities:

- [ ] **A GIF/screenshot of F1 + F4** — clicking a logged line and jumping to source.
      This single asset moves adoption more than any paragraph.
- [ ] **3-line quickstart above the fold.**
- [ ] **Comparison table** (us vs winston vs pino vs raw console) — honest about what we _don't_ do.
- [ ] **Badges:** npm version, bundle size (bundlephobia), **zero-deps**, TypeScript, CI.
- [ ] **Tests + CI badge** → signals "safe to depend on."

---

## 6. Trust signals (adoption blockers if missing)

- **Tests.** Currently none. Nobody adopts an untested logger for production. Add a
  small suite (even ~20 cases) covering the on/off gate and terminal-capability fallbacks.
- **Full TypeScript types.** ✅ already shipped.
- **Tiny bundle size**, **ESM + CJS dual output** (currently ESM-only — shipping CJS too
  widens the audience significantly).
- **SemVer + changelog.** ✅ semantic-release is already configured.

---

## 7. Distribution — where "loud" actually comes from

Packages spread through _content_, not the package itself.

- **Origin-story post:** "I was tired of `console.log` not telling me where logs came
  from, so I built X." Origin stories travel on r/node, r/javascript, Hacker News, dev.to.
- **Post the F1 GIF** on X / Bluesky / LinkedIn.
- **Get it into a starter template / boilerplate.**
- **Answer relevant Stack Overflow / Reddit questions** where it genuinely fits.
- **Submit to `awesome-nodejs`** and similar lists.

---

## 8. Candidate second hook (optional F5)

If we want a second talking point beyond F1, it must be _genuinely rare_ and still
zero-dep. Strongest candidates:

- **`customLog.once(...)`** — dedupes repeated logs in a loop. A real pain almost
  nobody solves cleanly. High utility, easy to demo.
- **Stray-log detection** — a lint/build helper that finds every `customLog` left in
  the codebase. Owning "we help you not ship stray logs" is a fresh angle devs fear.
- **First-class ESM + CJS + browser "it just works"** — surprisingly rare and loved.

Recommendation: ship F1 loudly first. Add **`once()`** as the second beat only if F1
lands and we want more surface area.

---

## 9. Action checklist

**Now (carry the hook):**

- [ ] Rewrite npm description + GitHub tagline to the §1 one-liner.
- [ ] Ship F1 with flawless fallback (see PRD M1).
- [ ] Record the F1 GIF.

**Soon (earn trust):**

- [ ] Add a test suite.
- [ ] Add CJS output alongside ESM.
- [ ] README: quickstart + comparison table + badges + GIF.

**Later (amplify):**

- [ ] Write the origin-story post; share the GIF.
- [ ] Submit to awesome-nodejs.
- [ ] Evaluate `once()` as F5.

---

## 10. Bottom line

The features make it **solid and trustworthy**. **F1 is the only loud one** — so the
strategy is: make F1 unmistakable (GIF, headline copy, perfect fallback), keep F2–F4
as supporting polish, add `once()` only if we want a second beat, and remember that
**positioning + a great GIF do as much work as the code.**
