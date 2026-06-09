import type { KnowledgeItem, KnowledgeVersion } from '../../core/types.js';
export declare class KnowledgeVersionManager {
    private versionsDir;
    constructor(outputDir: string);
    createVersion(items: KnowledgeItem[], releaseNotes: string, benchmarkScore?: number): KnowledgeVersion;
    getVersion(versionNumber: number): KnowledgeVersion | null;
    getLatestVersion(): KnowledgeVersion | null;
    getVersionIndex(): Array<{
        version: number;
        releasedAt: string;
        releaseNotes: string;
        itemCount: number;
    }>;
    diff(versionA: number, versionB: number): {
        added: KnowledgeItem[];
        removed: KnowledgeItem[];
        modified: {
            before: KnowledgeItem;
            after: KnowledgeItem;
        }[];
    };
    rollback(targetVersion: number): KnowledgeVersion | null;
    private getNextVersion;
    cleanup(maxVersions?: number): number;
}
