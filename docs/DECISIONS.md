# Open Decisions — @meadown/logger

> Unresolved design questions, parked for later. Not yet implemented.
> Last updated: 2026-05-30

---

## D1 — How should the logger know the current environment?

**Status:** 🟡 Open — current behavior is intentionally minimal; revisit later.

### Current behavior

`isLogAllowed()` in `src/config.ts` reads `process.env.NODE_ENV` directly, with no
configuration API:

```ts
export function isLogAllowed(): boolean {
  return process.env.NODE_ENV !== "production"
}
```

Logs are on everywhere except production. There is **no `customLogConfig` / `mode`** —
that surface was prototyped and removed in favor of reading `NODE_ENV` directly.

### The gotchas (to resolve later)

1. **A `.env` file does not set `process.env.NODE_ENV` by itself.** Something must
   load it first — `dotenv`, `node --env-file=.env`, or a framework (Next.js, Vite,
   Nest, …). We cannot control or assume the user's loader.
2. If nothing sets `NODE_ENV`, it is `undefined`, so `NODE_ENV !== "production"` is
   `true` → **logs default to on.** Only the auto-silence-in-prod behavior needs
   `NODE_ENV=production` to actually be present in the runtime.

### Options considered

- **A. Keep reading `NODE_ENV` directly + document it.** ← current choice. Tell users
  that auto-silencing needs `NODE_ENV=production` set by their runtime (not merely in `.env`).
- **B. Explicit `env` override** — `customLogConfig({ env: "production" })`, falling back
  to `NODE_ENV`. (Prototyped, then reverted — felt messy / premature.)
- **C. `mode` switch** — `"development" | "production" | "both"`. (Also prototyped and
  removed; added config surface without clear payoff.)

### Decision

**Keep it minimal (option A).** No configuration surface — read `NODE_ENV` directly.
Revisit only if a clean solution emerges that preserves zero-config "auto-silence in
production" without assuming anything about the user's env loader.

### When we revisit, the solution must

- Keep the zero-config default working (no setup for the common case).
- Not assume the user loads a `.env` file.
- Avoid bloating the config API before the right shape is clear.
- Stay zero-dependency.
