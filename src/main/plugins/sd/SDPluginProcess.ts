// ============================================================================
// BigDeck - Stream Deck Plugin Process
//
// One OS process per `.sdPlugin`, spawned by BigDeck with the argv recovered
// from the official app (FUN_1006c3c94, see docs/SDPLUGIN-COMPAT.md):
//
//   <CodePath> -port <wsPort> -pluginUUID <uuid>
//              -registerEvent registerPlugin -info <URL-encoded JSON>
//
// Child-process mechanism: the same child_process.spawn ActionExecutor uses
// for run-script/launch-app, but NOT detached/stdio-ignore — plugins are
// supervised children: their stdout/stderr is captured into the BigDeck log
// and they must be killable on shutdown/disable.
//
// Launcher resolution: most CodePath entries are not marked +x and are
// interpreted scripts. We dispatch by extension when the file is not
// executable:
//   .js/.mjs/.cjs → node (under Electron: process.execPath with
//                    ELECTRON_RUN_AS_NODE=1 so we get plain node, not a GUI)
//   .py/.py3      → python3
//   .sh           → bash
//   .html         → unsupported in the backend phase (browser-hosted plugin;
//                    needs the PI webview work)
// Executable files run directly (compiled/native plugins).
//
// Exit handling: exit marks the process stopped/crashed. Optional respawn
// with exponential backoff exists for crash-looping plugins but is OFF by
// default for v1 (config flag on the host). Failures reset when a process
// has been up for a while (stable run), so a one-off crash doesn't ramp the
// backoff forever.
// ============================================================================

import { spawn, type ChildProcess } from "child_process";
import { accessSync, constants as fsConstants } from "fs";
import path from "path";
import type { Logger } from "../../utils/Logger";

export interface SDProcessOptions {
  pluginUUID: string;
  pluginName: string;
  /** Absolute path to the code entry point (from resolveCodePath). */
  codePath: string;
  /** WebSocket port of the SDPluginHost server. */
  port: number;
  /** The `-info` registration payload (will be URL-encoded into argv). */
  info: Record<string, unknown>;
  /** Respawn on abnormal exit. Default false (v1). */
  respawn: boolean;
  respawnBaseDelayMs?: number;
  respawnMaxDelayMs?: number;
  /** Working directory for the child (defaults to the codePath's dir). */
  cwd?: string;
}

export type SDProcessStatus =
  | "idle"
  | "starting"
  | "running"
  | "stopped"
  | "crashed"
  | "unsupported"
  | "failed";

/** Time a child must stay up before its respawn failure count resets. */
const STABLE_RUN_MS = 60 * 1000;
/** Grace period between SIGTERM and SIGKILL on stop(). */
const KILL_GRACE_MS = 2000;

/**
 * Build the plugin spawn argv exactly per the compat spec. The `-info` JSON
 * is URL-encoded, matching the official binary's behavior.
 */
export function buildSpawnArgs(
  port: number,
  pluginUUID: string,
  info: Record<string, unknown>,
): string[] {
  return [
    "-port",
    String(port),
    "-pluginUUID",
    pluginUUID,
    "-registerEvent",
    "registerPlugin",
    "-info",
    encodeURIComponent(JSON.stringify(info)),
  ];
}

export interface SDLauncher {
  file: string;
  args: string[];
  env: NodeJS.ProcessEnv;
}

function isExecutable(absolutePath: string): boolean {
  try {
    accessSync(absolutePath, fsConstants.X_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Resolve how to launch a code entry point. Returns null when BigDeck cannot
 * run it (browser-hosted HTML plugin, or an unknown format that is not
 * executable) — callers treat that as `unsupported`, not as an error.
 */
export function resolveLauncher(
  codePath: string,
  opts: { isExecutable?: (p: string) => boolean; nodeBin?: string } = {},
): SDLauncher | null {
  const executable = opts.isExecutable ?? isExecutable;

  // Compiled/native plugin — run directly.
  if (executable(codePath)) {
    return { file: codePath, args: [], env: {} };
  }

  const ext = path.extname(codePath).toLowerCase();
  switch (ext) {
    case ".js":
    case ".mjs":
    case ".cjs": {
      // Under Electron, process.execPath is the Electron binary; without
      // ELECTRON_RUN_AS_NODE it would boot a GUI app instead of running the
      // script. The env flag gives us Electron's bundled plain node.
      if (process.versions.electron) {
        return {
          file: opts.nodeBin ?? process.execPath,
          args: [codePath],
          env: { ELECTRON_RUN_AS_NODE: "1" },
        };
      }
      return { file: opts.nodeBin ?? process.execPath, args: [codePath], env: {} };
    }
    case ".py":
    case ".py3":
      return { file: "python3", args: [codePath], env: {} };
    case ".sh":
      return { file: "bash", args: [codePath], env: {} };
    default:
      // .html and anything unknown: not launchable headlessly (v1).
      return null;
  }
}

/**
 * One spawned plugin process: logging, exit classification, and optional
 * backoff respawn. Events: `exit` (code, signal), `respawn` (attempt number).
 */
export class SDPluginProcess {
  readonly pluginUUID: string;
  private readonly opts: SDProcessOptions;
  private readonly logger: Logger;
  private child: ChildProcess | null = null;
  private status: SDProcessStatus = "idle";
  /** Set by stop() — suppresses respawn classification and kills escalation. */
  private killedByUs = false;
  private respawnFailures = 0;
  private respawnTimer: NodeJS.Timeout | null = null;
  private killTimer: NodeJS.Timeout | null = null;
  private startedAt = 0;

  constructor(opts: SDProcessOptions, logger: Logger) {
    this.opts = opts;
    this.pluginUUID = opts.pluginUUID;
    this.logger = logger;
  }

  getStatus(): SDProcessStatus {
    return this.status;
  }

  getPid(): number | null {
    return this.child?.pid ?? null;
  }

  /**
   * Spawn the plugin. Returns false (status `unsupported`) when no launcher
   * could be resolved — that is an expected condition for browser-hosted
   * plugins, not a crash.
   */
  start(): boolean {
    if (this.child) return true;

    const launcher = resolveLauncher(this.opts.codePath);
    if (!launcher) {
      this.status = "unsupported";
      this.logger.warn(
        `[sd] ${this.opts.pluginName}: code path ${this.opts.codePath} is not launchable headlessly (HTML or unknown format); plugin skipped`,
      );
      return false;
    }

    const args = [
      ...launcher.args,
      ...buildSpawnArgs(this.opts.port, this.opts.pluginUUID, this.opts.info),
    ];

    this.status = "starting";
    this.killedByUs = false;
    this.startedAt = Date.now();

    try {
      this.child = spawn(launcher.file, args, {
        cwd: this.opts.cwd ?? path.dirname(this.opts.codePath),
        env: { ...process.env, ...launcher.env },
        stdio: ["ignore", "pipe", "pipe"],
        // Keep the child in our process group so shutdown is deterministic —
        // detached+unref (the ActionExecutor fire-and-forget pattern) would
        // orphan plugin processes on crash of the main process.
        detached: false,
      });
    } catch (err) {
      this.status = "failed";
      this.logger.error(`[sd] ${this.opts.pluginName}: spawn failed:`, err);
      return false;
    }

    this.status = "running";
    this.logger.info(
      `[sd] ${this.opts.pluginName}: spawned (pid ${this.child.pid}) via ${path.basename(this.opts.codePath)}`,
    );

    const tag = `[sd:${this.opts.pluginName}]`;
    this.child.stdout?.on("data", (chunk: Buffer) => {
      for (const line of chunk.toString().split("\n")) {
        if (line.trim().length > 0) this.logger.info(`${tag} ${line}`);
      }
    });
    this.child.stderr?.on("data", (chunk: Buffer) => {
      for (const line of chunk.toString().split("\n")) {
        if (line.trim().length > 0) this.logger.error(`${tag} ${line}`);
      }
    });

    this.child.on("error", (err) => {
      this.status = "failed";
      this.logger.error(`[sd] ${this.opts.pluginName}: process error:`, err);
    });

    this.child.on("exit", (code, signal) => {
      this.child = null;
      const ranStable = Date.now() - this.startedAt > STABLE_RUN_MS;
      if (this.killedByUs) {
        this.status = "stopped";
      } else if (code === 0) {
        this.status = "stopped";
      } else {
        this.status = "crashed";
        this.logger.warn(
          `[sd] ${this.opts.pluginName}: exited code=${code} signal=${signal}`,
        );
      }
      this.emit("exit", code, signal);

      if (
        this.opts.respawn &&
        !this.killedByUs &&
        this.status === "crashed"
      ) {
        if (ranStable) this.respawnFailures = 0;
        this.scheduleRespawn();
      }
    });

    return true;
  }

  /** Schedule a restart with exponential backoff (base doubling, capped). */
  private scheduleRespawn(): void {
    if (this.respawnTimer) return;
    const base = this.opts.respawnBaseDelayMs ?? 1000;
    const max = this.opts.respawnMaxDelayMs ?? 30 * 1000;
    const delay = Math.min(base * 2 ** this.respawnFailures, max);
    this.respawnFailures += 1;

    this.logger.info(
      `[sd] ${this.opts.pluginName}: respawn in ${delay}ms (failure ${this.respawnFailures})`,
    );
    this.respawnTimer = setTimeout(() => {
      this.respawnTimer = null;
      if (this.killedByUs) return;
      this.emit("respawn", this.respawnFailures);
      this.start();
    }, delay);
  }

  /** Stop the plugin: SIGTERM, escalate to SIGKILL after the grace period. */
  stop(): void {
    this.killedByUs = true;
    if (this.respawnTimer) {
      clearTimeout(this.respawnTimer);
      this.respawnTimer = null;
    }
    if (!this.child) {
      this.status = "stopped";
      return;
    }

    const child = this.child;
    try {
      child.kill("SIGTERM");
    } catch {
      // Already gone.
    }
    this.killTimer = setTimeout(() => {
      if (this.child === child && child.exitCode === null) {
        this.logger.warn(`[sd] ${this.opts.pluginName}: SIGKILL after grace period`);
        try {
          child.kill("SIGKILL");
        } catch {
          // Already gone.
        }
      }
    }, KILL_GRACE_MS);
    child.once("exit", () => {
      if (this.killTimer) {
        clearTimeout(this.killTimer);
        this.killTimer = null;
      }
    });
  }

  private emit(event: string, ...args: unknown[]): void {
    // EventEmitter is composited rather than extended to keep the public
    // surface of this class minimal; see .on() below.
    this.handlers.get(event)?.forEach((h) => h(...args));
  }

  private handlers: Map<string, Array<(...args: unknown[]) => void>> = new Map();

  on(event: "exit" | "respawn", handler: (...args: unknown[]) => void): void {
    const list = this.handlers.get(event) ?? [];
    list.push(handler);
    this.handlers.set(event, list);
  }
}
