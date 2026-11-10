/**
 * The real commands whose output the compile-error clip replays.
 *
 * Captured by `npm run capture:casts` (scripts/capture-casts.ts) into
 * assets/casts/. Each runs `ng serve` on one of the doc-verbatim build
 * configurations in frontend/angular.json, on a port nothing else uses (4252;
 * the app itself is on 4250), and is killed once the dev server has said what
 * it has to say.
 */
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RECORDER = fileURLToPath(new URL('..', import.meta.url));
const REPO = join(RECORDER, '..');
const FRONTEND = join(REPO, 'frontend');

export interface CastSpec {
  file: string;
  command: string;
  cwd: string;
  stopWhen: RegExp;
  /** A capture that lacks this did not reproduce the finding. */
  expect: RegExp;
  /** Files the command compiled; a newer one makes the cast stale. */
  sources: string[];
}

const cast = (name: string) => join(RECORDER, 'assets', 'casts', `${name}.cast`);
const src = (p: string) => join(FRONTEND, ...p.split('/'));

export const CASTS = {
  a2uiDoc: {
    file: cast('a2ui-doc'),
    command: 'npx ng serve --configuration doc-a2ui --port 4252',
    cwd: FRONTEND,
    stopWhen: /Watch mode enabled/,
    expect: /TS2304: Cannot find name 'dynamicString'/,
    sources: [src('src/doc-verbatim/a2ui.ts'), src('angular.json')],
  },
} satisfies Record<string, CastSpec>;
