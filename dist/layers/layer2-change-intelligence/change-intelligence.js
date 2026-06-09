import { TaskDetector } from './analyzers/task-detector.js';
import { ArchitectureAnalyzer } from './analyzers/architecture-analyzer.js';
export class ChangeIntelligenceEngine {
    taskDetector;
    architectureAnalyzer;
    constructor() {
        this.taskDetector = new TaskDetector();
        this.architectureAnalyzer = new ArchitectureAnalyzer();
    }
    classify(events) {
        const classified = events.map((event) => this.classifySingle(event));
        const architectureImpact = this.architectureAnalyzer.analyze(classified);
        // Attach architecture impact to the last change (most representative)
        if (classified.length > 0) {
            classified[classified.length - 1].architectureImpact = architectureImpact;
        }
        return classified;
    }
    classifySingle(event) {
        const allFiles = event.diffs.flatMap((d) => d.files);
        const allDiffs = event.diffs.map((d) => d.rawDiff).join('\n');
        const categories = this.detectCategories(event, allFiles, allDiffs);
        const affectedComponents = this.detectComponents(allFiles);
        const affectedDependencies = this.detectDependencyChanges(allDiffs);
        const schemaChanges = this.detectSchemaChanges(allDiffs, allFiles);
        const apiChanges = this.detectApiChanges(allDiffs, allFiles);
        const isBreaking = this.detectBreakingChanges(allDiffs);
        const complexity = this.assessComplexity(allFiles, allDiffs);
        const taskCompletion = this.taskDetector.detect(event);
        return { event, categories, affectedComponents, affectedDependencies, schemaChanges, apiChanges, isBreaking, complexity, taskCompletion };
    }
    detectCategories(event, allFiles, allDiffs) {
        const cats = [];
        const message = event.summary.toLowerCase();
        const filePatterns = allFiles.map((f) => f.filePath.toLowerCase());
        const allPaths = filePatterns.join(' ');
        if (message.includes('feat') || message.includes('add') || message.includes('implement'))
            cats.push('feature');
        if (message.includes('fix') || message.includes('bug') || message.includes('resolve'))
            cats.push('bugfix');
        if (message.includes('refactor') || message.includes('clean') || message.includes('simplify'))
            cats.push('refactor');
        if (allPaths.includes('docs') || allPaths.includes('readme') || allPaths.includes('.md') || message.includes('doc'))
            cats.push('docs');
        if (allPaths.includes('test') || allPaths.includes('spec') || allPaths.includes('__tests__'))
            cats.push('test');
        if (allPaths.includes('.json') || allPaths.includes('.yaml') || allPaths.includes('.yml') || allPaths.includes('.toml') || allPaths.includes('dockerfile') || allPaths.includes('.env') || message.includes('config'))
            cats.push('config');
        if (allPaths.includes('package.json') || allPaths.includes('requirements') || allPaths.includes('cargo.toml') || allPaths.includes('go.mod') || allDiffs.includes('"dependencies"') || allDiffs.includes('"devDependencies"'))
            cats.push('dependency');
        if (allDiffs.includes('schema') || allDiffs.includes('migration') || allDiffs.includes('CREATE TABLE') || allDiffs.includes('ALTER TABLE'))
            cats.push('schema');
        if (allDiffs.includes('api') || allDiffs.includes('route') || allDiffs.includes('endpoint') || allDiffs.includes('controller') || allDiffs.includes('@Get') || allDiffs.includes('@Post') || allDiffs.includes('app.get') || allDiffs.includes('app.post') || allDiffs.includes('router.'))
            cats.push('api');
        if (allDiffs.includes('security') || allDiffs.includes('auth') || allDiffs.includes('permission') || allDiffs.includes('csrf') || allDiffs.includes('xss'))
            cats.push('security');
        if (allDiffs.includes('performance') || allDiffs.includes('optimize') || allDiffs.includes('cache') || allDiffs.includes('lazy'))
            cats.push('performance');
        if (cats.length === 0)
            cats.push('unknown');
        return [...new Set(cats)];
    }
    detectComponents(files) {
        const components = new Set();
        for (const file of files) {
            const parts = file.filePath.replace(/\\/g, '/').split('/');
            if (parts.length >= 2 && parts[0] === 'src')
                components.add(parts.slice(0, 3).join('/'));
            else {
                const td = parts[0];
                if (td && td !== '.')
                    components.add(td);
            }
        }
        return [...components];
    }
    detectDependencyChanges(diff) {
        const deps = [];
        const pkgChangePattern = /["'](@?[\w-]+\/[\w-]+|[\w-]+)["']\s*:\s*["'][^"']+["']/g;
        const depSection = diff.match(/["']dependencies["']\s*:\s*\{[^}]*\}/g);
        if (depSection) {
            for (const section of depSection) {
                for (const line of section.split('\n')) {
                    if (line.startsWith('+') && !line.startsWith('+++')) {
                        const match = pkgChangePattern.exec(line);
                        if (match)
                            deps.push(match[1]);
                        pkgChangePattern.lastIndex = 0;
                    }
                }
            }
        }
        return [...new Set(deps)];
    }
    detectSchemaChanges(diff, files) {
        const changes = [];
        const schemaFiles = files.filter((f) => f.filePath.includes('schema') || f.filePath.includes('migration') || f.filePath.includes('.prisma') || f.filePath.endsWith('.sql'));
        for (const file of schemaFiles) {
            if (file.status === 'added')
                changes.push({ file: file.filePath, type: 'added', entity: file.filePath });
            else if (file.status === 'deleted')
                changes.push({ file: file.filePath, type: 'removed', entity: file.filePath });
            else {
                const createMatch = diff.match(/CREATE\s+TABLE\s+(\w+)/gi);
                const alterMatch = diff.match(/ALTER\s+TABLE\s+(\w+)/gi);
                if (createMatch)
                    for (const m of createMatch)
                        changes.push({ file: file.filePath, type: 'added', entity: m.split(/\s+/)[2] });
                if (alterMatch)
                    for (const m of alterMatch)
                        changes.push({ file: file.filePath, type: 'modified', entity: m.split(/\s+/)[2] });
            }
        }
        return changes;
    }
    detectApiChanges(diff, files) {
        const changes = [];
        const apiIndicators = ['route', 'controller', 'handler', 'endpoint', 'middleware'];
        const apiFiles = files.filter((f) => apiIndicators.some((ind) => f.filePath.toLowerCase().includes(ind)));
        for (const file of apiFiles) {
            if (file.status === 'added')
                changes.push({ file: file.filePath, type: 'added' });
            else if (file.status === 'deleted')
                changes.push({ file: file.filePath, type: 'removed' });
            else {
                const newRoutes = diff.match(/^\+.*(?:@(?:Get|Post|Put|Delete|Patch)|router\.(?:get|post|put|delete|patch)|app\.(?:get|post|put|delete|patch))/gm);
                const removedRoutes = diff.match(/^\-.*(?:@(?:Get|Post|Put|Delete|Patch)|router\.(?:get|post|put|delete|patch)|app\.(?:get|post|put|delete|patch))/gm);
                changes.push({ file: file.filePath, type: (newRoutes || removedRoutes) ? 'signature-change' : 'modified' });
            }
        }
        return changes;
    }
    detectBreakingChanges(diff) {
        return ['BREAKING CHANGE', 'breaking change', 'major:', 'removed export', 'removed function', 'deprecated'].some((ind) => diff.includes(ind));
    }
    assessComplexity(files, _diff) {
        const total = files.reduce((s, f) => s + f.additions + f.deletions, 0);
        if (total > 500 || files.length > 15)
            return 'high';
        if (total > 100 || files.length > 5)
            return 'medium';
        return 'low';
    }
}
