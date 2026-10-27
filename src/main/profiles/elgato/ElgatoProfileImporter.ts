// ============================================================================
// BigDeck - Elgato .streamDeckProfile Importer
//
// Orchestrates one-file import: parse (unzip) → convert → persist via
// ProfileManager, importing referenced key images into the managed asset
// directory on the way. Returns a structured report (never throws for
// per-file problems) so an IPC caller can surface exactly what happened:
//
//   { ok, profileId, profileName, deviceType,
//     importedKeys, skippedKeys: [{keyIndex, uuid, reason}], warnings, errors }
//
// The assetsDir is caller-supplied (the production wiring passes
// <userData>/assets, the same directory the ASSET_UPLOAD handler and the
// bigdeck-asset:// protocol serve) so this module stays Electron-free and
// integration-testable.
// ============================================================================

import fsp from "fs/promises";
import path from "path";
import type { DeviceType, Profile } from "../../../shared/types";
import type { ProfileManager } from "../ProfileManager";
import type { Logger } from "../../utils/Logger";
import {
  cleanupElgatoBundle,
  parseElgatoProfile,
} from "./ElgatoProfileParser";
import { convertElgatoProfile, type ElgatoSkippedKey } from "./ElgatoToBigDeck";

export interface ElgatoImportOptions {
  /** Managed asset directory; created if missing. */
  assetsDir: string;
  /** Force a deviceType instead of footprint inference. */
  deviceType?: DeviceType;
}

export interface ElgatoImportReport {
  ok: boolean;
  /** Set when the profile was persisted (ProfileManager id). */
  profileId: string | null;
  profileName: string;
  deviceType: DeviceType | null;
  importedKeys: number;
  skippedKeys: ElgatoSkippedKey[];
  warnings: string[];
  errors: string[];
}

export class ElgatoProfileImporter {
  private profileManager: ProfileManager;
  private logger: Logger;

  constructor(profileManager: ProfileManager, logger: Logger) {
    this.profileManager = profileManager;
    this.logger = logger;
  }

  /**
   * Import a .streamDeckProfile file. Resolves with a full report on both
   * success and failure (ok=false) — only truly unexpected errors reject.
   */
  async importFile(
    zipPath: string,
    options: ElgatoImportOptions,
  ): Promise<ElgatoImportReport> {
    const emptyReport: ElgatoImportReport = {
      ok: false,
      profileId: null,
      profileName: path.basename(zipPath),
      deviceType: options.deviceType ?? null,
      importedKeys: 0,
      skippedKeys: [],
      warnings: [],
      errors: [],
    };

    let bundle;
    try {
      bundle = await parseElgatoProfile(zipPath);
    } catch (error) {
      const errors = [error instanceof Error ? error.message : String(error)];
      this.logger.error(`Elgato import failed for ${zipPath}:`, error);
      return { ...emptyReport, errors };
    }

    try {
      const sourceName = path
        .basename(zipPath)
        .replace(/\.streamDeckProfile$/i, "")
        .replace(/\.zip$/i, "");

      const converted = await convertElgatoProfile(bundle, {
        deviceType: options.deviceType,
        sourceName,
        importImage: async (absolutePath, suggestedName) => {
          try {
            await fsp.mkdir(options.assetsDir, { recursive: true });
            await fsp.copyFile(absolutePath, path.join(options.assetsDir, suggestedName));
            return suggestedName;
          } catch (error) {
            this.logger.warn(
              `Elgato import: failed to copy image ${absolutePath}:`,
              error,
            );
            return null;
          }
        },
      });

      const profile: Profile = this.profileManager.createProfile(
        converted.profile,
      );
      this.logger.info(
        `Elgato profile imported: ${profile.name} ` +
          `(${converted.importedKeys} keys, ${converted.skippedKeys.length} skipped)` +
          (converted.warnings.length > 0
            ? ` — warnings: ${converted.warnings.join(" | ")}`
            : ""),
      );

      return {
        ok: true,
        profileId: profile.id,
        profileName: profile.name,
        deviceType: profile.deviceType,
        importedKeys: converted.importedKeys,
        skippedKeys: converted.skippedKeys,
        warnings: converted.warnings,
        errors: [],
      };
    } catch (error) {
      this.logger.error(`Elgato import failed for ${zipPath}:`, error);
      return {
        ...emptyReport,
        errors: [error instanceof Error ? error.message : String(error)],
      };
    } finally {
      await cleanupElgatoBundle(bundle);
    }
  }
}
