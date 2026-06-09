import type { GovernanceConfig } from './types.js';
interface AuditEntry {
    id: string;
    timestamp: string;
    event: string;
    resource: string;
    actor: string;
    result: 'allowed' | 'denied';
    details: string;
}
export declare class GovernanceManager {
    private config;
    private auditLog;
    private auditPath;
    constructor(config: GovernanceConfig, outputDir: string);
    checkAccess(resource: string, role: string, permission: 'read' | 'write' | 'admin'): boolean;
    audit(event: string, resource: string, actor: string, result: 'allowed' | 'denied', details: string): void;
    getAuditLog(filters?: {
        event?: string;
        actor?: string;
        result?: string;
        since?: string;
    }): AuditEntry[];
    shouldRetain(timestamp: string, level: 'shortTerm' | 'workingTerm' | 'longTerm'): boolean;
    getComplianceReport(): string;
    exportData(outputPath: string): void;
    anonymizeKnowledge(text: string): string;
    private loadAuditLog;
    private saveAuditLog;
}
export {};
