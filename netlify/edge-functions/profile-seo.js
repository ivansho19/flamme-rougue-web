/**
 * Netlify Edge Function: per-profile SEO tags in the initial HTML of /profile/:slug.
 *
 * The SPA serves the same index.html for every route, so crawlers that read the
 * raw HTML saw the home title/description on every profile. This function fills
 * title, description, canonical, Open Graph and Twitter tags with the profile's
 * real data before the response leaves the edge. Angular's SeoService later sets
 * the same values client-side, so both must stay in sync.
 *
 * Fail-safe: any error, timeout, unknown or inactive profile → original HTML.
 *
 * Env (optional): PROFILE_SEO_API overrides the profiles endpoint (e.g. QA site).
 */

const SITE_URL = 'https://flammesrouges.com';
const DEFAULT_PROFILES_API =
  'https://flamme-rouge-backend-production-251b.up.railway.app/api/profiles/getAllProfiles';
const FETCH_TIMEOUT_MS = 2500;
const CACHE_TTL_MS = 5 * 60 * 1000;

let cache = { at: 0, profiles: null };

function readEnv(name) {
  try {
    return globalThis.Netlify?.env?.get(name) || '';
  } catch {
    return '';
  }
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

/** Mirrors parseProfileRouteParam in src/app/shared/clases/profileSlug.ts */
export function parseProfileParam(param) {
  const value = decodeURIComponent(param || '').trim();
  if (/^[a-f\d]{24}$/i.test(value)) {
    return { objectId: value.toLowerCase() };
  }
  const short = value.match(/-([a-f\d]{6})$/i);
  return short ? { shortId: short[1].toLowerCase() } : null;
}

/** Mirrors SeoService.toMetaDescription */
function toMetaDescription(text, maxLength = 155) {
  const clean = (text || '').replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLength) return clean;
  const cut = clean.slice(0, maxLength - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > maxLength * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:.–—-]+$/, '')}…`;
}

/** Same values SeoService.applyProfile sets client-side. */
export function buildProfileSeo(profile) {
  const name = (getProfileDisplayName(profile) || 'Perfil').trim();
  const bio = profile?.bio || profile?.description || '';
  return {
    title: `${name} | Flammes Rouges`,
    description:
      toMetaDescription(bio) ||
      `Perfil de ${name} en Flammes Rouges. Plataforma de citas en las mejores ciudades de Europa.`,
    url: `${SITE_URL}/profile/${buildProfileSlug(profile)}`,
    image: profile?.imagesMain?.url || `${SITE_URL}/assets/images/new_logo.png`
  };
}

export function findActiveProfile(profiles, parsed) {
  if (!parsed || !Array.isArray(profiles)) return null;
  const match = profiles.find((profile) => {
    const id = resolveProfileId(profile).toLowerCase();
    if (!id) return false;
    return parsed.objectId ? id === parsed.objectId : id.endsWith(parsed.shortId);
  });
  return match?.isActiveProfile === true ? match : null;
}

function escapeAttr(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function upsertTag(html, pattern, tag) {
  return pattern.test(html) ? html.replace(pattern, tag) : html.replace('</head>', `${tag}\n</head>`);
}

export function injectProfileSeo(html, seo) {
  const title = escapeAttr(seo.title);
  const description = escapeAttr(seo.description);
  const url = escapeAttr(seo.url);
  const image = escapeAttr(seo.image);

  const tags = [
    [/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`],
    [/<meta name="description"[^>]*>/, `<meta name="description" content="${description}">`],
    [/<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${url}">`],
    [/<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${title}">`],
    [/<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${description}">`],
    [/<meta property="og:url"[^>]*>/, `<meta property="og:url" content="${url}">`],
    [/<meta property="og:image"[^>]*>/, `<meta property="og:image" content="${image}">`],
    [/<meta name="twitter:title"[^>]*>/, `<meta name="twitter:title" content="${title}">`],
    [/<meta name="twitter:description"[^>]*>/, `<meta name="twitter:description" content="${description}">`],
    [/<meta name="twitter:image"[^>]*>/, `<meta name="twitter:image" content="${image}">`]
  ];

  return tags.reduce((acc, [pattern, tag]) => upsertTag(acc, pattern, tag), html);
}

async function getProfiles() {
  if (cache.profiles && Date.now() - cache.at < CACHE_TTL_MS) {
    return cache.profiles;
  }
  try {
    const response = await fetch(readEnv('PROFILE_SEO_API') || DEFAULT_PROFILES_API, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    const profiles = Array.isArray(payload) ? payload : payload?.profiles ?? payload?.data ?? [];
    cache = { at: Date.now(), profiles };
    return profiles;
  } catch (error) {
    console.warn(`[profile-seo] profiles API unavailable: ${error?.message || error}`);
    return cache.profiles;
  }
}

function parseRequest(request) {
  try {
    return parseProfileParam(new URL(request.url).pathname.split('/')[2] || '');
  } catch {
    return null;
  }
}

export default async function profileSeo(request, context) {
  const parsed = request.method === 'GET' ? parseRequest(request) : null;
  if (!parsed) {
    return context.next();
  }

  const [profiles, response] = await Promise.all([getProfiles(), context.next()]);
  const profile = findActiveProfile(profiles, parsed);
  const contentType = response.headers.get('content-type') || '';
  if (!profile || !response.ok || !contentType.includes('text/html')) {
    return response;
  }

  const headers = new Headers(response.headers);
  headers.delete('content-length');
  headers.delete('content-encoding');

  const original = await response.text();
  let html = original;
  try {
    html = injectProfileSeo(original, buildProfileSeo(profile));
    headers.set('x-profile-seo', 'hit');
  } catch (error) {
    console.warn(`[profile-seo] passthrough after error: ${error?.message || error}`);
  }
  return new Response(html, { status: response.status, headers });
}

export const config = { path: '/profile/*' };
