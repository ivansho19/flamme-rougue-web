import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { switchMap } from 'rxjs';
import { requiresForwardedForHeader } from '../clases/public-read-api';
import { UserIpService } from '../services/user-ip/user-ip.service';

export const forwardedForInterceptor: HttpInterceptorFn = (req, next) => {
  if (!requiresForwardedForHeader(req.url) || req.headers.has('x-forwarded-for')) {
    return next(req);
  }

  const userIpService = inject(UserIpService);

  return userIpService.getClientIp().pipe(
    switchMap(ip => {
      if (!ip) {
        return next(req);
      }

      return next(
        req.clone({
          setHeaders: {
            'x-forwarded-for': ip
          }
        })
      );
    })
  );
};
