import { createHash } from 'node:crypto';
export class ContextDiffEngine {
    cache = new Map();
    diff(cacheKey, current) {
        const currentSnapshot = JSON.stringify({
            facts: current.memory.facts.map((f) => ({ id: f.id, content: f.content, confidence: f.confidence })),
            decisions: current.track.decisions.map((d) => d.content),
            blockers: current.track.blockers.map((b) => b.content),
        });
        const currentHash = this.hashString(currentSnapshot);
        const cached = this.cache.get(cacheKey);
        if (!cached) {
            this.cache.set(cacheKey, { hash: currentHash, snapshot: currentSnapshot });
            return null;
        }
        if (cached.hash === currentHash) {
            return null;
        }
        const previous = JSON.parse(cached.snapshot);
        const currentParsed = JSON.parse(currentSnapshot);
        const prevFactIds = new Set(previous.facts.map((f) => f.id));
        const currFactIds = new Set(currentParsed.facts.map((f) => f.id));
        const addedIds = [...currFactIds].filter((id) => !prevFactIds.has(id));
        const removedIds = [...prevFactIds].filter((id) => !currFactIds.has(id));
        const commonIds = [...currFactIds].filter((id) => prevFactIds.has(id));
        const addedFacts = addedIds
            .map((id) => current.memory.facts.find((f) => f.id === id))
            .filter(Boolean);
        const removedFacts = removedIds
            .map((id) => {
            const prevFact = previous.facts.find((f) => f.id === id);
            if (!prevFact)
                return null;
            return current.memory.facts.find((f) => f.id === id) || {
                id: prevFact.id,
                type: 'fact',
                content: prevFact.content,
                confidence: prevFact.confidence,
                timestamp: new Date().toISOString(),
                source: 'historical',
                tags: [],
                accessCount: 0,
                lastAccessed: new Date().toISOString(),
            };
        })
            .filter(Boolean);
        const modifiedFacts = [];
        for (const id of commonIds) {
            const prevFact = previous.facts.find((f) => f.id === id);
            const currFact = current.memory.facts.find((f) => f.id === id);
            if (prevFact && currFact && prevFact.content !== currFact.content) {
                modifiedFacts.push({
                    before: {
                        id: prevFact.id,
                        type: 'fact',
                        content: prevFact.content,
                        confidence: prevFact.confidence,
                        timestamp: new Date().toISOString(),
                        source: 'historical',
                        tags: [],
                        accessCount: 0,
                        lastAccessed: new Date().toISOString(),
                    },
                    after: currFact,
                });
            }
        }
        const newDecisions = currentParsed.decisions.filter((d) => !previous.decisions.includes(d));
        const resolvedBlockers = previous.blockers.filter((b) => !currentParsed.blockers.includes(b));
        this.cache.set(cacheKey, { hash: currentHash, snapshot: currentSnapshot });
        return {
            previousHash: cached.hash,
            currentHash,
            addedFacts,
            removedFacts,
            modifiedFacts,
            newDecisions,
            resolvedBlockers,
        };
    }
    hashString(input) {
        return createHash('sha256').update(input).digest('hex').slice(0, 16);
    }
    getCacheInfo() {
        return {
            keys: [...this.cache.keys()],
            size: this.cache.size,
        };
    }
}
