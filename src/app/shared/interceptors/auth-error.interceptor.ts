import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthSessionService } from '../services/auth-session/auth-session.service';

export const authErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const authSessionService = inject(AuthSessionService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const isUnauthorized = error.status === 401;
      const isLoginRoute = router.url.startsWith('/auth/login');
      const isAuthLoginRequest = req.url.includes('/auth/login');

      if (isUnauthorized && !isLoginRoute && !isAuthLoginRequest) {
        authSessionService.logout(true);
      }

      return throwError(() => error);
    })
  );
};
