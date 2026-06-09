import type { ChangeEvent, ClassifiedChange } from '../../core/types.js';
export declare class ChangeIntelligenceEngine {
    private taskDetector;
    private architectureAnalyzer;
    constructor();
    classify(events: ChangeEvent[]): ClassifiedChange[];
    private classifySingle;
    private detectCategories;
    private detectComponents;
    private detectDependencyChanges;
    private detectSchemaChanges;
    private detectApiChanges;
    private detectBreakingChanges;
    private assessComplexity;
}
