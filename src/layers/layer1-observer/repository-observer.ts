import { simpleGit, SimpleGit, StatusResult, LogResult } from 'simple-git';
import { watch, FSWatcher } from 'chokidar';
import { randomUUID } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { DiffParser } from './diff-parser.js';
import { MergeMonitor } from './merge-monitor.js';
import type { ChangeEvent, StructuredDiff, FileChange, DiffSummary, VceaConfig } from '../../core/types.js';

export class RepositoryObserver {
  private git: SimpleGit;
  private watcher: FSWatcher | null = null;
  private repoPath: string;
  private lastCheckedHash: string | null = null;
  private isGitRepo: boolean;
  private diffParser: DiffParser;
  private mergeMonitor: MergeMonitor;

  constructor(config: VceaConfig) {
    this.repoPath = config.repoPath;
    this.git = simpleGit(config.repoPath);
    this.isGitRepo = fs.existsSync(path.join(config.repoPath, '.git'));
    this.diffParser = new DiffParser();
    this.mergeMonitor = new MergeMonitor(config.repoPath);
  }

  async getCurrentStatus(): Promise<StatusResult | null> {
    if (!this.isGitRepo) return null;
    try { return await this.git.status(); } catch { this.isGitRepo = false; return null; }
  }

  async getRecentCommits(count = 20): Promise<LogResult | null> {
    if (!this.isGitRepo) return null;
    try { return await this.git.log({ maxCount: count }); } catch { this.isGitRepo = false; return null; }
  }

  async getDiffBetween(from: string, to: string): Promise<string> {
    if (!this.isGitRepo) return '';
    try { return await this.git.diff([from, to]); } catch { return ''; }
  }

  async getDiffForCommit(hash: string): Promise<string> {
    if (!this.isGitRepo) return '';
    try { return await this.git.diff([`${hash}^!`]); } catch { return ''; }
  }

  async getDiffForUncommitted(): Promise<string> {
    if (!this.isGitRepo) return '';
    try { return await this.git.diff(); } catch { return ''; }
  }

  async poll(): Promise<ChangeEvent[]> {
    const events: ChangeEvent[] = [];

    if (this.isGitRepo) {
      const status = await this.getCurrentStatus();
      const log = await this.getRecentCommits(10);

      if (log?.latest && log.latest.hash !== this.lastCheckedHash) {
        const newCommits = this.lastCheckedHash
          ? log.all.filter((c) => {
              if (c.hash === this.lastCheckedHash) return false;
              const idx = log.all.findIndex((x) => x.hash === this.lastCheckedHash);
              if (idx === -1) return true;
              return log.all.indexOf(c) < idx;
            })
          : log.all;

        for (const commit of newCommits) {
          const diffText = await this.getDiffForCommit(commit.hash);
          const fileDetails = this.diffParser.parseHunks(diffText);
          const fileChanges: FileChange[] = fileDetails.map((d) => ({
            filePath: d.filePath,
            status: d.status,
            oldPath: d.oldPath,
            additions: d.additions,
            deletions: d.deletions,
          }));
          const summary = this.diffParser.generateSummary(fileDetails);

          events.push({
            id: randomUUID(),
            type: 'commit',
            timestamp: commit.date,
            diffs: [{
              commit: commit.hash,
              author: commit.author_name,
              timestamp: commit.date,
              message: commit.message,
              files: fileChanges,
              fileDetails,
              rawDiff: diffText,
              summary,
            }],
            summary: commit.message,
          });
        }

        if (log.latest) this.lastCheckedHash = log.latest.hash;
      }

      if (status) {
        const hasUncommitted = status.modified.length > 0 || status.created.length > 0 || status.deleted.length > 0;
        if (hasUncommitted) {
          const diffText = await this.getDiffForUncommitted();
          const fileDetails = this.diffParser.parseHunks(diffText);
          const files: FileChange[] = [
            ...status.modified.map((f) => ({ filePath: f, status: 'modified' as const, additions: 0, deletions: 0 })),
            ...status.created.map((f) => ({ filePath: f, status: 'added' as const, additions: 0, deletions: 0 })),
            ...status.deleted.map((f) => ({ filePath: f, status: 'deleted' as const, additions: 0, deletions: 0 })),
          ];
          const summary = this.diffParser.generateSummary(fileDetails);

          events.push({
            id: randomUUID(),
            type: 'file-save',
            timestamp: new Date().toISOString(),
            diffs: [{ files, fileDetails, rawDiff: diffText, summary }],
            summary: `${files.length} uncommitted changes`,
          });
        }
      }

      // Branch merge detection
      const merges = await this.mergeMonitor.detectRecentMerges(5);
      for (const merge of merges) {
        events.push({
          id: randomUUID(),
          type: 'branch-merge',
          timestamp: merge.timestamp,
          diffs: [],
          summary: `Merge ${merge.source} → ${merge.target}: ${merge.message}`,
          branch: merge.target,
        });
      }

      return events;
    }

    // Non-git fallback
    const scannedFiles = this.scanProjectFiles();
    if (scannedFiles.length > 0) {
      const fileChanges: FileChange[] = scannedFiles.map((f) => ({
        filePath: path.relative(this.repoPath, f),
        status: 'added' as const,
        additions: 0,
        deletions: 0,
      }));

      events.push({
        id: randomUUID(),
        type: 'initial-scan',
        timestamp: new Date().toISOString(),
        diffs: [{ files: fileChanges, fileDetails: [], rawDiff: '', summary: { totalFiles: scannedFiles.length, totalAdditions: 0, totalDeletions: 0, fileTypes: {}, touchedModules: [], semanticSummary: `Project scan: ${scannedFiles.length} files`, keyChanges: [] } }],
        summary: `Project scan: ${scannedFiles.length} files detected`,
      });
    }

    return events;
  }

  startWatching(callback: (events: ChangeEvent[]) => void): FSWatcher {
    this.watcher = watch(this.repoPath, {
      ignored: /(^|[\/\\])\../,
      persistent: true,
      ignoreInitial: true,
      depth: 99,
    });

    let debounceTimer: ReturnType<typeof setTimeout>;
    this.watcher.on('change', async () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(async () => {
        const events = await this.poll();
        if (events.length > 0) callback(events);
      }, 1500);
    });

    return this.watcher;
  }

  stopWatching(): void {
    if (this.watcher) { this.watcher.close(); this.watcher = null; }
  }

  private scanProjectFiles(excludeDirs: string[] = ['node_modules', '.git', 'dist', '.vcea']): string[] {
    const results: string[] = [];
    const scanDir = (dir: string) => {
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.name.startsWith('.') && entry.name !== '.') continue;
          if (entry.isDirectory() && !excludeDirs.includes(entry.name)) scanDir(path.join(dir, entry.name));
          else if (entry.isFile()) results.push(path.join(dir, entry.name));
        }
      } catch {}
    };
    scanDir(this.repoPath);
    return results;
  }
}
