const PUBLIC_READ_URL_PARTS = [
  '/profiles/getProfile/',
  '/profiles/getAllProfiles',
  '/profiles/searchProfiles',
  '/comments/profile/',
];

const FORWARDED_FOR_URL_PARTS = [
  '/profiles/getProfile/',
  '/profiles/getAllProfiles',
  '/profiles/searchProfiles',
  '/top-rojo/all',
];

export function isPublicReadRequest(url: string): boolean {
  if (url.includes('/ratings/profile/') && url.includes('/user/')) {
    return false;
  }

  if (url.includes('/ratings/profile/')) {
    return true;
  }

  return PUBLIC_READ_URL_PARTS.some(part => url.includes(part));
}

export function isUserLoggedIn(): boolean {
  return !!localStorage.getItem('token');
}

export function requiresForwardedForHeader(url: string): boolean {
  return FORWARDED_FOR_URL_PARTS.some(part => url.includes(part));
}
