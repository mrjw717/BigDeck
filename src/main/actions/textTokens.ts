// ============================================================================
// BigDeck - Text layer date/time tokens
//
// Text layers may embed tokens that resolve to the CURRENT date/time at
// render time: {date} {time} {weekday}. This is the static (render-time)
// half of a clock display — Elgato's Digital Time action re-renders every
// minute; BigDeck re-renders when the key re-renders (page switch, profile
// apply, config edit). The per-minute tick loop design lives in
// docs/PLUGIN-ACTIONS-MATRIX.md (clock/timer tick rendering).
//
// Tokens are substituted BEFORE the layer frame cache key is computed, so
// the cache key rolls over at midnight instead of serving yesterday's date.
// ============================================================================

/** Locale-stable formats — a deck badge, not a localized clock. */
export const DATE_TOKENS: Record<string, (now: Date) => string> = {
  date: (now) =>
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
      now.getDate(),
    ).padStart(2, "0")}`,
  time: (now) =>
    `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
  weekday: (now) =>
    ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][
      now.getDay()
    ],
};

const TOKEN_PATTERN = /\{(date|time|weekday)\}/g;
const TOKEN_PROBE = /\{(date|time|weekday)\}/;

/**
 * Replace {date} / {time} / {weekday} tokens in a text layer string.
 * Unknown tokens are left untouched (user may legitimately want braces).
 */
export function applyTextTokens(text: string, now: Date = new Date()): string {
  return text.replace(TOKEN_PATTERN, (_match, token: string) =>
    DATE_TOKENS[token](now),
  );
}

/** True when the text contains at least one known token. */
export function hasTextTokens(text: string): boolean {
  return TOKEN_PROBE.test(text);
}
