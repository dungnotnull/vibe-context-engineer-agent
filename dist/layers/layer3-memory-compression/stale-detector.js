export class StaleDetector {
    analyze(memory) {
        const allFacts = memory.facts;
        if (allFacts.length === 0) {
            return { staleFacts: [], stalenessRatio: 0, oldestFactAge: 0, recommendations: [] };
        }
        const now = Date.now();
        const staleFacts = [];
        let oldestTimestamp = now;
        for (const fact of allFacts) {
            const age = now - new Date(fact.timestamp).getTime();
            if (new Date(fact.timestamp).getTime() < oldestTimestamp) {
                oldestTimestamp = new Date(fact.timestamp).getTime();
            }
            const isStale = this.checkStaleness(fact, age, allFacts);
            if (isStale) {
                staleFacts.push(fact);
            }
        }
        const stalenessRatio = staleFacts.length / allFacts.length;
        const oldestFactAge = now - oldestTimestamp;
        const recommendations = this.generateRecommendations(stalenessRatio, staleFacts.length, allFacts.length);
        return { staleFacts, stalenessRatio, oldestFactAge, recommendations };
    }
    checkStaleness(fact, ageMs, allFacts) {
        // Hard TTL check
        if (fact.ttl && ageMs > fact.ttl)
            return true;
        // Soft staleness: low confidence + old
        if (fact.confidence < 0.5 && ageMs > 7 * 24 * 60 * 60 * 1000)
            return true;
        // Access-based staleness
        const daysSinceAccess = (Date.now() - new Date(fact.lastAccessed).getTime()) / (24 * 60 * 60 * 1000);
        if (fact.accessCount < 3 && daysSinceAccess > 30)
            return true;
        // Duplicate fact detected (same content, different IDs)
        const similar = allFacts.filter((f) => f.id !== fact.id &&
            f.content.toLowerCase() === fact.content.toLowerCase() &&
            new Date(f.timestamp).getTime() > new Date(fact.timestamp).getTime());
        if (similar.length > 0)
            return true;
        return false;
    }
    generateRecommendations(stalenessRatio, staleCount, totalCount) {
        const recommendations = [];
        if (stalenessRatio > 0.3) {
            recommendations.push(`High staleness (${(stalenessRatio * 100).toFixed(0)}%): Consider running cleanup or reviewing compression strategy`);
        }
        if (stalenessRatio > 0.5) {
            recommendations.push(`Critical staleness: ${staleCount}/${totalCount} facts are stale. Run forced cleanup.`);
        }
        if (stalenessRatio < 0.1 && totalCount > 10) {
            recommendations.push('Memory is fresh: retention policies are working well.');
        }
        return recommendations;
    }
}
