#!/usr/bin/env node
/**
 * frontend/VERSIONS.md — the file the Quickstart demo puts on screen.
 *
 * The Quickstart clip leads with the dependency versions, on the reasoning
 * that a demo is only meaningful against known versions. But package.json
 * declares RANGES: it can show "^1.69.2" while the install being filmed
 * resolved 1.69.3. The one file chosen to prove "known versions" was the one
 * file that could not show them.
 *
 * package-lock.json does carry the resolved versions, but it is 24k lines and
 * scatters the interesting entries hundreds of lines apart, so no highlight
 * range shows them together and every dependency change moves the line numbers.
 *
 * Hence this: small, ordered, and read from what is actually installed
 * (frontend/node_modules and backend/obj/project.assets.json). Not committed -- it describes
 * one install. `npm run doctor` writes it before validating the config.
 *
 *   node scripts/write-versions.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(HERE, '..', '..');
const FRONTEND_DIR = path.join(ROOT_DIR, 'frontend');
const BACKEND_DIR = path.join(ROOT_DIR, 'backend');
const OUT = path.join(FRONTEND_DIR, 'VERSIONS.md');

/** The frontend packages the Quickstart clip is about, in display order. */
const FRONTEND_PACKAGES = [
  '@copilotkit/angular',
  '@copilotkit/runtime',
  '@ag-ui/client',
  '@angular/core',
  '@angular/ssr',
];

/**
 * What is installed -- not what package.json asks for.
 *
 * Reading `pkg.dependencies` alone reports the FLOOR of a range rather than
 * the version in use. Read the installed tree instead, and keep the declared
 * range alongside when the two differ, so a range bump is still visible.
 */
function resolveVersion(dir, pkg, name) {
  const declared = pkg.dependencies?.[name] ?? pkg.devDependencies?.[name];
  let installed;
  try {
    const manifest = path.join(dir, 'node_modules', ...name.split('/'), 'package.json');
    installed = JSON.parse(fs.readFileSync(manifest, 'utf8')).version;
  } catch {
    // Not installed yet, or the install failed.
  }
  if (!declared && !installed) return 'n/a';
  if (!installed) return `${declared} (not installed)`;
  if (!declared) return installed;
  return declared === installed ? installed : `${installed} (declared ${declared})`;
}

/**
 * Backend versions, read from the restore output rather than the csproj alone.
 *
 * `dotnet restore` writes obj/project.assets.json, whose `libraries` keys are
 * `Name/Version` for everything it resolved -- the backend's equivalent of
 * reading node_modules. A floating or ranged PackageReference would otherwise
 * name a version that is not the one in use.
 */
function restoredVersions(dir) {
  const restored = new Map();
  try {
    const assets = JSON.parse(fs.readFileSync(path.join(dir, 'obj', 'project.assets.json'), 'utf8'));
    for (const key of Object.keys(assets.libraries ?? {})) {
      const slash = key.indexOf('/');
      if (slash > 0) restored.set(key.slice(0, slash).toLowerCase(), key.slice(slash + 1));
    }
  } catch {
    // No restore output: dotnet restore / build never ran.
  }
  return restored;
}

/**
 * Derived from the csproj's own PackageReference list rather than a hardcoded
 * set of interesting names, so adding a dependency cannot silently leave it out.
 */
function backendVersions(dir) {
  const out = {};
  const csprojName = fs.readdirSync(dir).find((f) => f.endsWith('.csproj'));
  if (!csprojName) return out;
  const csproj = fs.readFileSync(path.join(dir, csprojName), 'utf8');

  out['TargetFramework'] = csproj.match(/<TargetFramework>([^<]+)<\/TargetFramework>/)?.[1] || 'n/a';

  const restored = restoredVersions(dir);
  for (const m of csproj.matchAll(/<PackageReference\s+Include="([^"]+)"\s+Version="([^"]+)"/g)) {
    const [, name, declared] = m;
    const installed = restored.get(name.toLowerCase());
    if (installed) {
      out[name] = installed === declared ? installed : `${installed} (declared ${declared})`;
    } else {
      out[name] = `${declared} (not restored)`;
    }
  }
  return out;
}

function getPackageVersions() {
  const versions = { frontend: {}, backend: {} };
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(FRONTEND_DIR, 'package.json'), 'utf8'));
    for (const name of FRONTEND_PACKAGES) {
      versions.frontend[name] = resolveVersion(FRONTEND_DIR, pkg, name);
    }
  } catch {
    // No frontend/package.json: leave the section empty.
  }
  try {
    versions.backend = backendVersions(BACKEND_DIR);
  } catch {
    // Unreadable backend: leave the section empty.
  }
  return versions;
}

function pad(rows) {
  const width = Math.max(0, ...rows.map(([name]) => name.length));
  return rows.map(([name, version]) => `${name.padEnd(width)}  ${version}`);
}

export function writeVersionsFile() {
  const { frontend, backend } = getPackageVersions();

  const lines = [
    '# Versions in this recording',
    '',
    '# Generated after install. package.json declares RANGES; these are the',
    '# versions those ranges actually resolved to for this install.',
    '',
    '## Frontend',
    '',
    ...pad(Object.entries(frontend ?? {})),
  ];

  if (backend && Object.keys(backend).length) {
    lines.push('', '## Backend', '', ...pad(Object.entries(backend)));
  }
  lines.push('');

  fs.writeFileSync(OUT, lines.join('\n'));
  return OUT;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.log(`Wrote ${writeVersionsFile()}`);
}
