import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from './auth.store';

/** Only logged-in users */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthStore);
  return auth.isLoggedIn() ? true : inject(Router).createUrlTree(['/login']);
};

/** Only users with the Admin role */
export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthStore);
  if (!auth.isLoggedIn()) return inject(Router).createUrlTree(['/login']);
  return auth.isAdmin() ? true : inject(Router).createUrlTree(['/']);
};

/** Login/register pages: already logged in -> go to the dashboard */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthStore);
  return auth.isLoggedIn() ? inject(Router).createUrlTree(['/']) : true;
};
