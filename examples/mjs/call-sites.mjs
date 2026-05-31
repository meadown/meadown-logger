/*
 * call-sites.mjs
 * Shows that the (file:line) location is correct no matter how you call the
 * logger — and that logger.tap() points at YOUR line, not at tap itself.
 *
 * Run it:
 *   pnpm demo:calls-mjs
 *   pnpm build && node examples/mjs/call-sites.mjs
 *
 * Every entry's location should point back at this file, at the line where the
 * call actually happens.
 */

import logger from "../../dist/index.js"

// 1. Top level
logger("top-level log")
logger.tap("top-level value", "top-level")

// 2. Regular function declaration
function regularFunction() {
  logger("inside a regular function")
  return logger.tap(42, "regular-fn")
}
regularFunction()

// 3. Arrow function
const arrowFunction = () => {
  logger("inside an arrow function")
  return logger.tap([1, 2, 3], "arrow-fn")
}
arrowFunction()

// 4. Class method + static method
class Service {
  start() {
    logger("inside a class method")
    return logger.tap({ started: true }, "class-method")
  }

  static boot() {
    return logger.tap("booting", "static-method")
  }
}
new Service().start()
Service.boot()

// 5. Async function (the headline tap use: keep an awaited value flowing)
async function loadUser() {
  return logger.tap(await Promise.resolve({ id: 7, name: "Bob" }), "async-user")
}
await loadUser()

// 6. Inside a callback
;[10].forEach((n) => {
  logger.tap(n * 2, "callback")
})
