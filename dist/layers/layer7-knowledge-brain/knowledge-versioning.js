import * as fs from 'node:fs';
import * as path from 'node:path';
export class KnowledgeVersionManager {
    versionsDir;
    constructor(outputDir) {
        this.versionsDir = path.join(outputDir, 'kb-versions');
        fs.mkdirSync(this.versionsDir, { recursive: true });
    }
    createVersion(items, releaseNotes, benchmarkScore) {
        const version = this.getNextVersion();
        const snapshot = {
            version,
            items: items.map((i) => ({ ...i, version })),
            releasedAt: new Date().toISOString(),
            releaseNotes,
            benchmarkScore,
        };
        const filePath = path.join(this.versionsDir, `v${String(version).padStart(4, '0')}.json`);
        fs.writeFileSync(filePath, JSON.stringify(snapshot, null, 2));
        const index = this.getVersionIndex();
        index.push({
            version,
            releasedAt: snapshot.releasedAt,
            releaseNotes,
            itemCount: items.length,
        });
        fs.writeFileSync(path.join(this.versionsDir, 'index.json'), JSON.stringify(index, null, 2));
        return snapshot;
    }
    getVersion(versionNumber) {
        const filePath = path.join(this.versionsDir, `v${String(versionNumber).padStart(4, '0')}.json`);
        try {
            if (fs.existsSync(filePath)) {
                return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            }
        }
        catch { }
        return null;
    }
    getLatestVersion() {
        const index = this.getVersionIndex();
        if (index.length === 0)
            return null;
        const latest = index[index.length - 1];
        return this.getVersion(latest.version);
    }
    getVersionIndex() {
        try {
            const indexPath = path.join(this.versionsDir, 'index.json');
            if (fs.existsSync(indexPath)) {
                return JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
            }
        }
        catch { }
        return [];
    }
    diff(versionA, versionB) {
        const va = this.getVersion(versionA);
        const vb = this.getVersion(versionB);
        if (!va || !vb)
            return { added: [], removed: [], modified: [] };
        const aIds = new Set(va.items.map((i) => i.id));
        const bIds = new Set(vb.items.map((i) => i.id));
        const added = vb.items.filter((i) => !aIds.has(i.id));
        const removed = va.items.filter((i) => !bIds.has(i.id));
        const common = vb.items.filter((i) => aIds.has(i.id));
        const modified = [];
        for (const item of common) {
            const old = va.items.find((i) => i.id === item.id);
            if (old && JSON.stringify(old) !== JSON.stringify(item)) {
                modified.push({ before: old, after: item });
            }
        }
        return { added, removed, modified };
    }
    rollback(targetVersion) {
        const target = this.getVersion(targetVersion);
        if (!target)
            return null;
        return this.createVersion(target.items, `Rollback to version ${targetVersion}`, target.benchmarkScore);
    }
    getNextVersion() {
        const index = this.getVersionIndex();
        return index.length === 0 ? 1 : index[index.length - 1].version + 1;
    }
    cleanup(maxVersions = 50) {
        const index = this.getVersionIndex();
        if (index.length <= maxVersions)
            return 0;
        let removed = 0;
        const toRemove = index.slice(0, index.length - maxVersions);
        for (const entry of toRemove) {
            const filePath = path.join(this.versionsDir, `v${String(entry.version).padStart(4, '0')}.json`);
            try {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    removed++;
                }
            }
            catch { }
        }
        const updatedIndex = index.slice(index.length - maxVersions);
        fs.writeFileSync(path.join(this.versionsDir, 'index.json'), JSON.stringify(updatedIndex, null, 2));
        return removed;
    }
}
