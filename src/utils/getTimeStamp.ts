/*
 * getTimeStamp.ts
 * Created by Dewan Mobashirul
 * Copyright (c) 2026 dewan-meadown
 * All rights reserved
 */

// Time-only 12-hour formatter (date is built separately, timezone is dropped).
const TIME_FORMATTER = new Intl.DateTimeFormat("en-US", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: true,
})

function pad(value: number): string {
  return String(value).padStart(2, "0")
}

/**
 * Returns a short local timestamp: month-day plus 12-hour time, e.g.
 * `05-30 04:00:00 PM`. The year and timezone are dropped to keep log lines
 * compact; date and time are both local so they stay consistent.
 */
export default function getTimeStamp(date = new Date()): string {
  const datePart = `${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
  return `${datePart} ${TIME_FORMATTER.format(date)}`
}
