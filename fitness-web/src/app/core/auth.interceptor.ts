import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthStore } from './auth.store';

/**
 * Adds "Authorization: Bearer <token>" to every API request
 * and logs the user out when the server says the token is no longer valid (401).
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthStore);
  const token = auth.token();
  const isAuthCall = req.url.includes('/Auth/');

  const request = token && !isAuthCall ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(request).pipe(
    catchError((err: unknown) => {
      if (err instanceof HttpErrorResponse && err.status === 401 && !isAuthCall) {
        auth.logout('expired');
      }
      return throwError(() => err);
    }),
  );
};
