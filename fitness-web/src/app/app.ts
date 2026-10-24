import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeStore } from './core/theme.store';
import { ConfirmDialog } from './shared/confirm-dialog';
import { ToastHost } from './shared/toast-host';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastHost, ConfirmDialog],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <router-outlet />
    <app-toast-host />
    <app-confirm-dialog />
  `,
})
export class App {
  // created here so the saved theme is applied on startup
  private readonly theme = inject(ThemeStore);
}
