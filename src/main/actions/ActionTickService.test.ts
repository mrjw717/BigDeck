// ============================================================================
// ActionTickService — registry + interval tests (fake timers)
//
// The service is the reusable tick-render loop behind on-key displays
// (timer countdowns, live clocks, future screensavers). These tests pin the
// registry contract: immediate first render, bucketed re-renders, the
// null-render "display finished" → unregister + restore-idle path, and
// stop() teardown.
// ============================================================================

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  ActionTickService,
  renderTickTextFrame,
  tickKeySize,
  type TickImageSink,
} from "./ActionTickService";
import type { Logger } from "../utils/Logger";

const logger: Logger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
} as unknown as Logger;

function makeSink(): TickImageSink & {
  pushImage: ReturnType<typeof vi.fn>;
  restoreIdle: ReturnType<typeof vi.fn>;
} {
  return {
    pushImage: vi.fn().mockResolvedValue(undefined),
    restoreIdle: vi.fn().mockResolvedValue(true),
  };
}

/** Flush the microtasks an immediate render needs (fake timers active). */
const flush = () => vi.advanceTimersByTimeAsync(0);

describe("ActionTickService", () => {
  let service: ActionTickService;
  let sink: ReturnType<typeof makeSink>;

  beforeEach(() => {
    vi.useFakeTimers();
    service = new ActionTickService(logger);
    sink = makeSink();
    service.setSink(sink);
  });

  afterEach(() => {
    service.stop();
    vi.useRealTimers();
  });

  function entry(overrides: Partial<Parameters<ActionTickService["register"]>[0]> = {}) {
    return {
      keyId: "dev:0",
      deviceId: "dev",
      keyIndex: 0,
      intervalMs: 1000,
      kind: "test",
      render: vi.fn().mockResolvedValue(Buffer.from("frame")),
      ...overrides,
    };
  }

  it("renders immediately on registration (display appears at once)", async () => {
    const e = entry();
    service.register(e);
    await flush();

    expect(e.render).toHaveBeenCalledTimes(1);
    expect(sink.pushImage).toHaveBeenCalledWith("dev", 0, Buffer.from("frame"));
    expect(service.has("dev:0")).toBe(true);
  });

  it("re-renders an entry when its interval bucket elapses", async () => {
    const e = entry({ intervalMs: 1000 });
    service.register(e);
    await flush();
    expect(e.render).toHaveBeenCalledTimes(1);

    // Half a second: not yet due.
    await vi.advanceTimersByTimeAsync(500);
    expect(e.render).toHaveBeenCalledTimes(1);

    // Past the bucket: due.
    await vi.advanceTimersByTimeAsync(600);
    expect(e.render).toHaveBeenCalledTimes(2);
    expect(sink.pushImage).toHaveBeenCalledTimes(2);
  });

  it("does not re-render entries whose bucket has not elapsed (minute clocks)", async () => {
    const minute = entry({ keyId: "dev:1", intervalMs: 60000 });
    service.register(minute);
    await flush();
    expect(minute.render).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(59000);
    expect(minute.render).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(2000);
    expect(minute.render).toHaveBeenCalledTimes(2);
  });

  it("unregister stops rendering and restores the idle image", async () => {
    const e = entry();
    service.register(e);
    await flush();

    await service.unregister("dev:0");
    expect(service.has("dev:0")).toBe(false);
    expect(sink.restoreIdle).toHaveBeenCalledWith("dev", 0);

    sink.pushImage.mockClear();
    await vi.advanceTimersByTimeAsync(5000);
    expect(sink.pushImage).not.toHaveBeenCalled();
  });

  it("unregister can skip the idle restore", async () => {
    service.register(entry());
    await flush();

    await service.unregister("dev:0", false);
    expect(sink.restoreIdle).not.toHaveBeenCalled();
  });

  it("a null render finishes the display: unregisters + restores idle", async () => {
    // Countdown expiry shape: first renders show frames, then null = done.
    let calls = 0;
    const e = entry({
      render: vi.fn().mockImplementation(async () => {
        calls++;
        return calls < 3 ? Buffer.from("t") : null;
      }),
    });
    service.register(e);
    await flush();
    expect(service.has("dev:0")).toBe(true);

    await vi.advanceTimersByTimeAsync(1000);
    expect(service.has("dev:0")).toBe(true);

    await vi.advanceTimersByTimeAsync(1000);
    expect(service.has("dev:0")).toBe(false);
    expect(sink.restoreIdle).toHaveBeenCalledWith("dev", 0);
  });

  it("re-registering a keyId replaces the previous entry", async () => {
    const first = entry({ render: vi.fn().mockResolvedValue(Buffer.from("a")) });
    service.register(first);
    await flush();

    const second = entry({ render: vi.fn().mockResolvedValue(Buffer.from("b")) });
    service.register(second);
    await flush();

    expect(service.kindOf("dev:0")).toBe("test");
    expect(sink.pushImage).toHaveBeenLastCalledWith("dev", 0, Buffer.from("b"));
    await vi.advanceTimersByTimeAsync(1000);
    expect(second.render).toHaveBeenCalledTimes(2);
    expect(first.render).toHaveBeenCalledTimes(1);
  });

  it("a failing render is logged and the entry stays registered", async () => {
    const e = entry({
      render: vi.fn().mockRejectedValue(new Error("boom")),
    });
    service.register(e);
    await flush();

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining("render failed"),
      expect.any(Error),
    );
    expect(service.has("dev:0")).toBe(true);
  });

  it("stop() clears the interval and drops all entries", async () => {
    const e = entry();
    service.register(e);
    await flush();
    expect(service.size).toBe(1);

    service.stop();
    expect(service.size).toBe(0);

    sink.pushImage.mockClear();
    await vi.advanceTimersByTimeAsync(10000);
    expect(sink.pushImage).not.toHaveBeenCalled();
  });

  it("listKeys snapshots registered keys for placement diffs", () => {
    service.register(entry());
    service.register(entry({ keyId: "dev:2", keyIndex: 2, kind: "clock" }));

    expect(service.listKeys()).toEqual([
      { keyId: "dev:0", deviceId: "dev", keyIndex: 0, kind: "test" },
      { keyId: "dev:2", deviceId: "dev", keyIndex: 2, kind: "clock" },
    ]);
  });
});

describe("tick frame rendering", () => {
  it("renderTickTextFrame produces a PNG of the requested key size", async () => {
    const { width, height } = tickKeySize("original");
    expect(width).toBe(72);
    expect(height).toBe(72);

    const png = await renderTickTextFrame("05:00", width, height);
    expect(Buffer.isBuffer(png)).toBe(true);
    // PNG signature
    expect(png.subarray(0, 8)).toEqual(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    );

    const sharp = (await import("sharp")).default;
    const meta = await sharp(png).metadata();
    expect(meta.width).toBe(72);
    expect(meta.height).toBe(72);
  });

  it("produces different frames for different text (hash-skip depends on it)", async () => {
    const a = await renderTickTextFrame("04:59", 72, 72);
    const b = await renderTickTextFrame("05:00", 72, 72);
    expect(a.equals(b)).toBe(false);
  });

  it("escapes XML-hostile text safely", async () => {
    const png = await renderTickTextFrame('<&"\'>', 72, 72);
    expect(Buffer.isBuffer(png)).toBe(true);
  });
});
