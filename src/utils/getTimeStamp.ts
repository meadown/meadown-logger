/*
 * getTimeStamp.ts
 * Created by Dewan Mobashirul
 * Copyright (c) 2026 dewan-meadown
 * All rights reserved
 */

// Time-only formatter (date is built separately so it stays ISO `YYYY-MM-DD`).
const TIME_FORMATTER = new Intl.DateTimeFormat("en-US", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: true,
  timeZoneName: "short",
})

function pad(value: number): string {
  return String(value).padStart(2, "0")
}

/**
 * Returns local time as an ISO date plus a readable AM/PM time and timezone,
 * e.g. `2026-05-29 04:00:00 PM GMT+6`. The date and time are both local, so they
 * stay consistent.
 */
export default function getTimeStamp(date = new Date()): string {
  const datePart = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
  return `${datePart} ${TIME_FORMATTER.format(date)}`
}
