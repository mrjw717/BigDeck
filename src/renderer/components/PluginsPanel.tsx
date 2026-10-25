import React, { useEffect, useState } from 'react';
import { 
  Puzzle, 
  Power, 
  Settings, 
  ExternalLink,
  Search
} from 'lucide-react';
import type { PluginInfo } from '../../shared/types';

export function PluginsPanel() {
  const [plugins, setPlugins] = useState<PluginInfo[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPlugins();
  }, []);

  const loadPlugins = async () => {
    setIsLoading(true);
    try {
      const list = await window.bigdeck?.plugin.list() || [];
      setPlugins(list);
    } catch (error) {
      console.error('Failed to load plugins:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePlugin = async (pluginId: string, enabled: boolean) => {
    try {
      if (enabled) {
        await window.bigdeck?.plugin.enable(pluginId);
      } else {
        await window.bigdeck?.plugin.disable(pluginId);
      }
      await loadPlugins();
    } catch (error) {
      console.error('Failed to toggle plugin:', error);
    }
  };

  const filteredPlugins = plugins.filter(plugin =>
    plugin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    plugin.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Plugins</h1>
          <p className="text-muted-foreground">Extend BigDeck with additional features</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search plugins..."
          className="w-full pl-10 pr-4 py-2.5 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Plugin List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading plugins...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPlugins.map((plugin) => (
            <PluginCard
              key={plugin.id}
              plugin={plugin}
              onToggle={(enabled) => togglePlugin(plugin.id, enabled)}
            />
          ))}

          {filteredPlugins.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted flex items-center justify-center">
                <Puzzle size={32} className="text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No Plugins Found</h3>
              <p className="text-muted-foreground">
                {searchQuery 
                  ? 'Try a different search term'
                  : 'Install plugins to extend functionality'
                }
              </p>
            </div>
          )}
        </div>
      )}

      {/* Info Section */}
      <div className="mt-8 p-4 bg-muted/50 rounded-xl">
        <h3 className="font-medium mb-2">Installing Plugins</h3>
        <p className="text-sm text-muted-foreground mb-3">
          Plugins can be installed by placing them in the plugins directory:
        </p>
        <code className="text-xs bg-muted px-2 py-1 rounded">
          ~/.config/bigdeck/plugins/
        </code>
      </div>
    </div>
  );
}

interface PluginCardProps {
  plugin: PluginInfo;
  onToggle: (enabled: boolean) => void;
}

function PluginCard({ plugin, onToggle }: PluginCardProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center flex-shrink-0">
          <Puzzle size={24} className="text-primary" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold">{plugin.name}</h3>
            <span className="text-xs text-muted-foreground">v{plugin.version}</span>
          </div>
          <p className="text-sm text-muted-foreground mb-2">{plugin.description}</p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>by {plugin.author}</span>
            <span>{plugin.actions.length} actions</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggle(!plugin.enabled)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
              plugin.enabled
                ? 'bg-green-500/20 text-green-500 hover:bg-green-500/30'
                : 'bg-muted hover:bg-accent'
            }`}
          >
            <Power size={14} />
            {plugin.enabled ? 'Enabled' : 'Disabled'}
          </button>
        </div>
      </div>

      {/* Actions List */}
      {plugin.enabled && plugin.actions.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <h4 className="text-sm font-medium mb-2">Available Actions</h4>
          <div className="flex flex-wrap gap-2">
            {plugin.actions.map((action) => (
              <span
                key={action.id}
                className="px-2 py-1 text-xs bg-muted rounded-md"
                title={action.description}
              >
                {action.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
