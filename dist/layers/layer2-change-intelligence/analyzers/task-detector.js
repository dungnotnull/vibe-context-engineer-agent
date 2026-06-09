export class TaskDetector {
    detect(event) {
        const detectedTasks = [];
        const message = event.summary.toLowerCase();
        const allDiffs = event.diffs.map((d) => d.rawDiff).join('\n');
        const allFiles = event.diffs.flatMap((d) => d.files).map((f) => f.filePath);
        const taskPatterns = [
            { pattern: /(?:fix(?:es|ed)?|resolve[sd]?)\s+(?:#\d+|bug|issue)/i, status: 'completed', confidence: 0.9 },
            { pattern: /(?:implement[sd]?|add[sd]?)\s+(?:feature|support|ability)/i, status: 'completed', confidence: 0.85 },
            { pattern: /(?:close[sd]?|complete[sd]?)\s+(?:#\d+|task|ticket)/i, status: 'completed', confidence: 0.95 },
            { pattern: /wip|work in progress|in progress/i, status: 'partial', confidence: 0.8 },
            { pattern: /todo|to-do|needs work|remaining/i, status: 'partial', confidence: 0.7 },
            { pattern: /revert|rollback|undo/i, status: 'abandoned', confidence: 0.75 },
            { pattern: /deprecated|removed|deleted/i, status: 'abandoned', confidence: 0.7 },
        ];
        for (const tp of taskPatterns) {
            if (tp.pattern.test(message)) {
                detectedTasks.push({
                    description: message,
                    status: tp.status,
                    confidence: tp.confidence,
                    sourceHint: 'commit-message',
                    filesInvolved: allFiles,
                });
            }
        }
        // Detect task completion from TODO/FIXME removal in diffs
        const removedTodos = (allDiffs.match(/^-\s*(?:\/\/|#|--)\s*(?:TODO|FIXME|HACK):/gm) || []).length;
        const addedTodos = (allDiffs.match(/^\+\s*(?:\/\/|#|--)\s*(?:TODO|FIXME|HACK):/gm) || []).length;
        if (removedTodos > 0 && removedTodos > addedTodos) {
            detectedTasks.push({
                description: `${removedTodos} TODO(s)/FIXME(s) removed`,
                status: 'completed',
                confidence: 0.85,
                sourceHint: 'diff-analysis',
                filesInvolved: allFiles,
            });
        }
        if (addedTodos > removedTodos) {
            detectedTasks.push({
                description: `${addedTodos} TODO(s)/FIXME(s) added`,
                status: 'partial',
                confidence: 0.75,
                sourceHint: 'diff-analysis',
                filesInvolved: allFiles,
            });
        }
        // Detect test file changes as task completions
        const testFiles = allFiles.filter((f) => /(?:test|spec|__tests__)/i.test(f));
        if (testFiles.length > 0) {
            const nonTestFiles = allFiles.filter((f) => !/(?:test|spec|__tests__)/i.test(f));
            if (nonTestFiles.length > 0) {
                detectedTasks.push({
                    description: `Tests added/modified alongside ${nonTestFiles.length} source file(s)`,
                    status: 'completed',
                    confidence: 0.8,
                    sourceHint: 'test-correlation',
                    filesInvolved: [...testFiles, ...nonTestFiles],
                });
            }
        }
        const completedTasks = detectedTasks
            .filter((t) => t.status === 'completed')
            .map((t) => t.description);
        const partialTasks = detectedTasks
            .filter((t) => t.status === 'partial')
            .map((t) => t.description);
        const abandonedTasks = detectedTasks
            .filter((t) => t.status === 'abandoned')
            .map((t) => t.description);
        return { detectedTasks, completedTasks, partialTasks, abandonedTasks };
    }
}
