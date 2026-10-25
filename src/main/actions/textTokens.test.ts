// ============================================================================
// textTokens — date/time token substitution for text layers
//
// {date} {time} {weekday} must resolve deterministically from an injected
// `now` so tests don't depend on the wall clock, and so KeyRenderer can
// build cache keys that roll over at midnight.
// ============================================================================

import { describe, it, expect } from "vitest";
import { applyTextTokens, hasTextTokens } from "./textTokens";

// 2026-10-25 is a Sunday; 14:05 exercises the zero-padding paths.
const NOW = new Date(2026, 9, 25, 14, 5, 0);

describe("applyTextTokens", () => {
  it("resolves {date} as zero-padded ISO-style date", () => {
    expect(applyTextTokens("{date}", NOW)).toBe("2026-10-25");
  });

  it("resolves {time} as zero-padded 24h clock", () => {
    expect(applyTextTokens("{time}", NOW)).toBe("14:05");
  });

  it("resolves {weekday} to the day name", () => {
    expect(applyTextTokens("{weekday}", NOW)).toBe("Sunday");
  });

  it("substitutes inside surrounding text and multiple tokens at once", () => {
    expect(applyTextTokens("Fri\n{date}\n{time}", NOW)).toBe(
      "Fri\n2026-10-25\n14:05",
    );
  });

  it("leaves unknown tokens untouched", () => {
    expect(applyTextTokens("{datee} {foo} {date}", NOW)).toBe(
      "{datee} {foo} 2026-10-25",
    );
  });

  it("returns plain text unchanged", () => {
    expect(applyTextTokens("no tokens here", NOW)).toBe("no tokens here");
  });

  it("produces a different value after midnight (cache-key rollover)", () => {
    const before = applyTextTokens("{date}", new Date(2026, 9, 25, 23, 59));
    const after = applyTextTokens("{date}", new Date(2026, 9, 26, 0, 0));
    expect(before).not.toBe(after);
  });
});

describe("hasTextTokens", () => {
  it("detects each known token", () => {
    expect(hasTextTokens("{date}")).toBe(true);
    expect(hasTextTokens("{time}")).toBe(true);
    expect(hasTextTokens("{weekday}")).toBe(true);
  });

  it("is repeatable across calls (no stateful lastIndex)", () => {
    expect(hasTextTokens("{time}")).toBe(true);
    expect(hasTextTokens("{time}")).toBe(true);
    expect(hasTextTokens("plain")).toBe(false);
    expect(hasTextTokens("{time}")).toBe(true);
  });

  it("rejects unknown tokens", () => {
    expect(hasTextTokens("{datee} {DATETIME}")).toBe(false);
  });
});
