import { randomUUID } from 'node:crypto';
export class ABTestEngine {
    activeTests = new Map();
    results = [];
    createTest(strategyA, strategyB) {
        const testId = randomUUID();
        this.activeTests.set(testId, {
            strategyA,
            strategyB,
            resultsA: [],
            resultsB: [],
        });
        return testId;
    }
    recordTrial(testId, variant, qualityScore, reductionRatio) {
        const test = this.activeTests.get(testId);
        if (!test)
            return;
        if (variant === 'A') {
            test.resultsA.push({ qualityScore, reductionRatio });
        }
        else {
            test.resultsB.push({ qualityScore, reductionRatio });
        }
    }
    concludeTest(testId) {
        const test = this.activeTests.get(testId);
        if (!test || test.resultsA.length === 0 || test.resultsB.length === 0)
            return null;
        const avgA = {
            qualityScore: this.avg(test.resultsA.map((r) => r.qualityScore)),
            reductionRatio: this.avg(test.resultsA.map((r) => r.reductionRatio)),
        };
        const avgB = {
            qualityScore: this.avg(test.resultsB.map((r) => r.qualityScore)),
            reductionRatio: this.avg(test.resultsB.map((r) => r.reductionRatio)),
        };
        const scoreA = avgA.qualityScore * 0.5 + avgA.reductionRatio * 0.5;
        const scoreB = avgB.qualityScore * 0.5 + avgB.reductionRatio * 0.5;
        let winner;
        if (Math.abs(scoreA - scoreB) < 0.03) {
            winner = 'tie';
        }
        else {
            winner = scoreA > scoreB ? 'A' : 'B';
        }
        const sampleSize = Math.min(test.resultsA.length, test.resultsB.length);
        const confidence = Math.min(0.99, sampleSize / 50);
        const result = {
            testId,
            variantA: {
                strategy: test.strategyA,
                qualityScore: avgA.qualityScore,
                reductionRatio: avgA.reductionRatio,
            },
            variantB: {
                strategy: test.strategyB,
                qualityScore: avgB.qualityScore,
                reductionRatio: avgB.reductionRatio,
            },
            winner,
            confidence,
            sampleSize,
            timestamp: new Date().toISOString(),
        };
        this.results.push(result);
        this.activeTests.delete(testId);
        return result;
    }
    getAllResults() {
        return [...this.results];
    }
    getActiveTest(testId) {
        return this.activeTests.get(testId);
    }
    avg(values) {
        return values.length === 0 ? 0 : values.reduce((s, v) => s + v, 0) / values.length;
    }
}
