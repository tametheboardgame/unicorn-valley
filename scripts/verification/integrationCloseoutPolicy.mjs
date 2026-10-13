import { readFileSync } from 'node:fs';
const ENGINEERING = /^agent\/eng-wp/i;
const PRODUCT = [
  { branch: /^agent\/(?:mg-|just-games-)/, state: 'docs/streams/state/just-games.json' },
  { branch: /^agent\/(?:sh-|story-house-)/, state: 'docs/streams/state/story-house.json' },
  { branch: /^agent\/(?:r\d|world-|crystal-)/, state: 'docs/streams/state/world.json' },
];
const GLOBAL = ['AGENTS.md', 'PROJECT_STATE.json', 'STATUS.md'];
const WP = /^docs\/work-packages\/[^/]+\.md$/;
const ENGINEERING_WP = /^docs\/work-packages\/ENG-WP[^/]+\.md$/;

/** Finalisation guard; feature streams do NOT compete for global status files. */
export function evaluateCloseout({ number, draft, branch, files, completedPackages = [] }) {
  const errors = [];
  const notes = [];
  if (draft || number < 314) return { errors, notes, enforced: false };
  if (!Array.isArray(files) || !branch)
    return { errors: ['Missing PR file inventory or branch'], notes, enforced: true };
  const touched = new Set(files.map((file) => (typeof file === 'string' ? file : file.filename)));
  if (ENGINEERING.test(branch) && [...touched].some((x) => ENGINEERING_WP.test(x))) {
    for (const path of GLOBAL) {
      if (!touched.has(path)) errors.push('Engineering completion must reconcile ' + path);
    }
    const docs = [...touched].filter((x) => ENGINEERING_WP.test(x));
    if (!docs.length) errors.push('Engineering work package must have a completion record');
    notes.push('Global engineering completion is a final PR integration checkpoint.');
  }
  const product = PRODUCT.find((x) => x.branch.test(branch));
  if (product && completedPackages.length) {
    for (const file of completedPackages) {
      if (!WP.test(file)) errors.push('Unrecognised completed work package: ' + file);
    }
    if (!touched.has(product.state))
      errors.push('Completed product stream must update ' + product.state);
    notes.push('Product stream completion is local; root state updates belong to integration.');
  }
  return { errors, notes, enforced: true };
}

/** Only the package's own local front matter controls its completion claim. */
export function completedPackagePaths(changedFiles) {
  const complete = [];
  for (const file of changedFiles) {
    const path = typeof file === 'string' ? file : file.filename;
    const status = typeof file === 'string' ? 'modified' : file.status;
    if (!WP.test(path) || status === 'removed') continue;
    try {
      const content = readFileSync(path, 'utf8');
      if (/^---\s*\n[\s\S]*?^status:\s*complete\s*$/m.test(content)) complete.push(path);
    } catch (error) {
      throw new Error(
        'Cannot read changed package completion status: ' + path + ': ' + error.message,
      );
    }
  }
  return complete;
}
