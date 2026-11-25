// Sizzle & Serve: Lunchtime Rush — the hand-in program (Node 22, standard
// library only). It copies this repository's game/ and screenshots/ into the
// grader's output directory and writes dossier.json there with the vendored
// make.fun library, exactly as the bounty requires. It never deletes the
// output directory itself: the grader mounts it, so the program only creates
// the folders it needs inside it.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Create (never remove) the output directory, then mirror the entry in.
mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'game'), join(outputDir, 'game'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// The dossier must be byte for byte what the vendored library writes from
// game/ and screenshots/, under the scorer's caps: at most 4 screenshots of
// 256 KiB, at most 993 game files totalling 48 MiB, paths under 1000 bytes.
writeFileSync(
  join(outputDir, 'dossier.json'),
  buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
