import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const sourceFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? sourceFiles(path) : /\.(ts|tsx)$/.test(name) ? [path] : [];
  });

const packageName = (specifier: string) => (specifier.startsWith('@') ? specifier.split('/').slice(0, 2).join('/') : specifier.split('/')[0]);

describe('dependencies', () => {
  it('declares every package the app imports (none arrive only through another package)', () => {
    // jspdf and html2canvas were once installed only because an unused package depended on them.
    const { dependencies } = JSON.parse(readFileSync('package.json', 'utf8')) as { dependencies: Record<string, string> };
    const imported = new Set<string>();
    for (const file of sourceFiles('src')) {
      const source = readFileSync(file, 'utf8');
      // `from 'x'`, `import('x')` and side-effect `import 'x'`; relative paths are skipped.
      const patterns = [/^\s*(?:import|export)\b[^;]*?\bfrom\s+['"]([^'"]+)['"]/gm, /\bimport\(\s*['"]([^'"]+)['"]\s*\)/g, /^\s*import\s+['"]([^'"]+)['"]/gm];
      for (const pattern of patterns) for (const [, specifier] of source.matchAll(pattern)) if (!specifier.startsWith('.')) imported.add(packageName(specifier));
    }
    const undeclared = [...imported].filter((name) => !(name in dependencies));
    expect(undeclared).toEqual([]);
    expect(imported).toContain('jspdf');
  });

  it('pins jsPDF exactly: the export relies on its internals (text paging, margins, fonts)', () => {
    const { dependencies } = JSON.parse(readFileSync('package.json', 'utf8')) as { dependencies: Record<string, string> };
    expect(dependencies.jspdf).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
