import { randomUUID } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { EmbeddingEngine } from './embedding-engine.js';
import { KnowledgeValidator } from './knowledge-validator.js';
import { KnowledgeVersionManager } from './knowledge-versioning.js';
import { CuratedIngestionEngine } from './curated-ingestion.js';
export class KnowledgeBrain {
    storagePath;
    items = [];
    embeddingEngine;
    validator;
    versionManager;
    curatedIngestion;
    constructor(outputDir) {
        this.storagePath = path.join(outputDir, 'knowledge-brain.json');
        this.embeddingEngine = new EmbeddingEngine();
        this.validator = new KnowledgeValidator();
        this.versionManager = new KnowledgeVersionManager(outputDir);
        this.curatedIngestion = new CuratedIngestionEngine(outputDir);
        fs.mkdirSync(outputDir, { recursive: true });
        this.load();
    }
    ingestSource(source) {
        const item = {
            id: randomUUID(),
            source: source.url,
            sourceType: source.url.includes('arxiv') ? 'research-paper' : 'documentation',
            category: source.category,
            summary: source.title,
            keyFindings: source.content ? this.extractFindings(source.content) : [],
            confidenceScore: 0.7,
            relevanceScore: this.computeRelevance(source),
            version: 1,
            curated: false,
            references: source.url ? [source.url] : [],
            citations: 0,
            embedding: this.embeddingEngine.embed({ id: 'temp', source: source.url, sourceType: 'manual', category: source.category, summary: source.title, keyFindings: [], confidenceScore: 0.7, relevanceScore: 0.5, version: 1, curated: false, references: [], citations: 0 }),
        };
        this.items.push(item);
        this.save();
        return item;
    }
    ingestFromPipeline(memory, graph) {
        const newItems = [];
        const lessons = memory.facts.filter((f) => f.type === 'lesson');
        for (const lesson of lessons) {
            const item = {
                id: randomUUID(), source: 'pipeline', sourceType: 'pipeline', category: 'lesson-learned',
                summary: lesson.content, keyFindings: lesson.tags, confidenceScore: lesson.confidence, relevanceScore: 0.8,
                version: 1, curated: false, references: [], citations: 0,
            };
            newItems.push(item);
        }
        const graphPatterns = this.detectPatterns(graph);
        for (const pattern of graphPatterns) {
            const item = {
                id: randomUUID(), source: 'graph-analysis', sourceType: 'pipeline', category: 'architectural-pattern',
                summary: pattern, keyFindings: [], confidenceScore: 0.75, relevanceScore: 0.7,
                version: 1, curated: false, references: [], citations: 0,
            };
            newItems.push(item);
        }
        for (const item of newItems) {
            item.embedding = this.embeddingEngine.embed(item);
        }
        this.items.push(...newItems);
        this.save();
        return newItems;
    }
    validateAll() {
        return this.validator.validateBatch(this.items);
    }
    createVersion(releaseNotes, benchmarkScore) {
        return this.versionManager.createVersion(this.items, releaseNotes, benchmarkScore);
    }
    getVersion(versionNumber) {
        return this.versionManager.getVersion(versionNumber);
    }
    query(category, minRelevance = 0) {
        let results = this.items;
        if (category)
            results = results.filter((i) => i.category === category);
        if (minRelevance > 0)
            results = results.filter((i) => i.relevanceScore >= minRelevance);
        return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
    }
    search(term) {
        const lower = term.toLowerCase();
        return this.items
            .filter((i) => i.summary.toLowerCase().includes(lower) || i.keyFindings.some((k) => k.toLowerCase().includes(lower)))
            .sort((a, b) => b.relevanceScore - a.relevanceScore);
    }
    semanticSearch(query, limit = 10) {
        const queryItem = {
            id: 'query', source: 'search', sourceType: 'manual', category: 'context-engineering',
            summary: query, keyFindings: [], confidenceScore: 1, relevanceScore: 1,
            version: 1, curated: false, references: [], citations: 0,
        };
        return this.embeddingEngine.findSimilar(queryItem, this.items, 0.3, limit);
    }
    clusterKnowledge(maxClusters = 5) {
        return this.embeddingEngine.cluster(this.items, maxClusters);
    }
    getAll() {
        return [...this.items];
    }
    extractFindings(content) {
        return content
            .split(/[.!?]+/).map((s) => s.trim()).filter((s) => s.length > 30 && s.length < 300)
            .sort((a, b) => this.informationDensity(b) - this.informationDensity(a)).slice(0, 5);
    }
    informationDensity(text) {
        const words = text.split(/\s+/);
        return new Set(words.map((w) => w.toLowerCase())).size / words.length;
    }
    computeRelevance(source) {
        const weights = { 'context-engineering': 0.95, 'memory-systems': 0.9, 'ai-coding-agents': 0.85, 'repository-intelligence': 0.8 };
        return weights[source.category] || 0.5;
    }
    detectPatterns(graph) {
        const patterns = [];
        const connectionCount = new Map();
        for (const rel of graph.relations) {
            connectionCount.set(rel.source, (connectionCount.get(rel.source) || 0) + 1);
            connectionCount.set(rel.target, (connectionCount.get(rel.target) || 0) + 1);
        }
        for (const [nodeId, count] of connectionCount) {
            if (count >= 5) {
                const node = graph.nodes.find((n) => n.id === nodeId);
                if (node)
                    patterns.push(`Hub component: ${node.label} (${count} connections)`);
            }
        }
        const pairs = new Set();
        for (const rel of graph.relations) {
            if (rel.type === 'depends_on') {
                const key = `${rel.source}<->${rel.target}`;
                if (pairs.has(key))
                    patterns.push(`Circular dependency: ${rel.source} ↔ ${rel.target}`);
                pairs.add(key);
            }
        }
        return patterns;
    }
    load() {
        try {
            if (fs.existsSync(this.storagePath))
                this.items = JSON.parse(fs.readFileSync(this.storagePath, 'utf-8'));
        }
        catch {
            this.items = [];
        }
    }
    save() {
        fs.writeFileSync(this.storagePath, JSON.stringify(this.items, null, 2));
    }
}
