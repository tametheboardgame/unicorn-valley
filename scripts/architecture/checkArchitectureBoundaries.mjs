import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import {
  extractImportSpecifiers,
  validateDependency,
  validateRetiredSourcePath,
} from './architectureBoundaries.mjs';

const repositoryRoot = process.cwd();
const sourceRoot = path.join(repositoryRoot, 'src', 'game');

async function collectSourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectSourceFiles(fullPath)));
      continue;
    }

    if (entry.isFile() && /\.(?:ts|tsx)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

const sourceFiles = await collectSourceFiles(sourceRoot);
const violations = [];

for (const filePath of sourceFiles) {
  const sourcePath = path.relative(repositoryRoot, filePath).replaceAll('\\', '/');
  const sourceText = await readFile(filePath, 'utf8');

  violations.push(...validateRetiredSourcePath(sourcePath));

  for (const importSpecifier of extractImportSpecifiers(sourceText)) {
    violations.push(...validateDependency(sourcePath, importSpecifier));
  }
}

if (violations.length > 0) {
  const detail = violations
    .map(
      (violation) =>
        `${violation.sourcePath} imports ${violation.importSpecifier} -> ${violation.resolvedTarget} [${violation.ruleId}]\n  ${violation.rationale}`,
    )
    .join('\n');
  throw new Error(`Architecture boundary check failed:\n${detail}`);
}

console.log(`Architecture boundaries passed (${sourceFiles.length} src/game files checked).`);
