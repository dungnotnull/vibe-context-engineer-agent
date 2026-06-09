import type { ClassifiedChange, ArchitectureImpact } from '../../../core/types.js';

export class ArchitectureAnalyzer {
  analyze(changes: ClassifiedChange[]): ArchitectureImpact {
    if (changes.length === 0) {
      return {
        level: 'none',
        affectedArchitectureDomains: [],
        newPatterns: [],
        deprecatedPatterns: [],
        structuralChanges: [],
      };
    }

    const domains = new Set<string>();
    const newPatterns: string[] = [];
    const deprecatedPatterns: string[] = [];
    const structuralChanges: string[] = [];

    for (const change of changes) {
      const allDiffs = change.event.diffs.map((d) => d.rawDiff).join('\n');
      const allFiles = change.event.diffs.flatMap((d) => d.files).map((f) => f.filePath);

      // Detect affected architecture domains
      const filePaths = allFiles.join(' ').toLowerCase();
      if (filePaths.includes('api') || filePaths.includes('route') || filePaths.includes('controller'))
        domains.add('api-layer');
      if (filePaths.includes('service') || filePaths.includes('usecase') || filePaths.includes('repository'))
        domains.add('domain-layer');
      if (filePaths.includes('schema') || filePaths.includes('migration') || filePaths.includes('model'))
        domains.add('data-layer');
      if (filePaths.includes('config') || filePaths.includes('env') || filePaths.includes('setting'))
        domains.add('configuration');
      if (filePaths.includes('middleware') || filePaths.includes('guard') || filePaths.includes('interceptor'))
        domains.add('middleware');
      if (filePaths.includes('test') || filePaths.includes('spec') || filePaths.includes('e2e'))
        domains.add('testing');
      if (filePaths.includes('util') || filePaths.includes('helper') || filePaths.includes('lib'))
        domains.add('utilities');

      // Detect new patterns
      if (allDiffs.includes('interface ') && allDiffs.includes('export ')) {
        newPatterns.push('New interface/introduced abstraction');
      }
      if (allDiffs.includes('abstract class') || allDiffs.includes('extends ')) {
        newPatterns.push('New abstract base class or inheritance');
      }
      if (allDiffs.includes('factory') || allDiffs.includes('builder')) {
        newPatterns.push('Factory/Builder pattern');
      }
      if (allDiffs.includes('decorator') || allDiffs.includes('@')) {
        newPatterns.push('Decorator pattern');
      }
      if (allDiffs.includes('import ') && allDiffs.includes('inject')) {
        newPatterns.push('Dependency injection');
      }

      // Detect deprecated patterns
      if (allDiffs.includes('@deprecated') || allDiffs.includes('deprecated')) {
        deprecatedPatterns.push(`Deprecated code in ${change.affectedComponents.join(', ')}`);
      }
      if (allDiffs.includes('removed export') || allDiffs.includes('delete export')) {
        deprecatedPatterns.push('Removed public export(s)');
      }

      // Detect structural changes
      const fileOperations = change.event.diffs.flatMap((d) => d.files);
      for (const f of fileOperations) {
        if (f.status === 'added') {
          structuralChanges.push(`New component: ${f.filePath}`);
        } else if (f.status === 'deleted') {
          structuralChanges.push(`Removed component: ${f.filePath}`);
        } else if (f.status === 'renamed') {
          structuralChanges.push(`Renamed: ${f.oldPath} → ${f.filePath}`);
        }
      }
    }

    // Determine impact level
    let level: ArchitectureImpact['level'] = 'none';
    const uniqueDomains = domains.size;
    const totalChanges = structuralChanges.length;

    if (uniqueDomains >= 4 || totalChanges > 20) {
      level = 'critical';
    } else if (uniqueDomains >= 3 || totalChanges > 10) {
      level = 'high';
    } else if (uniqueDomains >= 2 || totalChanges > 5) {
      level = 'medium';
    } else if (uniqueDomains >= 1 || totalChanges > 0) {
      level = 'low';
    }

    return {
      level,
      affectedArchitectureDomains: [...domains],
      newPatterns: [...new Set(newPatterns)].slice(0, 5),
      deprecatedPatterns: [...new Set(deprecatedPatterns)].slice(0, 3),
      structuralChanges: structuralChanges.slice(0, 10),
    };
  }
}
