export class KnowledgeValidator {
    validate(item, relatedItems = []) {
        const issues = [];
        const suggestedUpdates = [];
        this.checkCompleteness(item, issues, suggestedUpdates);
        this.checkConfidence(item, issues);
        this.checkConsistency(item, relatedItems, issues, suggestedUpdates);
        this.checkFreshness(item, issues, suggestedUpdates);
        this.checkSourceQuality(item, issues, suggestedUpdates);
        return {
            itemId: item.id,
            isValid: issues.length === 0,
            issues,
            suggestedUpdates,
            validatedAt: new Date().toISOString(),
        };
    }
    validateBatch(items) {
        const results = [];
        for (const item of items) {
            const related = items.filter((i) => i.id !== item.id && (i.category === item.category || i.keyFindings.some((k) => item.keyFindings.includes(k))));
            results.push(this.validate(item, related));
        }
        return results;
    }
    checkCompleteness(item, issues, suggestions) {
        if (!item.summary || item.summary.trim().length === 0)
            issues.push('Missing summary');
        if (item.keyFindings.length === 0)
            issues.push('No key findings extracted');
        if (!item.category) {
            issues.push('Missing category');
            suggestions.push('Assign a category based on content analysis');
        }
        if (!item.source || item.source.trim().length === 0)
            issues.push('Missing source reference');
    }
    checkConfidence(item, issues) {
        if (item.confidenceScore < 0.3)
            issues.push(`Very low confidence (${(item.confidenceScore * 100).toFixed(0)}%)`);
        if (item.confidenceScore > 0.95 && item.sourceType === 'manual')
            issues.push('Confidence too high for manually entered knowledge');
        if (item.keyFindings.length === 0 && item.confidenceScore > 0.7)
            issues.push('High confidence but no findings to support it');
    }
    checkConsistency(item, relatedItems, issues, suggestions) {
        for (const related of relatedItems) {
            if (related.summary === item.summary && related.id !== item.id) {
                issues.push(`Duplicate of item ${related.id}`);
                suggestions.push(`Merge with ${related.id} or differentiate`);
                break;
            }
            if (related.category === item.category && Math.abs(related.confidenceScore - item.confidenceScore) > 0.4) {
                issues.push(`Confidence mismatch with similar item ${related.id}`);
            }
        }
        if (item.curated && !item.validatedAt)
            suggestions.push('Curated items should be validated');
    }
    checkFreshness(item, issues, suggestions) {
        if (item.publicationDate) {
            const age = Date.now() - new Date(item.publicationDate).getTime();
            const twoYears = 2 * 365 * 24 * 60 * 60 * 1000;
            if (age > twoYears)
                suggestions.push('Knowledge item >2 years old — consider reviewing relevance');
        }
        if (item.citations > 0 && item.citations < 3)
            issues.push('Low citation count for referenced knowledge');
    }
    checkSourceQuality(item, issues, suggestions) {
        const lowQualitySources = ['manual', 'unknown'];
        if (lowQualitySources.includes(item.sourceType) && !item.validatedAt) {
            suggestions.push('Manual/unknown sources should be validated before publishing');
        }
        if (item.references.length === 0 && item.sourceType === 'research-paper') {
            issues.push('Research paper has no references — possible data loss');
        }
    }
}
