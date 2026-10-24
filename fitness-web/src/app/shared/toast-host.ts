import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastStore } from '../core/toast.store';
import { Icon } from './icon';

@Component({
  selector: 'app-toast-host',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toasts" aria-live="polite">
      @for (t of store.toasts(); track t.id) {
        <div class="toast" [class.error]="t.kind === 'error'" role="status">
          <app-icon [name]="t.kind === 'error' ? 'alert' : 'check'" [size]="18" />
          <span>{{ t.text }}</span>
          <button class="icon-btn" type="button" (click)="store.dismiss(t.id)" aria-label="Dismiss">
            <app-icon name="x" [size]="16" />
          </button>
        </div>
      }
    </div>
  `,
  styles: `
    .toasts {
      position: fixed;
      z-index: 60;
      right: 20px;
      bottom: 20px;
      display: grid;
      gap: 10px;
      width: min(380px, calc(100vw - 32px));
    }
    .toast {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 8px 8px 14px;
      border-radius: 12px;
      background: var(--surface);
      border: 1px solid var(--line);
      border-left: 4px solid var(--green);
      box-shadow: var(--shadow-pop);
      animation: toast-in 0.2s ease-out;
    }
    .toast app-icon { color: var(--green); }
    .toast.error { border-left-color: var(--red); }
    .toast.error app-icon:first-child { color: var(--red); }
    .toast span { flex: 1; font-size: 0.92rem; }
    @keyframes toast-in {
      from { opacity: 0; transform: translateY(8px); }
    }
    @media (max-width: 768px) {
      .toasts {
        left: 16px;
        right: 16px;
        width: auto;
        bottom: calc(var(--bottom-nav) + 12px + env(safe-area-inset-bottom));
      }
    }
  `,
})
export class ToastHost {
  protected readonly store = inject(ToastStore);
}
