export class HierarchicalSummarizer {
    summarize(changes) {
        if (changes.length === 0)
            return null;
        const allFileDetails = [];
        for (const cc of changes) {
            for (const diff of cc.event.diffs) {
                allFileDetails.push(...diff.fileDetails);
            }
        }
        if (allFileDetails.length === 0)
            return null;
        // Level 1: File summaries
        const fileSummaries = this.buildFileLevel(allFileDetails);
        // Level 2: Module summaries (group by top-level directories)
        const moduleSummaries = this.buildModuleLevel(fileSummaries);
        // Build system-level summary
        return this.buildSystemLevel(moduleSummaries, changes);
    }
    buildFileLevel(details) {
        return details.map((detail) => {
            const keyPoints = this.extractKeyPoints(detail);
            return {
                level: 'file',
                scope: detail.filePath,
                summary: `${detail.status} ${detail.filePath}: ${detail.additions}/${detail.deletions} +/-`,
                keyPoints,
                childSummaries: [],
                stats: {
                    files: 1,
                    additions: detail.additions,
                    deletions: detail.deletions,
                },
            };
        });
    }
    buildModuleLevel(fileSummaries) {
        const modules = new Map();
        for (const fs of fileSummaries) {
            const parts = fs.scope.replace(/\\/g, '/').split('/');
            const moduleName = parts.length >= 2 ? parts.slice(0, 2).join('/') : parts[0];
            if (!modules.has(moduleName)) {
                modules.set(moduleName, []);
            }
            modules.get(moduleName).push(fs);
        }
        const result = [];
        for (const [moduleName, children] of modules) {
            const totalAdditions = children.reduce((s, c) => s + c.stats.additions, 0);
            const totalDeletions = children.reduce((s, c) => s + c.stats.deletions, 0);
            const allKeyPoints = children.flatMap((c) => c.keyPoints);
            result.push({
                level: 'module',
                scope: moduleName,
                summary: `Module ${moduleName}: ${children.length} file(s), ${totalAdditions}/${totalDeletions} +/-`,
                keyPoints: [...new Set(allKeyPoints)].slice(0, 10),
                childSummaries: children,
                stats: {
                    files: children.length,
                    additions: totalAdditions,
                    deletions: totalDeletions,
                },
            });
        }
        return result;
    }
    buildSystemLevel(moduleSummaries, changes) {
        const totalFiles = moduleSummaries.reduce((s, m) => s + m.stats.files, 0);
        const totalAdditions = moduleSummaries.reduce((s, m) => s + m.stats.additions, 0);
        const totalDeletions = moduleSummaries.reduce((s, m) => s + m.stats.deletions, 0);
        const allCategories = new Set(changes.flatMap((c) => c.categories));
        const allComponents = new Set(changes.flatMap((c) => c.affectedComponents));
        const keyPoints = [
            `Changed ${totalFiles} file(s) across ${moduleSummaries.length} module(s)`,
            `Categories: ${[...allCategories].join(', ')}`,
            `Components affected: ${[...allComponents].slice(0, 8).join(', ')}`,
        ];
        return {
            level: 'system',
            scope: 'repository',
            summary: `${totalFiles} file(s) changed (${totalAdditions}+, ${totalDeletions}-) across ${moduleSummaries.length} module(s)`,
            keyPoints,
            childSummaries: moduleSummaries,
            stats: {
                files: totalFiles,
                additions: totalAdditions,
                deletions: totalDeletions,
            },
        };
    }
    extractKeyPoints(detail) {
        const points = [];
        if (detail.status === 'added') {
            points.push(`New file: ${detail.filePath}`);
        }
        else if (detail.status === 'deleted') {
            points.push(`Deleted: ${detail.filePath}`);
        }
        for (const hunk of detail.hunks) {
            const addedLines = hunk.lines.filter((l) => l.startsWith('+')).length;
            const removedLines = hunk.lines.filter((l) => l.startsWith('-')).length;
            if (addedLines > 5 || removedLines > 5) {
                const context = hunk.header || 'code section';
                points.push(`${context}: ${addedLines}+, ${removedLines}-`);
            }
        }
        return points.slice(0, 5);
    }
}
