// ============================================================================
// BigDeck - Bundled example SD plugin seeding
//
// BigDeck ships a real, runnable Stream Deck SDK v2 plugin
// (resources/example-plugin/com.bigdeck.examples.sdPlugin — product content,
// zero npm dependencies). At startup it is seeded into <userData>/sdplugins
// exactly like icon packs are seeded from resources/iconpacks: ONE-TIME —
// an already-installed copy wins (the user's copy is authoritative), and a
// missing seed source imports nothing (but logs it loudly, since a fresh
// machine without the seed shows an empty plugin list).
//
// Seeding runs BEFORE the host's start-flag check in index.ts, so the first
// seed also flips the "sdplugins dir exists" condition and boots the host.
// ============================================================================

import fsp from "fs/promises";
import path from "path";
import type { Logger } from "../../utils/Logger";

export const EXAMPLE_PLUGIN_UUID = "com.bigdeck.examples";
export const EXAMPLE_PLUGIN_DIR_NAME = `${EXAMPLE_PLUGIN_UUID}.sdPlugin`;

export type ExamplePluginSeedResult =
  | "seeded"
  | "already-installed"
  | "source-not-found";

/**
 * Copy the bundled example plugin into the plugins dir when absent.
 * `resourceDirs` are candidate seed ROOTS (e.g. `<resources>/example-plugin`
 * packaged, `resources/example-plugin` in a dev checkout) — the first one
 * that actually contains the plugin's manifest.json wins.
 */
export async function seedExamplePlugin(opts: {
  logger: Logger;
  /** App plugin root (<userData>/sdplugins). */
  pluginsDir: string;
  resourceDirs: string[];
}): Promise<ExamplePluginSeedResult> {
  let sourceDir: string | null = null;
  for (const root of opts.resourceDirs) {
    const candidate = path.join(root, EXAMPLE_PLUGIN_DIR_NAME);
    const manifest = path.join(candidate, "manifest.json");
    const stat = await fsp.stat(manifest).then(
      (s) => s.isFile(),
      () => false,
    );
    if (stat) {
      sourceDir = candidate;
      break;
    }
  }

  if (!sourceDir) {
    opts.logger.warn(
      "[sd] example plugin seed not found (resources/example-plugin) — no bundled example plugin",
    );
    return "source-not-found";
  }

  const dest = path.join(opts.pluginsDir, EXAMPLE_PLUGIN_DIR_NAME);
  const installed = await fsp
    .stat(dest)
    .then(() => true)
    .catch(() => false);
  if (installed) return "already-installed";

  await fsp.mkdir(opts.pluginsDir, { recursive: true });
  await fsp.cp(sourceDir, dest, { recursive: true });
  opts.logger.info(`[sd] seeded example plugin into ${dest}`);
  return "seeded";
}
