export class EmbeddingEngine {
    dimensions;
    STOP_WORDS = new Set([
        'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but',
        'in', 'with', 'to', 'for', 'of', 'that', 'this', 'it', 'by',
        'be', 'as', 'from', 'are', 'was', 'were', 'been', 'being',
        'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
        'could', 'should', 'may', 'might', 'can', 'shall', 'not',
    ]);
    constructor(dimensions = 128) {
        this.dimensions = dimensions;
    }
    embed(item) {
        const tokens = this.tokenize(item);
        if (tokens.length === 0)
            return new Array(this.dimensions).fill(0);
        const vector = new Array(this.dimensions).fill(0);
        let seed = this.hashString(item.id + item.summary);
        for (let i = 0; i < this.dimensions; i++) {
            let value = 0;
            for (let j = 0; j < tokens.length; j++) {
                const tokenHash = this.hashString(tokens[j] + i);
                seed = this.nextSeed(seed);
                value += (tokenHash % 1000) / 1000 * (i + 1) / (j + 1);
            }
            vector[i] = Math.tanh(value / Math.sqrt(tokens.length));
        }
        return vector;
    }
    embedBatch(items) {
        const embeddings = new Map();
        for (const item of items) {
            embeddings.set(item.id, this.embed(item));
        }
        return embeddings;
    }
    similarity(a, b) {
        if (a.length !== b.length)
            return 0;
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        for (let i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }
        const denominator = Math.sqrt(normA) * Math.sqrt(normB);
        return denominator === 0 ? 0 : dotProduct / denominator;
    }
    findSimilar(query, candidates, threshold = 0.6, limit = 10) {
        const queryVec = this.embed(query);
        const results = [];
        for (const candidate of candidates) {
            if (candidate.id === query.id)
                continue;
            const candidateVec = candidate.embedding || this.embed(candidate);
            const score = this.similarity(queryVec, candidateVec);
            if (score >= threshold) {
                results.push({ item: candidate, score });
            }
        }
        return results.sort((a, b) => b.score - a.score).slice(0, limit);
    }
    cluster(items, maxClusters = 5) {
        if (items.length === 0)
            return new Map();
        const embeddings = this.embedBatch(items);
        const vectors = items.map((item) => embeddings.get(item.id));
        // K-means initialization
        const centroids = [];
        const used = new Set();
        while (centroids.length < Math.min(maxClusters, items.length)) {
            const idx = Math.floor(Math.random() * items.length);
            if (!used.has(idx)) {
                used.add(idx);
                centroids.push([...vectors[idx]]);
            }
        }
        // Assignment and update loop
        for (let iter = 0; iter < 10; iter++) {
            const clusters = new Map();
            for (let i = 0; i < vectors.length; i++) {
                let bestCentroid = 0;
                let bestSimilarity = -1;
                for (let c = 0; c < centroids.length; c++) {
                    const sim = this.similarity(vectors[i], centroids[c]);
                    if (sim > bestSimilarity) {
                        bestSimilarity = sim;
                        bestCentroid = c;
                    }
                }
                if (!clusters.has(bestCentroid))
                    clusters.set(bestCentroid, []);
                clusters.get(bestCentroid).push(vectors[i]);
            }
            // Update centroids
            for (let c = 0; c < centroids.length; c++) {
                const cluster = clusters.get(c) || [];
                if (cluster.length > 0) {
                    for (let d = 0; d < this.dimensions; d++) {
                        centroids[c][d] = cluster.reduce((sum, v) => sum + v[d], 0) / cluster.length;
                    }
                }
            }
        }
        // Final assignment
        const result = new Map();
        for (let i = 0; i < items.length; i++) {
            let bestCentroid = 0;
            let bestSimilarity = -1;
            for (let c = 0; c < centroids.length; c++) {
                const sim = this.similarity(vectors[i], centroids[c]);
                if (sim > bestSimilarity) {
                    bestSimilarity = sim;
                    bestCentroid = c;
                }
            }
            if (!result.has(bestCentroid))
                result.set(bestCentroid, []);
            result.get(bestCentroid).push(items[i]);
        }
        return result;
    }
    tokenize(item) {
        const text = `${item.summary} ${item.keyFindings.join(' ')} ${item.category} ${item.source}`;
        return text
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, ' ')
            .split(/\s+/)
            .filter((t) => t.length > 1 && !this.STOP_WORDS.has(t));
    }
    hashString(input) {
        let hash = 0;
        for (let i = 0; i < input.length; i++) {
            const char = input.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash);
    }
    nextSeed(seed) {
        seed = (seed * 1103515245 + 12345) & 0x7fffffff;
        return seed;
    }
    getDimensions() {
        return this.dimensions;
    }
}
