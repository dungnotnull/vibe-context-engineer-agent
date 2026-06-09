import * as fs from 'node:fs';
import * as path from 'node:path';
import { randomUUID } from 'node:crypto';
import type {
  GovernanceConfig,
  AccessControl,
  AuditLogConfig,
  RetentionPolicy,
  ComplianceConfig,
} from './types.js';

interface AuditEntry {
  id: string;
  timestamp: string;
  event: string;
  resource: string;
  actor: string;
  result: 'allowed' | 'denied';
  details: string;
}

export class GovernanceManager {
  private config: GovernanceConfig;
  private auditLog: AuditEntry[] = [];
  private auditPath: string;

  constructor(config: GovernanceConfig, outputDir: string) {
    this.config = config;
    this.auditPath = path.join(outputDir, 'audit-log.json');
    fs.mkdirSync(outputDir, { recursive: true });
    this.loadAuditLog();
  }

  checkAccess(resource: string, role: string, permission: 'read' | 'write' | 'admin'): boolean {
    const rule = this.config.accessControl.find(
      (ac) => ac.resource === resource || ac.resource === '*'
    );
    if (!rule) return false;

    const allowed = rule.roles.includes(role) && rule.permissions.includes(permission);
    this.audit('access', resource, role, allowed ? 'allowed' : 'denied', permission);
    return allowed;
  }

  audit(event: string, resource: string, actor: string, result: 'allowed' | 'denied', details: string): void {
    if (!this.config.auditLog.enabled) return;
    if (!this.config.auditLog.events.includes(event as never)) return;

    const entry: AuditEntry = {
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      event,
      resource,
      actor,
      result,
      details,
    };

    this.auditLog.push(entry);
    if (this.auditLog.length > 10000) {
      this.auditLog = this.auditLog.slice(-5000);
    }
    this.saveAuditLog();
  }

  getAuditLog(filters?: {
    event?: string;
    actor?: string;
    result?: string;
    since?: string;
  }): AuditEntry[] {
    let entries = this.auditLog;

    if (filters?.event) entries = entries.filter((e) => e.event === filters.event);
    if (filters?.actor) entries = entries.filter((e) => e.actor === filters.actor);
    if (filters?.result) entries = entries.filter((e) => e.result === filters.result);
    if (filters?.since) {
      const sinceDate = new Date(filters.since).getTime();
      entries = entries.filter((e) => new Date(e.timestamp).getTime() >= sinceDate);
    }

    return entries;
  }

  shouldRetain(timestamp: string, level: 'shortTerm' | 'workingTerm' | 'longTerm'): boolean {
    const age = Date.now() - new Date(timestamp).getTime();
    const daysAge = age / (24 * 60 * 60 * 1000);
    const policy = this.config.retention;

    switch (level) {
      case 'shortTerm': return daysAge <= policy.shortTermDays;
      case 'workingTerm': return daysAge <= policy.workingTermDays;
      case 'longTerm': return daysAge <= policy.longTermDays;
      default: return false;
    }
  }

  getComplianceReport(): string {
    const lines: string[] = [
      '# Compliance Report',
      '',
      `Generated: ${new Date().toISOString()}`,
      '',
      '## Access Control Rules',
      '',
      ...this.config.accessControl.map(
        (ac) => `- Resource: \`${ac.resource}\`, Roles: ${ac.roles.join(', ')}, Permissions: ${ac.permissions.join(', ')}`
      ),
      '',
      '## Retention Policy',
      '',
      `- Short-term: ${this.config.retention.shortTermDays} days`,
      `- Working-term: ${this.config.retention.workingTermDays} days`,
      `- Long-term: ${this.config.retention.longTermDays} days`,
      `- Auto-cleanup: ${this.config.retention.autoCleanup ? 'Enabled' : 'Disabled'}`,
      '',
      '## Compliance',
      '',
      `- GDPR: ${this.config.compliance.gdprEnabled ? 'Enabled' : 'Disabled'}`,
    ];

    return lines.join('\n');
  }

  exportData(outputPath: string): void {
    const data = {
      accessControl: this.config.accessControl,
      auditLog: this.auditLog,
      retention: this.config.retention,
      exportedAt: new Date().toISOString(),
    };
    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
  }

  anonymizeKnowledge(text: string): string {
    let result = text;
    for (const rule of this.config.compliance.anonymizationRules) {
      try {
        const regex = new RegExp(rule, 'gi');
        result = result.replace(regex, '[REDACTED]');
      } catch {}
    }
    return result;
  }

  private loadAuditLog(): void {
    try {
      if (fs.existsSync(this.auditPath)) {
        this.auditLog = JSON.parse(fs.readFileSync(this.auditPath, 'utf-8'));
      }
    } catch {}
  }

  private saveAuditLog(): void {
    fs.writeFileSync(this.auditPath, JSON.stringify(this.auditLog, null, 2));
  }
}
