import type { KnowledgeItem, KnowledgeValidationResult } from '../../core/types.js';
export declare class KnowledgeValidator {
    validate(item: KnowledgeItem, relatedItems?: KnowledgeItem[]): KnowledgeValidationResult;
    validateBatch(items: KnowledgeItem[]): KnowledgeValidationResult[];
    private checkCompleteness;
    private checkConfidence;
    private checkConsistency;
    private checkFreshness;
    private checkSourceQuality;
}
