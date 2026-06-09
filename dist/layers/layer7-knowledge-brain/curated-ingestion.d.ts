import type { KnowledgeItem, KnowledgeCategory } from '../../core/types.js';
interface IngestedContent {
    raw: string;
    url: string;
    sourceType: KnowledgeItem['sourceType'];
    category: KnowledgeCategory;
}
export declare class CuratedIngestionEngine {
    private queuePath;
    private processedPath;
    constructor(outputDir: string);
    enqueue(content: IngestedContent): string;
    dequeueBatch(maxItems?: number): Array<{
        id: string;
        content: IngestedContent;
    }>;
    processContent(content: IngestedContent): KnowledgeItem;
    private extractFindings;
    private scoreSentence;
    private generateSummary;
    private estimateConfidence;
    private computeRelevance;
    private getQueue;
    private markProcessed;
}
export {};
