/**
 * The doc-drift sync from the command line — the same code the `/doc-sync`
 * button runs (`src/app/lib/doc-sync/`), so CI and the UI can never disagree
 * about what drift is.
 *
 *   npm run doc:check   fetch + diff only; the snapshot is left untouched
 *   npm run doc:sync    fetch + diff, then rewrite doc-snapshot/ (the button)
 *
 * Exit codes are the contract `.github/workflows/daily-recorder.yml` gates on:
 *   0  clean — every tracked page matches the snapshot
 *   2  drift — something changed, went missing, or is new/unstable
 *   1  the check itself failed (docs unreachable, bad manifest…), so drift is
 *      UNKNOWN, not absent
 *
 * Must run with `frontend/` as the working directory: `store.ts` resolves the
 * repo root as `process.cwd()/..`.
 */
import { executeDocSync } from '../src/app/lib/doc-sync/run-sync';
import type { DocSyncReport, PageReport } from '../src/app/lib/doc-sync/types';

const check = process.argv.includes('--check');

function formatPage(page: PageReport): string[] {
  const lines = [
    `[${page.severity.toUpperCase()}] ${page.outcome}: ${page.docPath}  (routes ${page.routes.join(', ')})`,
  ];
  if (page.snapshotEdited) {
    lines.push('  note: the stored copy was edited locally — not an upstream change');
  }
  if (page.fenceCountChanged) lines.push('  note: the number of fenced code blocks changed');
  if (page.rewritten) lines.push('  note: rewritten past the diff cap — read the page itself');
  if (page.error) lines.push(`  note: ${page.error}`);

  for (const hunk of page.hunks) {
    const where = [
      hunk.heading && `under "${hunk.heading}"`,
      hunk.language && `in ${hunk.language}`,
    ]
      .filter(Boolean)
      .join(' ');
    lines.push(`  @@ line ${hunk.startLine} [${hunk.severity}] ${where}`.trimEnd());
    for (const line of hunk.lines) {
      const gutter = line.op === 'add' ? '+' : line.op === 'remove' ? '-' : ' ';
      lines.push(`  ${gutter} ${line.text}`);
    }
  }
  if (page.droppedHunks) lines.push(`  … ${page.droppedHunks} further hunk(s) not shown`);
  return lines;
}

function print(report: DocSyncReport): void {
  const c = report.counts;
  console.log(`Docs root: ${report.docsRoot}`);
  console.log(
    `${c.unchanged} unchanged · ${c.changed} changed · ${c.missing} missing · ${c.new} new · ${c.unstable} unstable · highest ${report.highest} · ${report.durationMs}ms`,
  );

  const moved = report.pages.filter((p) => p.outcome !== 'unchanged');
  for (const page of moved) {
    console.log('');
    for (const line of formatPage(page)) console.log(line);
  }

  const { confirmedRemoved, newUnmapped, error } = report.sitemap;
  if (confirmedRemoved.length) {
    console.log('\nRemoved upstream (404 and absent from the sitemap):');
    for (const url of confirmedRemoved) console.log(`  ${url}`);
  }
  if (newUnmapped.length) {
    console.log('\nNew upstream pages with no route here (informational):');
    for (const url of newUnmapped) console.log(`  ${url}`);
  }
  if (error) console.log(`\nSitemap not checked: ${error}`);
}

async function main(): Promise<void> {
  const { result, report } = await executeDocSync({ write: !check });

  if (report && !report.aborted) print(report);
  console.log(`\n${check ? 'Check' : 'Sync'}: ${result.message}`);

  if (!result.ok) {
    process.exitCode = 1;
  } else if (check && report) {
    const c = report.counts;
    const drifted = c.changed + c.missing + c.new + c.unstable > 0;
    if (drifted) {
      console.log(
        'Drift detected. Run `npm run doc:sync` (or the Doc sync workflow) to accept it.',
      );
    }
    process.exitCode = drifted ? 2 : 0;
  }
}

void main();
