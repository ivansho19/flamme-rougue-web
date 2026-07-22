import { resolveProfileId } from './resolveProfileId';

export type ProfileSlugSource = {
  displayName?: string;
  title?: string;
  name?: string;
  publicName?: string;
  _id?: unknown;
  id?: unknown;
  profileId?: unknown;
  profile?: unknown;
};

export function slugifyProfileName(value: string): string {
  return (
    (value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'perfil'
  );
}

export function isMongoObjectId(value: string): boolean {
  return /^[a-f\d]{24}$/i.test((value || '').trim());
}

export function getProfileDisplayName(profile: ProfileSlugSource | null | undefined): string {
  if (!profile) {
    return '';
  }

  const nested =
    profile.profile && typeof profile.profile === 'object'
      ? (profile.profile as ProfileSlugSource)
      : null;

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

/** SEO slug: nombre-amigable + últimos 6 chars del id (unicidad sin exponer el ObjectId completo). */
export function buildProfileSlug(profile: ProfileSlugSource | null | undefined): string {
  const id = resolveProfileId(profile) || resolveProfileId(profile?.profile);
  const slug = slugifyProfileName(getProfileDisplayName(profile));

  if (id) {
    return `${slug}-${id.slice(-6).toLowerCase()}`;
  }

  return slug;
}

export function buildProfileUrl(profile: ProfileSlugSource | null | undefined): string {
  return `/profile/${buildProfileSlug(profile)}`;
}

export function getProfileRouterCommands(profile: ProfileSlugSource | null | undefined): string[] {
  return ['/profile', buildProfileSlug(profile)];
}

export function parseProfileRouteParam(param: string): {
  isObjectId: boolean;
  objectId?: string;
  slugBase: string;
  shortId?: string;
} {
  const value = (param || '').trim();

  if (isMongoObjectId(value)) {
    return { isObjectId: true, objectId: value, slugBase: value };
  }

  const shortMatch = value.match(/^(.*)-([a-f\d]{6})$/i);
  if (shortMatch?.[1]) {
    return {
      isObjectId: false,
      slugBase: shortMatch[1],
      shortId: shortMatch[2].toLowerCase()
    };
  }

  return { isObjectId: false, slugBase: value };
}

export function profileMatchesRouteParam(
  profile: ProfileSlugSource,
  parsed: ReturnType<typeof parseProfileRouteParam>
): boolean {
  const id = (resolveProfileId(profile) || resolveProfileId(profile.profile)).toLowerCase();
  const nameSlug = slugifyProfileName(getProfileDisplayName(profile));

  if (parsed.isObjectId && parsed.objectId) {
    return id === parsed.objectId.toLowerCase();
  }

  if (parsed.shortId) {
    return id.endsWith(parsed.shortId.toLowerCase());
  }

  return nameSlug === parsed.slugBase;
}
