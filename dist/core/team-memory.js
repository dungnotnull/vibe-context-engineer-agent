import { randomUUID } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
export class TeamMemoryManager {
    storagePath;
    memory;
    constructor(outputDir, teamName) {
        this.storagePath = path.join(outputDir, 'team-memory.json');
        fs.mkdirSync(outputDir, { recursive: true });
        this.memory = this.load(teamName);
    }
    addMember(name, role, repos) {
        const member = {
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
    removeMember(memberId) {
        const index = this.memory.members.findIndex((m) => m.id === memberId);
        if (index === -1)
            return false;
        this.memory.members.splice(index, 1);
        this.save();
        return true;
    }
    logActivity(memberId, repoPath, action, summary) {
        const activity = {
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
    shareKnowledge(items) {
        for (const item of items) {
            if (!this.memory.sharedKnowledge.find((k) => k.id === item.id)) {
                this.memory.sharedKnowledge.push(item);
            }
        }
        this.save();
    }
    shareDecisions(decisions) {
        for (const d of decisions) {
            if (!this.memory.sharedDecisions.find((sd) => sd.id === d.id)) {
                this.memory.sharedDecisions.push(d);
            }
        }
        this.save();
    }
    getMemberActivity(memberId, since) {
        let activities = this.memory.activityLog.filter((a) => a.memberId === memberId);
        if (since) {
            const sinceDate = new Date(since).getTime();
            activities = activities.filter((a) => new Date(a.timestamp).getTime() >= sinceDate);
        }
        return activities;
    }
    getRepoActivity(repoPath) {
        return this.memory.activityLog.filter((a) => a.repoPath === repoPath);
    }
    getSharedKnowledge(category) {
        if (category) {
            return this.memory.sharedKnowledge.filter((k) => k.category === category);
        }
        return this.memory.sharedKnowledge;
    }
    getSharedDecisions() {
        return this.memory.sharedDecisions;
    }
    getMemory() {
        return { ...this.memory, lastSynced: new Date().toISOString() };
    }
    load(teamName) {
        try {
            if (fs.existsSync(this.storagePath)) {
                return JSON.parse(fs.readFileSync(this.storagePath, 'utf-8'));
            }
        }
        catch { }
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
    save() {
        this.memory.lastSynced = new Date().toISOString();
        fs.writeFileSync(this.storagePath, JSON.stringify(this.memory, null, 2));
    }
}
