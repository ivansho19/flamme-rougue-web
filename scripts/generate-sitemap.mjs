/**
 * Generates the public sitemaps for Flammes Rouges after `ng build`.
 *
 * Output (written into the build output, never into src/):
 * - sitemap.xml           → sitemap index (referenced by robots.txt)
 * - sitemap-static.xml    → static public pages
 * - sitemap-profiles.xml  → every active profile returned by the API
 *
 * If the API is unreachable the build keeps src/sitemap.xml (already copied
 * by Angular as an asset) so a deploy is never blocked by the backend.
 *
 * Usage: node scripts/generate-sitemap.mjs [--out <dir>]
 * Env:   SITEMAP_PROFILES_API overrides the profiles endpoint.
 */

import { existsSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_OUT = join(ROOT, 'dist', 'flamme-rouge-web', 'browser');

const SITE_URL = 'https://flammesrouges.com';
const PROFILES_API =
  process.env.SITEMAP_PROFILES_API ||
  'https://flamme-rouge-backend-production-251b.up.railway.app/api/profiles/getAllProfiles';
const FETCH_TIMEOUT_MS = 20000;

/**
 * Only canonical, indexable URLs:
 * "/" redirects to /home (canonical) and /auth/* is disallowed in robots.txt.
 */
const STATIC_URLS = [
  { loc: `${SITE_URL}/home`, changefreq: 'daily', priority: '1.0' },
  { loc: `${SITE_URL}/legal`, changefreq: 'monthly', priority: '0.5' }
];

function parseOutDir(argv) {
  const index = argv.indexOf('--out');
  return index >= 0 && argv[index + 1] ? resolve(argv[index + 1]) : DEFAULT_OUT;
}

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Mirrors src/app/shared/clases/resolveProfileId.ts */
function resolveProfileId(value) {
  if (value == null || value === '') return '';
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return String(value);
  if (Array.isArray(value)) return resolveProfileId(value[0]);
  if (typeof value === 'object') {
    return resolveProfileId(value._id ?? value.id ?? value.profileId ?? '');
  }
  return '';
}

/** Mirrors getProfileDisplayName in src/app/shared/clases/profileSlug.ts */
function getProfileDisplayName(profile) {
  if (!profile) return '';
  const nested =
    profile.profile && typeof profile.profile === 'object' ? profile.profile : null;
  return (
    profile.displayName ||
    profile.title ||
    profile.name ||
    profile.publicName ||
    nested?.displayName ||
    nested?.title ||
    nested?.name ||
    ''
  );
}

/** Mirrors slugifyProfileName in src/app/shared/clases/profileSlug.ts */
function slugifyProfileName(value) {
  return (
    (value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'perfil'
  );
}

/** Mirrors buildProfileSlug in src/app/shared/clases/profileSlug.ts */
function buildProfileSlug(profile) {
  const id = resolveProfileId(profile) || resolveProfileId(profile?.profile);
  const slug = slugifyProfileName(getProfileDisplayName(profile));
  return id ? `${slug}-${id.slice(-6).toLowerCase()}` : slug;
}

function toIsoDate(raw) {
  if (!raw) return '';
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
}

function urlEntry({ loc, lastmod, changefreq, priority }) {
  const parts = [`    <loc>${escapeXml(loc)}</loc>`];
  if (lastmod) parts.push(`    <lastmod>${lastmod}</lastmod>`);
  if (changefreq) parts.push(`    <changefreq>${changefreq}</changefreq>`);
  if (priority) parts.push(`    <priority>${priority}</priority>`);
  return `  <url>\n${parts.join('\n')}\n  </url>`;
}

function buildUrlset(entries) {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries.map(urlEntry),
    '</urlset>',
    ''
  ].join('\n');
}

function buildSitemapIndex(sitemaps) {
  const entries = sitemaps.map(({ loc, lastmod }) => {
    const parts = [`    <loc>${escapeXml(loc)}</loc>`];
    if (lastmod) parts.push(`    <lastmod>${lastmod}</lastmod>`);
    return `  <sitemap>\n${parts.join('\n')}\n  </sitemap>`;
  });
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries,
    '</sitemapindex>',
    ''
  ].join('\n');
}

function normalizeProfilesPayload(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.profiles)) return payload.profiles;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

/** Inactive, private or deleted profiles must never reach the sitemap. */
function isIndexableProfile(profile) {
  return profile?.isActiveProfile === true && !!resolveProfileId(profile);
}

async function fetchProfiles() {
  const response = await fetch(PROFILES_API, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ${response.statusText}`);
  }
  return normalizeProfilesPayload(await response.json());
}

function buildProfileEntries(profiles) {
  const byLoc = new Map();
  for (const profile of profiles.filter(isIndexableProfile)) {
    const loc = `${SITE_URL}/profile/${buildProfileSlug(profile)}`;
    if (byLoc.has(loc)) continue;
    byLoc.set(loc, {
      loc,
      lastmod: toIsoDate(profile.updatedAt || profile.createdAt),
      changefreq: 'weekly',
      priority: '0.8'
    });
  }
  return [...byLoc.values()].sort((a, b) => a.loc.localeCompare(b.loc));
}

async function main() {
  const outDir = parseOutDir(process.argv.slice(2));
  if (!existsSync(outDir)) {
    throw new Error(`Build output not found: ${outDir}. Run "ng build" first.`);
  }

  let profiles;
  try {
    profiles = await fetchProfiles();
  } catch (error) {
    console.warn(`[sitemap] WARNING: profiles API unavailable (${error.message}).`);
    console.warn('[sitemap] Keeping the fallback src/sitemap.xml for this deploy.');
    return;
  }

  const profileEntries = buildProfileEntries(profiles);
  const latestProfileUpdate = profileEntries
    .map((entry) => entry.lastmod)
    .filter(Boolean)
    .sort()
    .pop();

  writeFileSync(join(outDir, 'sitemap-static.xml'), buildUrlset(STATIC_URLS), 'utf8');
  writeFileSync(join(outDir, 'sitemap-profiles.xml'), buildUrlset(profileEntries), 'utf8');
  writeFileSync(
    join(outDir, 'sitemap.xml'),
    buildSitemapIndex([
      { loc: `${SITE_URL}/sitemap-static.xml` },
      { loc: `${SITE_URL}/sitemap-profiles.xml`, lastmod: latestProfileUpdate }
    ]),
    'utf8'
  );

  console.log(`[sitemap] Output: ${outDir}`);
  console.log(`[sitemap] Static URLs: ${STATIC_URLS.length}`);
  console.log(`[sitemap] Profile URLs: ${profileEntries.length} (API records: ${profiles.length})`);
}

main().catch((error) => {
  console.error('[sitemap] Generation failed:', error.message || error);
  process.exit(1);
});
