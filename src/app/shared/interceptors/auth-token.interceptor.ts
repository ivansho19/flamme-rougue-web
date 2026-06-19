import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

const AUTH_SKIP_URL_PARTS = [
  '/auth/login',
  '/auth/register',
  '/auth/registerClient',
  '/auth/forgot-password'
];

const EXTERNAL_HOST_SKIP = [
  'cloudinary.com',
  'paypal.com'
];

function isBackendApiRequest(url: string): boolean {
  try {
    const requestUrl = new URL(url);
    const apiBase = new URL(environment.api_profile);
    return requestUrl.origin === apiBase.origin && requestUrl.pathname.startsWith('/api');
  } catch {
    return false;
  }
}

export const authTokenInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');

  if (
    !token
    || AUTH_SKIP_URL_PARTS.some(part => req.url.includes(part))
    || EXTERNAL_HOST_SKIP.some(host => req.url.includes(host))
    || !isBackendApiRequest(req.url)
  ) {
    return next(req);
  }

  if (req.headers.has('Authorization')) {
    return next(req);
  }

  return next(
    req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    })
  );
};
