import { randomUUID } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { TeamMemory, TeamMember, TeamActivity, KnowledgeItem, TrackItem } from './types.js';

export class TeamMemoryManager {
  private storagePath: string;
  private memory: TeamMemory;

  constructor(outputDir: string, teamName: string) {
    this.storagePath = path.join(outputDir, 'team-memory.json');
    fs.mkdirSync(outputDir, { recursive: true });
    this.memory = this.load(teamName);
  }

  addMember(name: string, role: string, repos: string[]): TeamMember {
    const member: TeamMember = {
      id: randomUUID(),
      name,
      role,
      repos,
      joinedAt: new Date().toISOString(),
    };
    this.memory.members.push(member);
    this.save();
    return member;
  }

  removeMember(memberId: string): boolean {
    const index = this.memory.members.findIndex((m) => m.id === memberId);
    if (index === -1) return false;
    this.memory.members.splice(index, 1);
    this.save();
    return true;
  }

  logActivity(memberId: string, repoPath: string, action: string, summary: string): TeamActivity {
    const activity: TeamActivity = {
      timestamp: new Date().toISOString(),
      memberId,
      repoPath,
      action,
      summary,
    };
    this.memory.activityLog.push(activity);
    if (this.memory.activityLog.length > 1000) {
      this.memory.activityLog = this.memory.activityLog.slice(-500);
    }
    this.save();
    return activity;
  }

  shareKnowledge(items: KnowledgeItem[]): void {
    for (const item of items) {
      if (!this.memory.sharedKnowledge.find((k) => k.id === item.id)) {
        this.memory.sharedKnowledge.push(item);
      }
    }
    this.save();
  }

  shareDecisions(decisions: TrackItem[]): void {
    for (const d of decisions) {
      if (!this.memory.sharedDecisions.find((sd) => sd.id === d.id)) {
        this.memory.sharedDecisions.push(d);
      }
    }
    this.save();
  }

  getMemberActivity(memberId: string, since?: string): TeamActivity[] {
    let activities = this.memory.activityLog.filter((a) => a.memberId === memberId);
    if (since) {
      const sinceDate = new Date(since).getTime();
      activities = activities.filter((a) => new Date(a.timestamp).getTime() >= sinceDate);
    }
    return activities;
  }

  getRepoActivity(repoPath: string): TeamActivity[] {
    return this.memory.activityLog.filter((a) => a.repoPath === repoPath);
  }

  getSharedKnowledge(category?: string): KnowledgeItem[] {
    if (category) {
      return this.memory.sharedKnowledge.filter((k) => k.category === category);
    }
    return this.memory.sharedKnowledge;
  }

  getSharedDecisions(): TrackItem[] {
    return this.memory.sharedDecisions;
  }

  getMemory(): TeamMemory {
    return { ...this.memory, lastSynced: new Date().toISOString() };
  }

  private load(teamName: string): TeamMemory {
    try {
      if (fs.existsSync(this.storagePath)) {
        return JSON.parse(fs.readFileSync(this.storagePath, 'utf-8'));
      }
    } catch {}
    return {
      id: randomUUID(),
      teamName,
      members: [],
      sharedKnowledge: [],
      sharedDecisions: [],
      activityLog: [],
      lastSynced: '',
    };
  }

  private save(): void {
    this.memory.lastSynced = new Date().toISOString();
    fs.writeFileSync(this.storagePath, JSON.stringify(this.memory, null, 2));
  }
}
