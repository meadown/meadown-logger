/*
 * formatLocation.ts
 * Created by Dewan Mobashirul
 * Copyright (c) 2026 dewan-meadown
 * All rights reserved
 */

import { type Caller } from "../../../caller/getCaller.js"
import { fileUrl, hyperlink } from "../../../decorations/link.js"

/**
 * Renders a caller as a `(file:line)` location — a clickable OSC-8 link on a
 * supporting terminal, plain text otherwise. Pure (no stack access).
 */
export function formatLocation(caller: Caller, interactive: boolean): string {
  if (caller.file !== null && caller.line !== null && interactive) {
    return hyperlink(caller.label, fileUrl(caller.file))
  }
  return caller.label
}
