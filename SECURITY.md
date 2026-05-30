# Security Policy

## Reporting a vulnerability

Please report security issues **privately** by email to
[inbox.meadown@gmail.com](mailto:inbox.meadown@gmail.com).

Include a description, the affected version, and steps to reproduce. We aim to
acknowledge reports within a few days and to coordinate a fix and disclosure.

> Once this repository is public, reports can also be filed via GitHub Security
> Advisories ("Report a vulnerability" under the Security tab).

## Supported versions

Only the latest published `@meadown/logger` release receives security fixes.

## Security model

`@meadown/logger` is intentionally minimal, which keeps its attack surface small:

- **Zero runtime dependencies.** Installing the package pulls in no transitive
  packages, so there is no third-party supply-chain surface to inherit.
- **No I/O or dynamic execution.** It does not read or write files, open network
  connections, spawn processes, or use `eval`/`Function`. It only writes to the
  console and reads `process.env.NODE_ENV` (to stay quiet in production).
- **Nothing is persisted.** Log output is never written to disk, so the logger
  cannot leak logged data to a temp file or similar.

## Trust boundary: log arguments are output, not input

Like `console.log` itself, this logger passes the arguments you give it through
to the terminal as output. **It does not sanitize them.**

If you log **untrusted data** (user input, third-party API responses, etc.) that
contains terminal control or escape sequences (ANSI `\x1b[…`, OSC-8 hyperlinks,
carriage returns), those sequences reach the terminal and can manipulate it —
e.g. overwrite previously printed text or spoof a clickable link. This is an
inherent property of writing untrusted text to a terminal, not specific to this
package.

Guidance:

- Treat log output as you would any other untrusted text rendered in a terminal.
- Do not log raw untrusted input to a terminal or log stream you treat as
  trusted; sanitize or encode it first if that is a concern in your environment.

The clickable source link the logger emits is built from the runtime call
stack's file path (encoded via `node:url`'s `pathToFileURL`), not from your
arguments, so the logger's own escape sequences are not attacker-influenced.
