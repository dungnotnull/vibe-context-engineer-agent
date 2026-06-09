import * as path from 'node:path';
const LANGUAGE_MAP = {
    ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
    py: 'python', java: 'java', go: 'go', rs: 'rust', rb: 'ruby',
    cpp: 'cpp', c: 'c', cs: 'csharp', php: 'php', swift: 'swift',
    kt: 'kotlin', scala: 'scala', sql: 'sql', sh: 'shell', yaml: 'yaml',
    yml: 'yaml', json: 'json', xml: 'xml', html: 'html', css: 'css',
    md: 'markdown', prisma: 'prisma', graphql: 'graphql', proto: 'protobuf',
};
export class DiffParser {
    parseHunks(rawDiff) {
        if (!rawDiff || rawDiff.trim().length === 0)
            return [];
        const details = [];
        const fileSections = rawDiff.split(/^diff --git /m).slice(1);
        for (const section of fileSections) {
            const pathMatch = section.match(/^a\/(.+?) b\/(.+?)$/m);
            if (!pathMatch)
                continue;
            const aPath = pathMatch[1];
            const bPath = pathMatch[2];
            let filePath;
            let oldPath;
            let status;
            if (aPath === '/dev/null') {
                filePath = bPath;
                status = 'added';
            }
            else if (bPath === '/dev/null') {
                filePath = aPath;
                status = 'deleted';
            }
            else if (aPath !== bPath) {
                filePath = bPath;
                oldPath = aPath;
                status = 'renamed';
            }
            else {
                filePath = aPath;
                status = 'modified';
            }
            const ext = path.extname(filePath).slice(1).toLowerCase();
            const language = LANGUAGE_MAP[ext] || ext || 'unknown';
            const hunks = [];
            const hunkPattern = /^@@ -(\d+),?(\d*) \+(\d+),?(\d*) @@(.*)$/gm;
            let hunkMatch;
            const lines = section.split('\n');
            let inHunk = false;
            let currentHunk = null;
            let hunkLines = [];
            let hunkHeader = '';
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                hunkPattern.lastIndex = 0;
                if ((hunkMatch = hunkPattern.exec(line)) !== null) {
                    if (currentHunk) {
                        currentHunk.lines = hunkLines;
                        hunks.push(currentHunk);
                    }
                    currentHunk = {
                        header: hunkMatch[5].trim(),
                        oldStart: parseInt(hunkMatch[1], 10),
                        oldCount: hunkMatch[2] ? parseInt(hunkMatch[2], 10) : 1,
                        newStart: parseInt(hunkMatch[3], 10),
                        newCount: hunkMatch[4] ? parseInt(hunkMatch[4], 10) : 1,
                        lines: [],
                    };
                    hunkHeader = hunkMatch[5].trim();
                    hunkLines = [];
                    inHunk = true;
                }
                else if (inHunk && currentHunk) {
                    if (line.startsWith('+') || line.startsWith('-') || line.startsWith(' ') || line.length === 0) {
                        hunkLines.push(line);
                    }
                }
            }
            if (currentHunk) {
                currentHunk.lines = hunkLines;
                hunks.push(currentHunk);
            }
            const allLines = hunks.flatMap((h) => h.lines);
            const additions = allLines.filter((l) => l.startsWith('+') && !l.startsWith('+++')).length;
            const deletions = allLines.filter((l) => l.startsWith('-') && !l.startsWith('---')).length;
            details.push({ filePath, oldPath, status, hunks, additions, deletions, language });
        }
        return details;
    }
    generateSummary(details) {
        if (details.length === 0) {
            return {
                totalFiles: 0, totalAdditions: 0, totalDeletions: 0,
                fileTypes: {}, touchedModules: [],
                semanticSummary: 'No changes detected', keyChanges: [],
            };
        }
        let totalAdditions = 0;
        let totalDeletions = 0;
        const fileTypes = {};
        for (const d of details) {
            totalAdditions += d.additions;
            totalDeletions += d.deletions;
            const ext = path.extname(d.filePath).slice(1) || 'unknown';
            fileTypes[ext] = (fileTypes[ext] || 0) + 1;
        }
        const allPaths = details.map((d) => d.filePath);
        const touchedModules = this.extractModules(allPaths);
        const keyChanges = [];
        if (details.length > 5) {
            keyChanges.push(`${details.length} files modified`);
        }
        else {
            for (const d of details) {
                const action = d.status === 'added' ? 'Added' : d.status === 'deleted' ? 'Removed' : 'Modified';
                keyChanges.push(`${action}: ${d.filePath}`);
            }
        }
        if (totalAdditions > 100)
            keyChanges.push(`${totalAdditions} lines added`);
        if (totalDeletions > 100)
            keyChanges.push(`${totalDeletions} lines removed`);
        const semanticSummary = `${details.length} file(s) changed, ${totalAdditions} insertions(+), ${totalDeletions} deletions(-) across ${touchedModules.length} module(s)`;
        return {
            totalFiles: details.length,
            totalAdditions,
            totalDeletions,
            fileTypes,
            touchedModules,
            semanticSummary,
            keyChanges: keyChanges.slice(0, 10),
        };
    }
    extractModules(filePaths) {
        const modules = new Set();
        for (const fp of filePaths) {
            const normalized = fp.replace(/\\/g, '/');
            const parts = normalized.split('/');
            if (parts.length >= 2) {
                modules.add(parts[0]);
            }
            if (parts.length >= 3) {
                modules.add(parts.slice(0, 2).join('/'));
            }
        }
        return [...modules].sort();
    }
}
