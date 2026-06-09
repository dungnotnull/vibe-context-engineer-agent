import * as fs from 'node:fs';
import * as path from 'node:path';
import type { Plugin, PluginHook } from './types.js';

interface PluginContext {
  emit(event: string, data: unknown): void;
  getConfig(): Record<string, unknown>;
}

type PluginHandler = (data: unknown, context: PluginContext) => unknown;

export class PluginSystem {
  private plugins = new Map<string, Plugin>();
  private handlers = new Map<string, Map<string, PluginHandler>>();
  private eventLog: Array<{ event: string; timestamp: string; data: unknown }> = [];

  register(plugin: Plugin, handler?: PluginHandler): void {
    this.plugins.set(plugin.id, plugin);

    if (!this.handlers.has(plugin.id)) {
      this.handlers.set(plugin.id, new Map());
    }

    if (handler) {
      for (const hook of plugin.hooks) {
        this.subscribe(plugin.id, hook, handler);
      }
    }
  }

  unregister(pluginId: string): void {
    this.plugins.delete(pluginId);
    this.handlers.delete(pluginId);
  }

  subscribe(pluginId: string, hook: PluginHook, handler: PluginHandler): void {
    const pluginHandlers = this.handlers.get(pluginId);
    if (pluginHandlers) {
      pluginHandlers.set(hook.event, handler);
    }
  }

  emit(event: string, data: unknown): unknown[] {
    this.eventLog.push({ event, timestamp: new Date().toISOString(), data });
    if (this.eventLog.length > 1000) {
      this.eventLog = this.eventLog.slice(-500);
    }

    const results: unknown[] = [];

    for (const [pluginId, pluginHandlers] of this.handlers) {
      const plugin = this.plugins.get(pluginId);
      if (!plugin || !plugin.enabled) continue;

      const hooks = plugin.hooks.filter((h) => h.event === event).sort((a, b) => b.priority - a.priority);
      for (const hook of hooks) {
        const handler = pluginHandlers.get(hook.event);
        if (handler) {
          const context: PluginContext = {
            emit: (e, d) => this.emit(e, d),
            getConfig: () => plugin.config,
          };
          try {
            const result = handler(data, context);
            results.push(result);
          } catch {
            // Plugin error suppressed
          }
        }
      }
    }

    return results;
  }

  getEventLog(): Array<{ event: string; timestamp: string; data: unknown }> {
    return [...this.eventLog];
  }

  getPlugin(pluginId: string): Plugin | undefined {
    return this.plugins.get(pluginId);
  }

  getAllPlugins(): Plugin[] {
    return [...this.plugins.values()];
  }

  enablePlugin(pluginId: string): boolean {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return false;
    plugin.enabled = true;
    return true;
  }

  disablePlugin(pluginId: string): boolean {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return false;
    plugin.enabled = false;
    return true;
  }

  saveState(outputDir: string): void {
    const state = {
      plugins: [...this.plugins.values()],
      savedAt: new Date().toISOString(),
    };
    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(
      path.join(outputDir, 'plugin-state.json'),
      JSON.stringify(state, null, 2)
    );
  }

  loadState(outputDir: string): void {
    try {
      const statePath = path.join(outputDir, 'plugin-state.json');
      if (fs.existsSync(statePath)) {
        const state = JSON.parse(fs.readFileSync(statePath, 'utf-8'));
        for (const plugin of state.plugins || []) {
          this.plugins.set(plugin.id, plugin);
        }
      }
    } catch {}
  }
}
