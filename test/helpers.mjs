/*
 * helpers.mjs
 * Created by Dewan Mobashirul
 * Copyright (c) 2026 dewan-meadown
 * All rights reserved
 */

/** Run `fn` with NODE_ENV temporarily set to `value` (undefined = unset). */
export function withEnv(value, fn) {
  const prev = process.env.NODE_ENV
  if (value === undefined) delete process.env.NODE_ENV
  else process.env.NODE_ENV = value
  try {
    return fn()
  } finally {
    if (prev === undefined) delete process.env.NODE_ENV
    else process.env.NODE_ENV = prev
  }
}

/** Capture every call to `console[method]` made during `fn`. */
export function capture(method, fn) {
  const original = console[method]
  const calls = []
  console[method] = (...args) => {
    calls.push(args)
  }
  try {
    fn()
  } finally {
    console[method] = original
  }
  return calls
}
