"use client";

import { useEffect } from "react";
import { polyfillCountryFlagEmojis } from "country-flag-emoji-polyfill";

/** Windows browsers lack flag emoji glyphs; load a self-hosted flag-only font there. */
export function FlagPolyfill() {
  useEffect(() => {
    polyfillCountryFlagEmojis("Twemoji Country Flags", "/fonts/TwemojiCountryFlags.woff2");
  }, []);
  return null;
}
