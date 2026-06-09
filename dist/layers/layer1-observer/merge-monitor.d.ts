import type { BranchMergeEvent } from '../../core/types.js';
interface GitBranch {
    name: string;
    current: boolean;
}
export declare class MergeMonitor {
    private git;
    constructor(repoPath: string);
    detectRecentMerges(maxCount?: number): Promise<BranchMergeEvent[]>;
    getCurrentBranch(): Promise<string>;
    getBranchList(): Promise<GitBranch[]>;
    private getMergeFileCount;
}
export {};
