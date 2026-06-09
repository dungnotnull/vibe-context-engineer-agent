import { StatusResult, LogResult } from 'simple-git';
import { FSWatcher } from 'chokidar';
import type { ChangeEvent, VceaConfig } from '../../core/types.js';
export declare class RepositoryObserver {
    private git;
    private watcher;
    private repoPath;
    private lastCheckedHash;
    private isGitRepo;
    private diffParser;
    private mergeMonitor;
    constructor(config: VceaConfig);
    getCurrentStatus(): Promise<StatusResult | null>;
    getRecentCommits(count?: number): Promise<LogResult | null>;
    getDiffBetween(from: string, to: string): Promise<string>;
    getDiffForCommit(hash: string): Promise<string>;
    getDiffForUncommitted(): Promise<string>;
    poll(): Promise<ChangeEvent[]>;
    startWatching(callback: (events: ChangeEvent[]) => void): FSWatcher;
    stopWatching(): void;
    private scanProjectFiles;
}
