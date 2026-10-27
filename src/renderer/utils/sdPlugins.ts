// ============================================================================
// SD plugin actions — shared lookup for the renderer action catalogs
// (KeyEditor's type picker and ActionLibrary's drag templates).
//
// Data comes from the main-process SD plugin host (window.bigdeck.sd,
// channel sd.listPlugins): localized plugin summaries with their actions[]
// per docs/SDPLUGIN-COMPAT.md. Always resolves — an empty/failed host (no
// plugins installed) simply contributes no entries.
// ============================================================================

/** A flattened, assignable SD plugin action. */
export interface SdActionEntry {
  pluginUUID: string;
  actionUUID: string;
  /** Localized action name (locale file wins over the manifest name). */
  name: string;
  /** Localized plugin name the action belongs to. */
  pluginName: string;
  tooltip?: string;
}

export function flattenSdActions(plugins: any[]): SdActionEntry[] {
  return plugins.flatMap((plugin) =>
    (plugin.actions ?? []).map((action: any) => ({
      pluginUUID: String(plugin.uuid),
      actionUUID: String(action.uuid),
      name: String(action.name ?? action.uuid),
      pluginName: String(plugin.name ?? plugin.uuid),
      tooltip: action.tooltip,
    })),
  );
}

export async function fetchSdActionEntries(): Promise<SdActionEntry[]> {
  try {
    const plugins = (await window.bigdeck?.sd.listPlugins()) ?? [];
    return flattenSdActions(plugins);
  } catch {
    return [];
  }
}

/**
 * Build the `sdplugin` action for a picked entry — the shape ActionExecutor
 * dispatches through SDPluginHost (see shared/types SdPluginAction).
 */
export function makeSdPluginAction(entry: SdActionEntry) {
  return {
    type: "sdplugin" as const,
    id: crypto.randomUUID(),
    name: entry.name,
    pluginUUID: entry.pluginUUID,
    actionUUID: entry.actionUUID,
    settings: {},
  };
}
