// main.ts — the entry program for Sizzle & Serve v2 (Node 22, standard library only).
//
// It hands the game in: copies game/ and screenshots/ from beside this file
// into the output directory and writes /output/dossier.json with the kit's
// vendored buildDossier. Outside the grader, MAKEFUN_OUTPUT_DIR stands in
// for /output, so a local check is:
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// The game itself is plain static files under game/ (index.html plus its ES
// modules, canvas art and WebAudio sounds, no network request), and the
// screenshots are real renders of that code in a desktop browser.

import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

// The repository root is the directory this file lives in.
const repoRoot = fileURLToPath(new URL('.', import.meta.url));

// The grader gives us a writable /output; locally MAKEFUN_OUTPUT_DIR stands in.
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Start from a clean output tree so a second run writes exactly what the
// first one did, with no stale files left behind by an earlier build.
mkdirSync(outputDir, { recursive: true });
for (const name of ['game', 'screenshots', 'dossier.json']) {
  rmSync(join(outputDir, name), { recursive: true, force: true });
}

// The whole playable game, exactly as it sits in the repository.
cpSync(join(repoRoot, 'game'), join(outputDir, 'game'), { recursive: true });

// The entry's screenshots, first by name is the cover.
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), {
    recursive: true,
  });
}

// The dossier is the summary the judge reads: the game's source text plus
// its screenshots, written by the kit's library. The caps mirror the gate's
// own limits, so a dossier this program writes is one the gate accepts:
// at most 160 KiB of source text, 4 screenshots of at most 256 KiB each,
// game/ within 993 files and 48 MiB, every game path within 1,000 bytes.
const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});

writeFileSync(join(outputDir, 'dossier.json'), dossier);

// One line on stdout so a local run shows what it handed in.
console.log(
  `Sizzle & Serve v2 handed in: game/ + screenshots/ + dossier.json ` +
  `(${dossier.length} bytes) -> ${outputDir}`,
);
