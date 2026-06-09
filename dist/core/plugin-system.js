import * as fs from 'node:fs';
import * as path from 'node:path';
export class PluginSystem {
    plugins = new Map();
    handlers = new Map();
    eventLog = [];
    register(plugin, handler) {
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
    unregister(pluginId) {
        this.plugins.delete(pluginId);
        this.handlers.delete(pluginId);
    }
    subscribe(pluginId, hook, handler) {
        const pluginHandlers = this.handlers.get(pluginId);
        if (pluginHandlers) {
            pluginHandlers.set(hook.event, handler);
        }
    }
    emit(event, data) {
        this.eventLog.push({ event, timestamp: new Date().toISOString(), data });
        if (this.eventLog.length > 1000) {
            this.eventLog = this.eventLog.slice(-500);
        }
        const results = [];
        for (const [pluginId, pluginHandlers] of this.handlers) {
            const plugin = this.plugins.get(pluginId);
            if (!plugin || !plugin.enabled)
                continue;
            const hooks = plugin.hooks.filter((h) => h.event === event).sort((a, b) => b.priority - a.priority);
            for (const hook of hooks) {
                const handler = pluginHandlers.get(hook.event);
                if (handler) {
                    const context = {
                        emit: (e, d) => this.emit(e, d),
                        getConfig: () => plugin.config,
                    };
                    try {
                        const result = handler(data, context);
                        results.push(result);
                    }
                    catch {
                        // Plugin error suppressed
                    }
                }
            }
        }
        return results;
    }
    getEventLog() {
        return [...this.eventLog];
    }
    getPlugin(pluginId) {
        return this.plugins.get(pluginId);
    }
    getAllPlugins() {
        return [...this.plugins.values()];
    }
    enablePlugin(pluginId) {
        const plugin = this.plugins.get(pluginId);
        if (!plugin)
            return false;
        plugin.enabled = true;
        return true;
    }
    disablePlugin(pluginId) {
        const plugin = this.plugins.get(pluginId);
        if (!plugin)
            return false;
        plugin.enabled = false;
        return true;
    }
    saveState(outputDir) {
        const state = {
            plugins: [...this.plugins.values()],
            savedAt: new Date().toISOString(),
        };
        fs.mkdirSync(outputDir, { recursive: true });
        fs.writeFileSync(path.join(outputDir, 'plugin-state.json'), JSON.stringify(state, null, 2));
    }
    loadState(outputDir) {
        try {
            const statePath = path.join(outputDir, 'plugin-state.json');
            if (fs.existsSync(statePath)) {
                const state = JSON.parse(fs.readFileSync(statePath, 'utf-8'));
                for (const plugin of state.plugins || []) {
                    this.plugins.set(plugin.id, plugin);
                }
            }
        }
        catch { }
    }
}
