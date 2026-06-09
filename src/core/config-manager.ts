import * as fs from 'node:fs';
import * as path from 'node:path';
import type { ManagedConfig, RetentionPolicy, GovernanceConfig, Plugin } from './types.js';

const DEFAULT_RETENTION: RetentionPolicy = {
  shortTermDays: 7,
  workingTermDays: 30,
  longTermDays: 365,
  autoCleanup: true,
};

const DEFAULT_GOVERNANCE: GovernanceConfig = {
  accessControl: [
    { resource: '*', roles: ['admin'], permissions: ['read', 'write', 'admin'] },
    { resource: 'graph', roles: ['developer', 'admin'], permissions: ['read', 'write'] },
    { resource: 'knowledge', roles: ['developer', 'admin'], permissions: ['read', 'write'] },
    { resource: 'tracking', roles: ['developer', 'admin'], permissions: ['read'] },
  ],
  auditLog: {
    enabled: true,
    logPath: '.vcea/audit-log.json',
    events: ['access', 'modify', 'delete', 'export'],
  },
  retention: DEFAULT_RETENTION,
  compliance: {
    gdprEnabled: false,
    dataExportPath: '.vcea/exports',
    anonymizationRules: ['[\\w.-]+@[\\w.-]+\\.\\w+'],
  },
};

export class ConfigManager {
  static load(repoPath: string, outputDir?: string): ManagedConfig {
    const resolvedOutputDir = outputDir || '.vcea';
    const configPath = path.join(repoPath, resolvedOutputDir, 'vcea-config.json');

    const defaults: ManagedConfig = {
      repoPath,
      outputDir: resolvedOutputDir,
      watchMode: false,
      agentTypes: ['claude-code', 'cursor', 'archon', 'aider', 'opencode', 'openhands'],
      graphStorage: 'json',
      retention: DEFAULT_RETENTION,
    };

    if (!fs.existsSync(configPath)) {
      return defaults;
    }

    try {
      const fileConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      return ConfigManager.mergeDefaults(defaults, fileConfig);
    } catch {
      return defaults;
    }
  }

  static save(config: ManagedConfig): void {
    const configPath = path.join(config.outputDir, 'vcea-config.json');
    fs.mkdirSync(config.outputDir, { recursive: true });
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  }

  static createDefaultConfig(repoPath: string, outputDir: string): ManagedConfig {
    return {
      repoPath,
      outputDir,
      watchMode: false,
      agentTypes: ['claude-code', 'cursor', 'archon', 'aider', 'opencode', 'openhands'],
      graphStorage: 'json',
      retention: DEFAULT_RETENTION,
      governance: DEFAULT_GOVERNANCE,
      plugins: [],
    };
  }

  static validate(config: Partial<ManagedConfig>): string[] {
    const errors: string[] = [];

    if (!config.repoPath) errors.push('repoPath is required');
    if (config.graphStorage && !['json', 'neo4j'].includes(config.graphStorage)) {
      errors.push('graphStorage must be "json" or "neo4j"');
    }
    if (config.graphStorage === 'neo4j' && !config.neo4jUri) {
      errors.push('neo4jUri is required when graphStorage is "neo4j"');
    }
    if (config.retention) {
      if (config.retention.shortTermDays < 1) errors.push('shortTermDays must be >= 1');
      if (config.retention.workingTermDays < config.retention.shortTermDays) {
        errors.push('workingTermDays must be >= shortTermDays');
      }
      if (config.retention.longTermDays < config.retention.workingTermDays) {
        errors.push('longTermDays must be >= workingTermDays');
      }
    }

    return errors;
  }

  private static mergeDefaults(defaults: ManagedConfig, override: Partial<ManagedConfig>): ManagedConfig {
    return {
      ...defaults,
      ...override,
      agentTypes: override.agentTypes || defaults.agentTypes,
      retention: override.retention
        ? { ...defaults.retention, ...override.retention }
        : defaults.retention,
      governance: override.governance
        ? { ...defaults.governance, ...override.governance }
        : defaults.governance,
      multiRepo: override.multiRepo,
      plugins: override.plugins || [],
    };
  }
}
