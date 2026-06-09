import type { TeamMemory, TeamMember, TeamActivity, KnowledgeItem, TrackItem } from './types.js';
export declare class TeamMemoryManager {
    private storagePath;
    private memory;
    constructor(outputDir: string, teamName: string);
    addMember(name: string, role: string, repos: string[]): TeamMember;
    removeMember(memberId: string): boolean;
    logActivity(memberId: string, repoPath: string, action: string, summary: string): TeamActivity;
    shareKnowledge(items: KnowledgeItem[]): void;
    shareDecisions(decisions: TrackItem[]): void;
    getMemberActivity(memberId: string, since?: string): TeamActivity[];
    getRepoActivity(repoPath: string): TeamActivity[];
    getSharedKnowledge(category?: string): KnowledgeItem[];
    getSharedDecisions(): TrackItem[];
    getMemory(): TeamMemory;
    private load;
    private save;
}
