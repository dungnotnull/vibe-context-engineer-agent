import * as fs from 'node:fs';
import * as path from 'node:path';
import { randomUUID } from 'node:crypto';
export class CuratedIngestionEngine {
    queuePath;
    processedPath;
    constructor(outputDir) {
        const dir = path.join(outputDir, 'kb-ingestion');
        fs.mkdirSync(dir, { recursive: true });
        this.queuePath = path.join(dir, 'queue.json');
        this.processedPath = path.join(dir, 'processed.json');
    }
    enqueue(content) {
        const queue = this.getQueue();
        const id = randomUUID();
        queue.push({ id, content, enqueuedAt: new Date().toISOString() });
        fs.writeFileSync(this.queuePath, JSON.stringify(queue, null, 2));
        return id;
    }
    dequeueBatch(maxItems = 10) {
        const queue = this.getQueue();
        const batch = queue.splice(0, maxItems);
        fs.writeFileSync(this.queuePath, JSON.stringify(queue, null, 2));
        return batch;
    }
    processContent(content) {
        const findings = this.extractFindings(content.raw);
        const item = {
            id: randomUUID(),
            source: content.url,
            sourceType: content.sourceType,
            category: content.category,
            summary: this.generateSummary(content.raw),
            keyFindings: findings,
            confidenceScore: this.estimateConfidence(content),
            relevanceScore: this.computeRelevance(content),
            version: 1,
            curated: true,
            references: content.raw.match(/https?:\/\/[^\s]+/g) || [],
            citations: 0,
        };
        this.markProcessed(item.id);
        return item;
    }
    extractFindings(raw) {
        const sentences = raw
            .split(/[.!?\n]+/)
            .map((s) => s.trim())
            .filter((s) => s.length > 40 && s.length < 500);
        const scored = sentences.map((s) => ({
            text: s,
            score: this.scoreSentence(s),
        }));
        return scored
            .sort((a, b) => b.score - a.score)
            .slice(0, 8)
            .map((s) => s.text);
    }
    scoreSentence(sentence) {
        let score = 0;
        const lower = sentence.toLowerCase();
        const highValueTerms = [
            'context', 'memory', 'token', 'compression', 'agent',
            'architecture', 'performance', 'reduction', 'quality',
            'benchmark', 'retrieval', 'embedding', 'semantic',
            'hierarchical', 'summarization',
        ];
        for (const term of highValueTerms) {
            if (lower.includes(term))
                score += 0.15;
        }
        const uniqueWords = new Set(lower.split(/\s+/));
        score += uniqueWords.size / 50;
        return Math.min(1, score);
    }
    generateSummary(raw) {
        const firstSentence = raw.split(/[.!?]/)[0]?.trim();
        if (firstSentence && firstSentence.length > 20 && firstSentence.length < 300) {
            return firstSentence;
        }
        return raw.slice(0, 200).replace(/\n/g, ' ').trim();
    }
    estimateConfidence(content) {
        let confidence = 0.5;
        if (content.sourceType === 'research-paper')
            confidence += 0.25;
        if (content.sourceType === 'documentation')
            confidence += 0.2;
        if (content.sourceType === 'benchmark')
            confidence += 0.3;
        if (content.raw.length > 500)
            confidence += 0.1;
        return Math.min(1, confidence);
    }
    computeRelevance(content) {
        const categoryWeights = {
            'context-engineering': 0.95,
            'memory-systems': 0.9,
            'ai-coding-agents': 0.85,
            'repository-intelligence': 0.8,
            'agent-architecture': 0.75,
            'benchmark-results': 0.7,
            'lesson-learned': 0.65,
            'architectural-pattern': 0.7,
        };
        return Math.min(1, (categoryWeights[content.category] || 0.5) * 1.1);
    }
    getQueue() {
        try {
            if (fs.existsSync(this.queuePath)) {
                return JSON.parse(fs.readFileSync(this.queuePath, 'utf-8'));
            }
        }
        catch { }
        return [];
    }
    markProcessed(id) {
        try {
            const processed = fs.existsSync(this.processedPath)
                ? JSON.parse(fs.readFileSync(this.processedPath, 'utf-8'))
                : [];
            processed.push({ id, processedAt: new Date().toISOString() });
            fs.writeFileSync(this.processedPath, JSON.stringify(processed, null, 2));
        }
        catch { }
    }
}
