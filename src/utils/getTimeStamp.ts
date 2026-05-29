/*
 * getTimeStamp.ts
 * Created by Dewan Mobashirul
 * Copyright (c) 2026 dewan-meadown
 * All rights reserved
 */

/** Returns the current time as an ISO-8601 string, e.g. `2026-05-30T10:00:00.000Z`. */
export default function getTimeStamp(): string {
  return new Date().toISOString()
}
