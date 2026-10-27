// ============================================================================
// BigDeck - .sdLayoutEx preview rendering (Settings gallery groundwork)
//
// Builds a representative mock clock data provider for a layout manifest and
// renders it with LayoutRenderer: the Settings "SD+ / Neo Layouts" gallery
// shows one PNG thumbnail per imported layout (first theme, 3× scale). Real
// device data (BigDeck's clock module) arrives with SD+ dial/LCD support —
// the provider shape here is exactly what that wiring will feed.
// ============================================================================

import type { LayoutExManifest } from "../../shared/types";
import type { LayoutEntry } from "./LayoutStore";
import { LayoutRenderer, type LayoutDataProvider } from "./LayoutRenderer";

/** Preview render scale — 3× the 232×50 logical canvas = 696×150 px. */
export const LAYOUT_PREVIEW_SCALE = 3;

/**
 * Element type → representative display value. Every surveyed element type
 * is covered; unknown types contribute nothing (their items stay hidden or
 * render their literal/lone chip, matching LayoutRenderer's fallbacks).
 */
export function buildMockDataProvider(manifest: LayoutExManifest): LayoutDataProvider {
  const data: LayoutDataProvider = {};
  for (const element of manifest.elements) {
    switch (element.type) {
      case "hours":
        data[element.key] = 10;
        break;
      case "minutes":
        data[element.key] = 42;
        break;
      case "colon":
        data[element.key] = ":";
        break;
      case "am/pm":
        data[element.key] = "PM";
        break;
      case "day":
        data[element.key] = "Wednesday";
        break;
      case "date":
        data[element.key] = "Oct 27";
        break;
      case "location":
        data[element.key] = "Home";
        break;
      case "custom_date":
        data[element.key] = "Wed 27 Oct";
        break;
      case "carousel_page":
        data[element.key] = "Home";
        break;
      // Visibility gates (show_on_am/pm, show_on_clock_type): the preview
      // draws the AM variant / neutral overlays and keeps the PM twin hidden
      // so overlapping gated art never doubles up in the thumbnail.
      case "show_on_am/pm":
      case "show_on_clock_type":
        data[element.key] = !/pm/i.test(element.key);
        break;
      default:
        break;
    }
  }
  return data;
}

/** Render one installed layout to its gallery PNG (first theme, 3× scale). */
export async function renderLayoutPreview(
  entry: LayoutEntry,
  renderer: LayoutRenderer,
): Promise<Buffer> {
  const data = buildMockDataProvider(entry.manifest);
  return renderer.render(entry.manifest, data, {
    themeId: entry.themeIds[0],
    scale: LAYOUT_PREVIEW_SCALE,
    layoutDir: entry.dir,
  });
}
