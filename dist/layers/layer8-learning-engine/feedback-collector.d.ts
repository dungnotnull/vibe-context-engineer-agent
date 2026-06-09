import type { FeedbackSignal } from '../../core/types.js';
export declare class FeedbackCollector {
    private feedbackPath;
    private signals;
    constructor(outputDir: string);
    record(signal: Omit<FeedbackSignal, 'id' | 'timestamp'>): FeedbackSignal;
    query(filters: {
        source?: string;
        type?: string;
        minScore?: number;
        since?: string;
    }): FeedbackSignal[];
    getStats(): {
        total: number;
        averageScore: number;
        bySource: Record<string, number>;
        byType: Record<string, number>;
        trend: 'improving' | 'declining' | 'stable';
    };
    private load;
    private save;
}
