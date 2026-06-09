import type { ClassifiedChange, HierarchicalSummary } from '../../core/types.js';
export declare class HierarchicalSummarizer {
    summarize(changes: ClassifiedChange[]): HierarchicalSummary | null;
    private buildFileLevel;
    private buildModuleLevel;
    private buildSystemLevel;
    private extractKeyPoints;
}
