import { simpleGit } from 'simple-git';
export class MergeMonitor {
    git;
    constructor(repoPath) {
        this.git = simpleGit(repoPath);
    }
    async detectRecentMerges(maxCount = 10) {
        const merges = [];
        try {
            const log = await this.git.raw([
                'log',
                '--merges',
                `--max-count=${maxCount}`,
                '--format=%H|%an|%aI|%s|%P',
            ]);
            const entries = log.trim().split('\n').filter(Boolean);
            for (const entry of entries) {
                const [commitHash, author, timestamp, message, parents] = entry.split('|');
                if (!commitHash || !parents)
                    continue;
                const parentList = parents.split(' ');
                const filesChanged = await this.getMergeFileCount(commitHash);
                merges.push({
                    source: parentList[1] || 'unknown',
                    target: parentList[0] || 'unknown',
                    commitHash,
                    author,
                    timestamp,
                    message,
                    filesChanged,
                });
            }
        }
        catch {
            // Non-git or merge detection not supported
        }
        return merges;
    }
    async getCurrentBranch() {
        try {
            const branch = await this.git.revparse(['--abbrev-ref', 'HEAD']);
            return branch.trim();
        }
        catch {
            return 'unknown';
        }
    }
    async getBranchList() {
        try {
            const result = await this.git.branch();
            return result.all.map((name) => ({
                name,
                current: name === result.current,
            }));
        }
        catch {
            return [];
        }
    }
    async getMergeFileCount(commitHash) {
        try {
            const diff = await this.git.raw(['diff-tree', '--no-commit-id', '-r', commitHash]);
            return diff.trim().split('\n').filter(Boolean).length;
        }
        catch {
            return 0;
        }
    }
}
