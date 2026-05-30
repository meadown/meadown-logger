# Security Policy

## Reporting a vulnerability

Please report security issues **privately** — do not open a public issue for
anything exploitable.

- **Preferred:** [Open a private security advisory →](https://github.com/meadown/meadown-logger/security/advisories/new)
- **Alternative:** email [inbox.meadown@gmail.com](mailto:inbox.meadown@gmail.com)

Include a description, the affected version, and steps to reproduce. We aim to
acknowledge reports within a few days and to coordinate a fix and disclosure.

## Supported versions

Only the latest published `@meadown/logger` release receives security fixes.

## Security model

`@meadown/logger` is intentionally minimal, which keeps its attack surface small:

- **Zero runtime dependencies.** Installing the package pulls in no transitive
  packages, so there is no third-party supply-chain surface to inherit.
- **Build script never reaches a consumer's machine.** There is a small script,
  `scripts/write-cjs-pkg.mjs`, that runs on the maintainer's machine as part of
  `pnpm build`. Its only job is to drop a `{ "type": "commonjs" }` marker into
  `dist/cjs/` so Node loads the CommonJS build correctly. It never goes further
  than that — `scripts/` is listed in `.npmignore`, so npm removes it before
  creating the tarball. By the time the package hits the registry, the script is
  already gone. What does ship is the two-field JSON file it produced, which
  contains no code and executes nothing.
- **No I/O or dynamic execution.** It does not read or write files, open network
  connections, spawn processes, or use `eval`/`Function`. It only writes to the
  console and reads `process.env.NODE_ENV` (to stay quiet in production). (The
  `examples/` directory is not part of the published package and may make real
  network calls when you run it.)
- **Nothing is persisted.** Log output is never written to disk, so the logger
  cannot leak logged data to a temp file or similar.

## What the logger does with your values

Nothing beyond showing them to you. This matters most for `tap`, which is built to
log values like API responses that often carry tokens, sessions, or personal data.
The logger does **not**:

- **store or persist** any value — no files, no database, no caching, no buffering;
  nothing is kept after the log call returns;
- **send anything over the network** — there is no networking code and no
  dependencies, so there is nothing that could "phone home";
- **read, copy, or forward** tokens, cookies, session IDs, or credentials, and it
  does not hijack or inspect sessions;
- **mutate** what you pass — `tap` returns the exact same reference, unchanged.

`logger.tap(await login(), "auth")` writes the response to your terminal and hands
it straight back. The value never leaves your process — the only "exposure" is the
text printed to your own console (see the trust boundary below).

## Trust boundary: logged values are output, not input

Like `console.log` itself, this logger passes whatever you give it through to the
terminal as output, via every entry point — `logger(...)`, `.error(...)`,
`.warn(...)`, and `.tap(value, label?)`. **It does not sanitize them.** (`tap`
returns the value untouched and renders it for display; it never inspects or
alters it.)

If you log **untrusted data** (user input, third-party API responses, etc.) that
contains terminal control or escape sequences (ANSI `\x1b[…`, OSC-8 hyperlinks,
carriage returns), those sequences reach the terminal and can manipulate it —
e.g. overwrite previously printed text or spoof a clickable link. This is an
inherent property of writing untrusted text to a terminal, not specific to this
package.

This is worth keeping in mind for `tap`, whose headline use is logging fetched
API responses — exactly the kind of third-party data to treat as untrusted.

Guidance:

- Treat log output as you would any other untrusted text rendered in a terminal.
- Do not log raw untrusted input to a terminal or log stream you treat as
  trusted; sanitize or encode it first if that is a concern in your environment.

The clickable source link the logger emits is built from the runtime call
stack's file path (encoded via `node:url`'s `pathToFileURL`), not from your
arguments, so the logger's own escape sequences are not attacker-influenced.
