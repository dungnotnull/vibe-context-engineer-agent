import { simpleGit, SimpleGit } from 'simple-git';
import type { BranchMergeEvent } from '../../core/types.js';

interface GitBranch {
  name: string;
  current: boolean;
}

export class MergeMonitor {
  private git: SimpleGit;

  constructor(repoPath: string) {
    this.git = simpleGit(repoPath);
  }

  async detectRecentMerges(maxCount = 10): Promise<BranchMergeEvent[]> {
    const merges: BranchMergeEvent[] = [];
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
        if (!commitHash || !parents) continue;

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
    } catch {
      // Non-git or merge detection not supported
    }
    return merges;
  }

  async getCurrentBranch(): Promise<string> {
    try {
      const branch = await this.git.revparse(['--abbrev-ref', 'HEAD']);
      return branch.trim();
    } catch {
      return 'unknown';
    }
  }

  async getBranchList(): Promise<GitBranch[]> {
    try {
      const result = await this.git.branch();
      return result.all.map((name) => ({
        name,
        current: name === result.current,
      }));
    } catch {
      return [];
    }
  }

  private async getMergeFileCount(commitHash: string): Promise<number> {
    try {
      const diff = await this.git.raw(['diff-tree', '--no-commit-id', '-r', commitHash]);
      return diff.trim().split('\n').filter(Boolean).length;
    } catch {
      return 0;
    }
  }
}
