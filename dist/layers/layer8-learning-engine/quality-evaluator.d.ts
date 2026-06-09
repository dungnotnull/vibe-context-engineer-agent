import type { QualityEvaluation, CompressedMemory, FeedbackSignal } from '../../core/types.js';
export declare class QualityEvaluator {
    evaluate(contextId: string, memory: CompressedMemory, feedback?: FeedbackSignal[]): QualityEvaluation;
    private scoreRelevance;
    private scoreCompleteness;
    private scoreConciseness;
    private scoreAccuracy;
    private scoreFreshness;
    private generateSuggestions;
}
