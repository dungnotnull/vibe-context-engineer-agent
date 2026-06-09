import type { FileDiffDetail, DiffSummary } from '../../core/types.js';
export declare class DiffParser {
    parseHunks(rawDiff: string): FileDiffDetail[];
    generateSummary(details: FileDiffDetail[]): DiffSummary;
    private extractModules;
}
