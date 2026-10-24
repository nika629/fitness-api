import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found-page',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="wrap">
      <p class="num code">404</p>
      <h1>This page doesn't exist</h1>
      <p class="muted">The link may be old or mistyped.</p>
      <a class="btn btn-primary" routerLink="/">Go to Today</a>
    </main>
  `,
  styles: `
    .wrap { min-height: 100dvh; display: grid; place-content: center; justify-items: start; gap: 12px; padding: 24px; }
    .code { font-size: 7rem; color: var(--red); }
  `,
})
export class NotFoundPage {}
