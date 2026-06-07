/*
 * redis-cache.ts
 * Shows how logger integrates into a Redis cache service.
 *
 * Four patterns demonstrated:
 *
 *   logger()                    — plain lifecycle messages (connect, ready, end)
 *   logger.error()              — error channel for caught exceptions
 *   logger.tap(promise, label)  — async ops (get/set/ping) with elapsed time
 *   logger.tap(fn, label)       — event callbacks: logs args each time the event fires
 *
 * Run it (no Redis server needed — uses a lightweight mock client):
 *   pnpm demo:redis
 *   pnpm build && node --experimental-strip-types examples/ts/redis-cache.ts
 */

import { EventEmitter } from "node:events"
import logger from "../../dist/index.js"

// ---------------------------------------------------------------------------
// Minimal mock that mimics the RedisClientType surface used by the service
// ---------------------------------------------------------------------------

class MockRedisClient extends EventEmitter {
  isOpen = false
  isReady = false

  async connect() {
    this.emit("connect")
    await delay(40)
    this.isOpen = true
    this.isReady = true
    this.emit("ready")
  }

  async get(key: string): Promise<string | null> {
    await delay(12)
    return key.endsWith("user:1") ? JSON.stringify({ id: 1, name: "Alice" }) : null
  }

  async set(key: string, value: string): Promise<void> {
    await delay(8)
  }

  async ping(): Promise<string> {
    await delay(5)
    return "PONG"
  }

  async quit() {
    this.isOpen = false
    this.isReady = false
    this.emit("end")
  }
}

function delay(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms))
}

// ---------------------------------------------------------------------------
// Service wiring — mirrors RedisCacheService constructor
// ---------------------------------------------------------------------------

const client = new MockRedisClient()

// 1. logger() — plain lifecycle messages
client.on("connect",      () => logger("Connecting to Redis server..."))
client.on("ready",        () => logger("Redis client ready"))
client.on("end",          () => logger("Connection closed"))
client.on("reconnecting", () => logger("Reconnecting to Redis..."))

// 2. logger.tap(fn, label) — wrap the error callback so each firing is logged.
//    The wrapper is transparent: same signature, same return value, same call.
client.on(
  "error",
  logger.tap((err: Error) => { /* handle: update isConnected = false, etc. */ }, "Redis error:"),
)

// ---------------------------------------------------------------------------
// Operations
// ---------------------------------------------------------------------------

await client.connect()

// 3. logger.tap(promise, label) — GET with timing and resolved value
const raw = await logger.tap(client.get("iam:user:1"), "GET iam:user:1")
logger("cache hit →", raw ? JSON.parse(raw) : null)

const miss = await logger.tap(client.get("iam:user:99"), "GET iam:user:99")
logger("cache miss →", miss)

// SET is void — tap shows elapsed time only, no undefined
await logger.tap(
  client.set("iam:user:2", JSON.stringify({ id: 2, name: "Bob" })),
  "SET iam:user:2",
)

// Health check via PING
const pong = await logger.tap(client.ping(), "PING")
logger("health →", pong)

// Simulate an error event so the spy fires and logs it
client.emit("error", new Error("ECONNRESET — connection reset by peer"))

// 4. logger.error() — caught exception in a method
try {
  throw new Error("serialization failed")
} catch (err) {
  logger.error("Redis", "Set error:", err)
}

await client.quit()
