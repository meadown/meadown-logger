/*
 * api.ts
 * REAL API performance logging with logger.tap().
 *
 * Tap a fetch PROMISE and you get a response block — execution time, HTTP
 * status, size (when advertised), and the body — while the SAME response flows
 * through your code untouched. The (file:line) points back here.
 *
 * Run it (needs network):
 *   pnpm build && node --experimental-strip-types examples/api.ts
 *
 * Uses the public JSONPlaceholder API — no key required.
 */

import logger from "../dist/index.js"

interface User {
  id: number
  name: string
}

interface Post {
  id: number
  title: string
}

const API = "https://jsonplaceholder.typicode.com"

// Big response bodies (like /posts) collapse to a few lines; raise/remove to see all.
logger.maxLines = 10

// Tap the fetch promise: logs the response block + body, returns the same
// Response. The original body is still readable (we read a clone for the log).
async function getUser(id: number): Promise<User> {
  const res = await logger.tap(fetch(`${API}/users/${id}`), `GET /users/${id}`)
  return res.json() as Promise<User>
}

const user = await getUser(1)
logger("flowed through:", user.name)

// POST example — useful for create/update flows. tap logs the 201 response,
// timing, size, and JSON body while the same Response still flows through.
const createdPostResponse = await logger.tap(
  fetch(`${API}/posts`, {
    method: "POST",
    body: JSON.stringify({
      title: "logger.tap API demo",
      body: "This response is logged without changing the fetch flow.",
      userId: user.id,
    }),
    headers: {
      "Content-Type": "application/json; charset=UTF-8",
    },
  }),
  "POST /posts",
)
const createdPost = (await createdPostResponse.json()) as Post
logger("created post id:", createdPost.id)

// A bigger endpoint — execution time switches to seconds past 1s.
await logger.tap(fetch(`${API}/posts`), "GET /posts")

// A non-2xx response — the block still reports the status (e.g. 404 Not Found).
await logger.tap(fetch(`${API}/unknown-endpoint`), "GET /unknown")

// A non-Response promise still works — value with its elapsed time.
await logger.tap(Promise.resolve<{ ready: boolean }>({ ready: true }), "warmup")

// A request that throws (DNS / network failure): tap returns the rejecting
// promise untouched — you catch and log it yourself.
try {
  await logger.tap(
    fetch("https://this-host-does-not-exist.invalid"),
    "GET bad-host",
  )
} catch (err) {
  logger.error("fetch threw", err)
}
