import { HttpErrorResponse } from '@angular/common/http';

/** All API calls go to the same origin (/api). In development, proxy.conf.json forwards them to ASP.NET Core. */
export const API = '/api';

/** Turns any HTTP error into one readable sentence for the user. */
export function errorMessage(err: unknown): string {
  if (err instanceof HttpErrorResponse) {
    if (err.status === 0) return "Can't reach the server. Check your connection and try again.";

    const body = err.error;
    if (body && typeof body === 'object') {
      if (typeof body.message === 'string' && body.message) return body.message;
      // ASP.NET validation errors: { errors: { Field: ["message"] } }
      if (body.errors && typeof body.errors === 'object') {
        const first = Object.values(body.errors as Record<string, string[]>)[0];
        if (Array.isArray(first) && first.length) return first[0];
      }
      if (typeof body.title === 'string') return body.title;
    }
    if (err.status === 401) return 'Your session has ended. Log in again.';
    if (err.status === 403) return "You don't have permission to do that.";
    if (err.status === 404) return "That item doesn't exist anymore.";
    if (err.status >= 500) return 'The server ran into a problem. Try again in a moment.';
  }
  return 'Something went wrong. Try again.';
}

/** "2026-10-24" for a Date, in the user's local time zone */
export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
