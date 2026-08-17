import { readFile, writeFile } from 'node:fs/promises';

async function replaceInFile(path, before, after) {
  const content = await readFile(path, 'utf8');
  if (!content.includes(before)) {
    throw new Error(`Roadmap patch could not find expected block in ${path}`);
  }
  await writeFile(path, content.replace(before, after));
}

await replaceInFile(
  'docs/06-ROADMAP.md',
  `- first-pass sound and UI identity;\n- optional activity suggestions.\n\nPlayable result:\n\n- a coherent vertical slice long enough for meaningful child playtesting.\n\n**Major decision gate:** after R2, observe what the player naturally spends time doing before over-investing in later systems.`,
  `- first-pass sound and UI identity;\n- optional activity suggestions;\n- pre-playtest visual polish and UX correction pass;\n- daughter playtest and recovery pass.\n\nPlayable result:\n\n- a coherent vertical slice polished enough that the first child playtest measures enjoyment and comprehension rather than obvious prototype defects.\n\n**Pre-playtest gate:** R2-WP2.10A removes obvious visual defects, improves the procedural unicorn and creator presentation, aligns world visuals with navigation/collision, and clarifies suggestion/HUD behaviour before the first daughter playtest.\n\n**Major decision gate:** R2-WP2.10B then observes what the player naturally spends time doing before over-investing in later systems.`,
);

await replaceInFile(
  'docs/07-WORK-PACKAGES.md',
  `## R2-WP2.10 - R2 Daughter Playtest and Recovery Pass\n\nDependencies: R2-WP2.9\n\nGoal:\n\n- treat observed child behaviour as design evidence.\n\nDeliverables:\n\n- structured observation notes;\n- confusion/frustration findings;\n- delight/repetition findings;\n- issue list ranked by impact;\n- fixes for progression blockers and severe UX failures;\n- roadmap notes where observed preference affects later scope.\n\nAcceptance:\n\n- target player can complete or meaningfully explore the vertical slice with minimal adult instruction;\n- major misunderstandings have a recorded resolution or explicit follow-up package.`,
  `## R2-WP2.10A - Pre-Playtest Visual Polish and UX Fix Pass\n\nDependencies: R2-WP2.9\n\nGoal:\n\n- remove obvious presentation and clarity defects before the first daughter playtest so first-impression feedback is about the game rather than prototype roughness.\n\nDeliverables:\n\n- title-screen missing-graphic fix and composition pass;\n- improved procedural unicorn silhouette and customisation anchors;\n- creator-screen alignment and control-spacing pass;\n- bridge/path/collision visual-alignment sweep;\n- suggestion-card positive acknowledgement, alternate-idea and session-hide behaviour;\n- exploration HUD spacing/readability pass;\n- Glade, Village and Cottage presentation consistency sweep;\n- visual regression/hosted smoke check where practical.\n\nAcceptance:\n\n- no black/missing title graphic;\n- unicorn reads coherently at creator and gameplay scale;\n- creator arrows/values align consistently;\n- visible bridge and walkable bridge agree;\n- suggestions have an obvious positive close/acknowledge path;\n- obvious HUD overlaps from the pre-playtest screenshots are removed;\n- existing progression remains intact.\n\n## R2-WP2.10B - R2 Daughter Playtest and Recovery Pass\n\nDependencies: R2-WP2.10A\n\nGoal:\n\n- treat observed child behaviour as design evidence after obvious presentation defects have been removed.\n\nDeliverables:\n\n- structured observation notes;\n- confusion/frustration findings;\n- delight/repetition findings;\n- issue list ranked by impact;\n- fixes for progression blockers and severe UX failures;\n- roadmap notes where observed preference affects later scope.\n\nAcceptance:\n\n- target player can complete or meaningfully explore the vertical slice with minimal adult instruction;\n- major misunderstandings have a recorded resolution or explicit follow-up package.`,
);

await replaceInFile(
  'docs/07-WORK-PACKAGES.md',
  'Dependencies: R2-WP2.10\n\nGoal:\n\n- physically connect racing to the existing world.',
  'Dependencies: R2-WP2.10B\n\nGoal:\n\n- physically connect racing to the existing world.',
);

console.log('Applied R2-WP2.10A/B roadmap amendment.');
